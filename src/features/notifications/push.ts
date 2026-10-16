import { requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { registerPushDevice, removePushDevice } from '@/api/notifications';

/**
 * Push notifications on this phone. expo-notifications is loaded only when
 * its native code is in the installed app build, so an older build keeps
 * working (just without notifications) instead of crashing.
 */

type NotificationsModule = typeof import('expo-notifications');

const TOKEN_KEY = 'mukham.pushToken';
const ASKED_KEY = 'mukham.pushAsked';
// This app install's secret: proves to the server that a push address really
// is this phone's, so nobody else can move it to their account. Kept across
// sign-outs, so the next person on this phone can take the address over.
const INSTALL_KEY = 'mukham.installKey';
export const CHANNEL_ID = 'reminders';

export type PushPermission = 'granted' | 'denied' | 'undetermined' | 'unavailable';

let loaded: NotificationsModule | null | undefined;

/** The notifications module, or null when this app build doesn't include it. */
export function notifications(): NotificationsModule | null {
  if (loaded === undefined) {
    loaded =
      Platform.OS !== 'web' && requireOptionalNativeModule('ExpoPushTokenManager')
        ? // eslint-disable-next-line @typescript-eslint/no-require-imports
          (require('expo-notifications') as NotificationsModule)
        : null;
    // Show notifications even while the app is open.
    loaded?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
  return loaded;
}

export async function getPushPermission(): Promise<PushPermission> {
  const n = notifications();
  if (!n) return 'unavailable';
  const { status } = await n.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/** Android needs a channel before the first notification; this one is "Reminders". */
async function ensureChannel(n: NotificationsModule): Promise<void> {
  if (Platform.OS === 'android') {
    await n.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Reminders',
      importance: n.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

/** Shows the phone's own permission question. Remembers that we asked. */
export async function askPushPermission(): Promise<PushPermission> {
  const n = notifications();
  if (!n) return 'unavailable';
  await markPushAsked();
  await ensureChannel(n);
  const { status } = await n.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

/** This install's secret, made on first use; null on an app build without expo-crypto. */
async function installKey(): Promise<string | null> {
  const saved = await SecureStore.getItemAsync(INSTALL_KEY);
  if (saved) return saved;
  if (!requireOptionalNativeModule('ExpoCrypto')) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Crypto = require('expo-crypto') as typeof import('expo-crypto');
  const bytes = Crypto.getRandomBytes(32);
  const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(INSTALL_KEY, key);
  return key;
}

/**
 * When allowed: gets this phone's push address from Expo and gives it to
 * the server for the signed-in person. Safe to call on every app start.
 */
export async function registerForPush(): Promise<boolean> {
  const n = notifications();
  if (!n || (await getPushPermission()) !== 'granted') return false;
  await ensureChannel(n);
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data: token } = await n.getExpoPushTokenAsync({ projectId });
  await registerPushDevice(token, Platform.OS === 'ios' ? 'ios' : 'android', await installKey());
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  return true;
}

/** At sign-out, while the session still works: the server forgets this phone. */
export async function unregisterFromPush(): Promise<void> {
  if (Platform.OS === 'web') return;
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return;
  try {
    await removePushDevice(token);
  } catch {
    // Offline: sign-out still goes ahead; the server also drops the
    // address if another person later signs in on this phone.
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

/** This phone's push address, if it has given one to the server. */
export async function savedPushToken(): Promise<string | null> {
  return Platform.OS === 'web' ? null : SecureStore.getItemAsync(TOKEN_KEY);
}

export async function wasPushAsked(): Promise<boolean> {
  return Platform.OS === 'web' || (await SecureStore.getItemAsync(ASKED_KEY)) === 'yes';
}

export async function markPushAsked(): Promise<void> {
  if (Platform.OS !== 'web') await SecureStore.setItemAsync(ASKED_KEY, 'yes');
}
