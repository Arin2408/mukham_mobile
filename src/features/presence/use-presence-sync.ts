import { useEffect } from 'react';
import { AppState } from 'react-native';

import { syncPresence } from './presence';

function sync() {
  syncPresence().catch((error) => {
    if (__DEV__) console.warn('[presence] sync failed:', error);
  });
}

/** For a signed-in employee: keeps office-area tracking in step each time the app opens. */
export function usePresenceSync() {
  useEffect(() => {
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, []);
}
