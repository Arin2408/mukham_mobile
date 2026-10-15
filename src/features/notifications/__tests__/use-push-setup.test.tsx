import { act, renderHook } from '@testing-library/react-native';

import { usePushSetup } from '../use-push-setup';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));

// The last notification the phone remembers being tapped: "New task" #42.
const lastTap = {
  notification: { request: { identifier: 'tap-1', content: { data: { url: '/task/42' } } } },
};
const mockN = {
  getLastNotificationResponseAsync: jest.fn(async () => lastTap),
  clearLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
};
jest.mock('../push', () => ({
  notifications: () => mockN,
  getPushPermission: async () => 'unavailable',
  registerForPush: async () => {},
  wasPushAsked: async () => true,
}));

describe('opening the screen for a tapped notification', () => {
  it('opens it once, and not again when the employee screens mount again (e.g. after signing back in)', async () => {
    const first = await renderHook(() => usePushSetup());
    await act(async () => {});
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/task/42');
    // The phone is told to forget it, so it isn't reported again.
    expect(mockN.clearLastNotificationResponse).toHaveBeenCalled();

    await first.unmount();
    await renderHook(() => usePushSetup());
    await act(async () => {});
    expect(mockPush).toHaveBeenCalledTimes(1);
  });
});
