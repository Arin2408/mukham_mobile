import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const DEV_API_PORT = 8002;

/**
 * Where the FastAPI backend lives.
 *
 * - EXPO_PUBLIC_API_URL wins when set (staging and production builds).
 * - In development the backend runs on the same laptop as the Expo dev
 *   server, so we reuse the dev server's host. On a phone that is the
 *   laptop's Wi-Fi address, which is what makes "run it on my phone" work
 *   with no configuration.
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${DEV_API_PORT}/api/v1`;
  }

  let devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  // An Android emulator reaches the laptop at 10.0.2.2: its own "localhost"
  // is the emulator itself. (Happens when the dev server is reached over
  // the emulator's localhost bridge instead of Wi-Fi.)
  if (Platform.OS === 'android' && !Device.isDevice && (devHost === 'localhost' || devHost === '127.0.0.1')) {
    devHost = '10.0.2.2';
  }
  if (devHost) {
    return `http://${devHost}:${DEV_API_PORT}/api/v1`;
  }

  return `http://localhost:${DEV_API_PORT}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

/** The backend's origin, for files it serves such as /media/... photos. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/, '');

/** A full URL for a server file path such as "/media/photos/1.jpg". */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

const DEV_WEB_PORT = 3000;

/**
 * Where the web app lives, for links such as the ID card's /verify page.
 * EXPO_PUBLIC_WEB_URL in real builds; in development, the laptop's
 * Next.js server next to the backend.
 */
export function resolveWebBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }
  const host = API_BASE_URL.match(/^https?:\/\/([^/:]+)/)?.[1] ?? 'localhost';
  return `http://${host}:${DEV_WEB_PORT}`;
}

export const WEB_BASE_URL = resolveWebBaseUrl();
