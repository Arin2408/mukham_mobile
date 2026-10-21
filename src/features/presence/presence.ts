import { requireOptionalNativeModule } from 'expo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ApiError } from '@/api/errors';
import { getPresenceRegion, sendPresenceEvent, type PresenceEvent, type PresenceRegion } from '@/api/presence';
import { CHANNEL_ID, notifications } from '@/features/notifications/push';
import i18n from '@/i18n';

/**
 * Out-of-office time during a shift. After check-in the phone watches the
 * office area (Android geofencing) and tells the server each time it leaves
 * or comes back, with the time it happened. Events wait on the phone while
 * there is no signal and are sent on the next chance.
 *
 * Android doesn't restart an app that was closed from the recent-apps list
 * for a geofence event, so each time the app opens it also compares where
 * the phone is now with where it was last seen (syncPresence).
 *
 * expo-task-manager is loaded only when its native code is in the installed
 * app build, so an older build keeps working, just without tracking.
 */

type TaskManagerModule = typeof import('expo-task-manager');
type LocationModule = typeof import('expo-location');

export const PRESENCE_TASK = 'mukham.office-presence';

const QUEUE_KEY = 'mukham.presenceQueue';
// The region being watched ("lat,lng,radius,attendance"), and whether the
// phone was last inside or outside it.
const REGION_KEY = 'mukham.presenceRegion';
const PLACE_KEY = 'mukham.presencePlace';
// Secure storage values must stay small; a day's moves fit easily.
const MAX_QUEUED = 30;

type Queued = { event: PresenceEvent; at: string };
type Place = 'inside' | 'outside';

let modules: { tasks: TaskManagerModule; location: LocationModule } | null | undefined;

function native() {
  if (modules === undefined) {
    modules =
      Platform.OS !== 'web' && requireOptionalNativeModule('ExpoTaskManager')
        ? {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            tasks: require('expo-task-manager') as TaskManagerModule,
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            location: require('expo-location') as LocationModule,
          }
        : null;
  }
  return modules;
}

/** Whether this app build can watch the office area at all. */
export function presenceAvailable(): boolean {
  return native() != null;
}

// --------------------------------------------------
// Events waiting to be sent
// --------------------------------------------------

async function readQueue(): Promise<Queued[]> {
  try {
    return JSON.parse((await SecureStore.getItemAsync(QUEUE_KEY)) ?? '[]') as Queued[];
  } catch {
    return [];
  }
}

async function queue(event: PresenceEvent, at = new Date()): Promise<void> {
  const waiting = [...(await readQueue()), { event, at: at.toISOString() }].slice(-MAX_QUEUED);
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(waiting));
}

/** Sends waiting events in order; stops at the first one the network can't take. */
export async function flushPresence(): Promise<void> {
  const waiting = await readQueue();
  let sent = 0;
  for (const item of waiting) {
    try {
      await sendPresenceEvent(item.event, item.at);
    } catch (error) {
      // No signal (or too many at once): keep it and the rest for later.
      // Anything else (signed out, checked out) won't get better: drop it.
      if (error instanceof ApiError && (error.code === 'network_error' || error.status === 429)) break;
    }
    sent += 1;
  }
  if (sent > 0) {
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(waiting.slice(sent)));
  }
}

async function notifyLeft(): Promise<void> {
  const n = notifications();
  if (!n || (await n.getPermissionsAsync()).status !== 'granted') return;
  await n.scheduleNotificationAsync({
    content: {
      title: i18n.t('presence.leftTitle'),
      body: i18n.t('presence.leftBody'),
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}

/** Records a move once: Android can report the same one twice. */
async function moved(place: Place, at = new Date()): Promise<void> {
  if ((await SecureStore.getItemAsync(PLACE_KEY)) === place) return;
  await SecureStore.setItemAsync(PLACE_KEY, place);
  await queue(place === 'outside' ? 'exit' : 'enter', at);
  if (place === 'outside') {
    await notifyLeft().catch(() => {});
  }
}

// --------------------------------------------------
// The background task (must be defined when the JS bundle loads)
// --------------------------------------------------

type GeofenceData = { eventType: number; region: unknown };

const m = native();
if (m && !m.tasks.isTaskDefined(PRESENCE_TASK)) {
  m.tasks.defineTask<GeofenceData>(PRESENCE_TASK, async ({ data, error }) => {
    if (error || !data) return;
    const { GeofencingEventType } = m.location;
    if (data.eventType === GeofencingEventType.Exit) await moved('outside');
    else if (data.eventType === GeofencingEventType.Enter) await moved('inside');
    await flushPresence();
  });
}

// --------------------------------------------------
// Start, keep up to date, stop
// --------------------------------------------------

function regionKey(r: PresenceRegion): string {
  return `${r.latitude},${r.longitude},${r.radius_meters},${r.attendance_id}`;
}

function metersBetween(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Whether "Allow all the time" location is on, or could still be asked for. */
export async function backgroundLocationStatus(): Promise<'granted' | 'askable' | 'blocked' | 'unavailable'> {
  const n = native();
  if (!n) return 'unavailable';
  const permission = await n.location.getBackgroundPermissionsAsync();
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'askable' : 'blocked';
}

/** Asks for "Allow all the time" (on Android 11+ this opens the app's settings page). */
export async function askBackgroundLocation(): Promise<boolean> {
  const n = native();
  if (!n) return false;
  const { granted } = await n.location.requestBackgroundPermissionsAsync();
  return granted;
}

/**
 * Matches the phone to the server: watches the office while checked in,
 * stops when not, catches up on a move missed while the app was closed,
 * and sends whatever is waiting. Safe to call any time.
 */
export async function syncPresence(): Promise<void> {
  const n = native();
  if (!n) return;

  const region = await getPresenceRegion();
  if (!region) {
    await stopPresence();
    return;
  }

  const permission = await n.location.getBackgroundPermissionsAsync();
  if (!permission.granted) {
    // The admin sees "tracking off" rather than a day with no moves.
    await stopWatching();
    await queue('off');
    await flushPresence();
    return;
  }

  const key = regionKey(region);
  const started = await n.location.hasStartedGeofencingAsync(PRESENCE_TASK);
  if (!started || (await SecureStore.getItemAsync(REGION_KEY)) !== key) {
    if ((await SecureStore.getItemAsync(REGION_KEY))?.split(',')[3] !== String(region.attendance_id)) {
      // A new check-in starts inside the office.
      await SecureStore.setItemAsync(PLACE_KEY, 'inside');
    }
    await n.location.startGeofencingAsync(PRESENCE_TASK, [
      {
        identifier: 'office',
        latitude: region.latitude,
        longitude: region.longitude,
        radius: region.radius_meters,
        notifyOnEnter: true,
        notifyOnExit: true,
      },
    ]);
    await SecureStore.setItemAsync(REGION_KEY, key);
    await queue('on');
  }

  // A move while the app was closed: compare the last known position.
  const last = await n.location.getLastKnownPositionAsync({ maxAge: 5 * 60_000, requiredAccuracy: 100 });
  if (last) {
    const distance = metersBetween(last.coords.latitude, last.coords.longitude, region.latitude, region.longitude);
    await moved(distance <= region.radius_meters ? 'inside' : 'outside', new Date(last.timestamp));
  }

  await flushPresence();
}

async function stopWatching(): Promise<void> {
  const n = native();
  if (n && (await n.location.hasStartedGeofencingAsync(PRESENCE_TASK))) {
    await n.location.stopGeofencingAsync(PRESENCE_TASK);
  }
  await SecureStore.deleteItemAsync(REGION_KEY);
}

/** After check-out: nothing more to watch. Waiting events are still sent. */
export async function stopPresence(): Promise<void> {
  await flushPresence();
  await stopWatching();
  await SecureStore.deleteItemAsync(PLACE_KEY);
}

/** On sign-out: stop, and forget anything this person's phone was holding. */
export async function clearPresence(): Promise<void> {
  if (!native()) return;
  await stopPresence().catch(() => {});
  await SecureStore.deleteItemAsync(QUEUE_KEY);
}
