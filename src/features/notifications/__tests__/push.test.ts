const mockNative = jest.fn();
jest.mock('expo', () => ({ requireOptionalNativeModule: (name: string) => mockNative(name) }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'project-123' } } } }));

const mockStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => mockStore.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void mockStore.set(k, v),
  deleteItemAsync: async (k: string) => void mockStore.delete(k),
}));

const mockN = {
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[abc]' })),
  AndroidImportance: { HIGH: 6 },
};
jest.mock('expo-notifications', () => mockN);
jest.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(171) }));

const mockRegister = jest.fn();
const mockRemove = jest.fn();
jest.mock('@/api/notifications', () => ({
  registerPushDevice: (...a: unknown[]) => mockRegister(...a),
  removePushDevice: (...a: unknown[]) => mockRemove(...a),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  mockStore.clear();
});

// Fresh module each test: it caches whether the native code exists.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const load = () => require('@/features/notifications/push') as typeof import('@/features/notifications/push');

describe('push notifications on this phone', () => {
  it('says unavailable, without crashing, on an app build without the module', async () => {
    mockNative.mockReturnValue(null);
    const push = load();
    await expect(push.getPushPermission()).resolves.toBe('unavailable');
    await expect(push.registerForPush()).resolves.toBe(false);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('registers the phone with the project id once allowed, and remembers the address', async () => {
    mockNative.mockReturnValue({});
    mockN.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const push = load();
    await expect(push.registerForPush()).resolves.toBe(true);
    expect(mockN.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-123' });
    // Channels exist only on Android (the tests run as iPhone by default).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    if (require('react-native').Platform.OS === 'android') {
      expect(mockN.setNotificationChannelAsync).toHaveBeenCalledWith('reminders', expect.objectContaining({ name: 'Reminders' }));
    } else {
      expect(mockN.setNotificationChannelAsync).not.toHaveBeenCalled();
    }
    // With this install's secret key (32 random bytes as hex), kept for next time.
    const key = 'ab'.repeat(32);
    expect(mockRegister).toHaveBeenCalledWith('ExponentPushToken[abc]', expect.stringMatching(/android|ios/), key);
    expect(mockStore.get('mukham.pushToken')).toBe('ExponentPushToken[abc]');
    expect(mockStore.get('mukham.installKey')).toBe(key);
  });

  it('keeps the same install key across sign-outs, so the next person on this phone can take the address over', async () => {
    mockNative.mockReturnValue({});
    mockN.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockStore.set('mukham.installKey', 'saved-key');
    const push = load();
    await push.registerForPush();
    await push.unregisterFromPush();
    await push.registerForPush();
    expect(mockRegister).toHaveBeenNthCalledWith(1, expect.any(String), expect.any(String), 'saved-key');
    expect(mockRegister).toHaveBeenNthCalledWith(2, expect.any(String), expect.any(String), 'saved-key');
    expect(mockStore.get('mukham.installKey')).toBe('saved-key');
  });

  it('registers without a key on an app build without expo-crypto', async () => {
    mockNative.mockImplementation((name: string) => (name === 'ExpoCrypto' ? null : {}));
    mockN.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
    await load().registerForPush();
    expect(mockRegister).toHaveBeenCalledWith('ExponentPushToken[abc]', expect.any(String), null);
  });

  it("doesn't register without permission", async () => {
    mockNative.mockReturnValue({});
    mockN.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    await expect(load().registerForPush()).resolves.toBe(false);
    expect(mockN.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('forgets the phone at sign-out, even when offline', async () => {
    mockNative.mockReturnValue({});
    mockStore.set('mukham.pushToken', 'ExponentPushToken[abc]');
    mockRemove.mockRejectedValue(new Error('offline'));
    await load().unregisterFromPush();
    expect(mockRemove).toHaveBeenCalledWith('ExponentPushToken[abc]');
    expect(mockStore.has('mukham.pushToken')).toBe(false);
  });

  it('remembers that it asked, so the explanation shows only once', async () => {
    mockNative.mockReturnValue({});
    mockN.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const push = load();
    await expect(push.wasPushAsked()).resolves.toBe(false);
    await expect(push.askPushPermission()).resolves.toBe('denied');
    await expect(push.wasPushAsked()).resolves.toBe(true);
  });
});
