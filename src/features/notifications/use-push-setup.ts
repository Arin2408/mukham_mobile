import type { NotificationResponse } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { getPushPermission, notifications, registerForPush, wasPushAsked } from './push';

/** Only paths the employee app has; anything else opens Home. */
function screenFor(url: unknown): Href {
  return typeof url === 'string' && /^\/(task\/\d+)?$/.test(url) ? (url as Href) : '/';
}

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

    const handled = new Set<string>();
    const open = (response: NotificationResponse | null | undefined) => {
      if (!response || handled.has(response.notification.request.identifier)) return;
      handled.add(response.notification.request.identifier);
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
