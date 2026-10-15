import type { NotificationResponse } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { getPushPermission, notifications, registerForPush, wasPushAsked } from './push';

/** Only paths the employee app has; anything else opens Home. */
function screenFor(url: unknown): Href {
  return typeof url === 'string' && /^\/(task\/\d+)?$/.test(url) ? (url as Href) : '/';
}

// Notifications already opened, for as long as the app runs: the employee
// screens mount again after each sign-in and must not reopen an old tap.
const handled = new Set<string>();

/**
 * For a signed-in employee: registers this phone for reminders (each app
 * start, so the address stays current), offers the explanation screen once,
 * and opens the right screen when a notification is tapped.
 */
export function usePushSetup() {
  useEffect(() => {
    let active = true;

    (async () => {
      const permission = await getPushPermission();
      if (!active || permission === 'unavailable') return;
      if (permission === 'granted') {
        await registerForPush();
      } else if (permission === 'undetermined' && !(await wasPushAsked())) {
        router.push('/notifications-intro');
      }
    })().catch((error) => {
      if (__DEV__) console.warn('[push] setup failed:', error);
    });

    const n = notifications();
    if (!n) return () => {
      active = false;
    };

    const open = (response: NotificationResponse | null | undefined) => {
      if (!response || handled.has(response.notification.request.identifier)) return;
      handled.add(response.notification.request.identifier);
      // The phone keeps the last tap until told otherwise; it has been dealt with.
      try {
        n.clearLastNotificationResponse();
      } catch {
        // Older builds without it: the handled list above still covers this run.
      }
      router.push(screenFor(response.notification.request.content.data?.url));
    };

    // Opened by tapping a notification while the app was closed.
    n.getLastNotificationResponseAsync().then((response) => active && open(response));
    // Tapped while the app is running.
    const subscription = n.addNotificationResponseReceivedListener(open);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
}
