import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Where the session's tokens are kept: the phone's secure storage
 * (Keychain on iPhone, Keystore on Android), never plain storage.
 *
 * Secure storage does not exist in a browser, so the laptop design preview
 * falls back to localStorage. That preview is for showing screens only and
 * is never shipped to users.
 */

const ACCESS_KEY = 'mukham.accessToken';
const REFRESH_KEY = 'mukham.refreshToken';
const ROLE_KEY = 'mukham.role';

export type Role = 'employee' | 'organization';

const isWeb = Platform.OS === 'web';

async function read(key: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  getAccess: () => read(ACCESS_KEY),
  getRefresh: () => read(REFRESH_KEY),

  async save(tokens: { access: string; refresh: string }) {
    await write(ACCESS_KEY, tokens.access);
    await write(REFRESH_KEY, tokens.refresh);
  },

  /** Who signed in on this phone, so the right tabs open even offline. */
  async getRole(): Promise<Role | null> {
    const role = await read(ROLE_KEY);
    return role === 'employee' || role === 'organization' ? role : null;
  },

  saveRole: (role: Role) => write(ROLE_KEY, role),

  async clear() {
    await remove(ACCESS_KEY);
    await remove(REFRESH_KEY);
    await remove(ROLE_KEY);
  },
};
