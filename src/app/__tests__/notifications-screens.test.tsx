import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import '@/i18n';

import NotificationsIntroScreen from '@/app/(employee)/notifications-intro';
import { NotificationSettings } from '@/features/notifications/notification-settings';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ router: { back: () => mockBack(), push: jest.fn() } }));

const mockPush = {
  getPushPermission: jest.fn(),
  askPushPermission: jest.fn(),
  registerForPush: jest.fn(),
  markPushAsked: jest.fn(),
};
jest.mock('@/features/notifications/push', () => ({
  getPushPermission: () => mockPush.getPushPermission(),
  askPushPermission: () => mockPush.askPushPermission(),
  registerForPush: () => mockPush.registerForPush(),
  markPushAsked: () => mockPush.markPushAsked(),
}));

const mockPrefs = { get: jest.fn(), set: jest.fn() };
jest.mock('@/api/notifications', () => ({
  getNotificationPreferences: () => mockPrefs.get(),
  setNotificationPreferences: (c: unknown) => mockPrefs.set(c),
}));

async function show(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return await render(ui, { wrapper });
}

beforeEach(() => jest.clearAllMocks());

describe('the explanation before asking', () => {
  it('asks the phone, registers when allowed, and closes', async () => {
    mockPush.askPushPermission.mockResolvedValue('granted');
    await show(<NotificationsIntroScreen />);
    expect(screen.getByText('Get reminders?')).toBeTruthy();
    await fireEvent.press(screen.getByText('Turn on reminders'));
    await waitFor(() => expect(mockPush.registerForPush).toHaveBeenCalled());
    expect(mockBack).toHaveBeenCalled();
  });

  it('"Not now" remembers the answer and asks nothing', async () => {
    await show(<NotificationsIntroScreen />);
    await fireEvent.press(screen.getByText('Not now'));
    await waitFor(() => expect(mockPush.markPushAsked).toHaveBeenCalled());
    expect(mockPush.askPushPermission).not.toHaveBeenCalled();
  });
});

describe('Profile › Notifications', () => {
  it('shows a switch for each kind and saves a change', async () => {
    mockPush.getPushPermission.mockResolvedValue('granted');
    mockPrefs.get.mockResolvedValue({ shift_start: true, check_out: true, new_task: true });
    mockPrefs.set.mockResolvedValue({ shift_start: true, check_out: true, new_task: false });
    await show(<NotificationSettings />);

    const tasks = await screen.findByLabelText('New tasks');
    expect(screen.getByLabelText('Before my shift')).toBeTruthy();
    await fireEvent(tasks, 'valueChange', false);
    await waitFor(() => expect(mockPrefs.set).toHaveBeenCalledWith({ new_task: false }));
  });

  it('points to the phone settings when notifications are blocked there', async () => {
    mockPush.getPushPermission.mockResolvedValue('denied');
    await show(<NotificationSettings />);
    expect(await screen.findByText("Notifications are turned off for Mukham in your phone's settings.")).toBeTruthy();
    expect(screen.getByText('Open settings')).toBeTruthy();
  });

  it('offers to turn reminders on when never asked', async () => {
    mockPush.getPushPermission.mockResolvedValue('undetermined');
    mockPush.askPushPermission.mockResolvedValue('granted');
    mockPrefs.get.mockResolvedValue({ shift_start: true, check_out: true, new_task: true });
    await show(<NotificationSettings />);
    await fireEvent.press(await screen.findByText('Turn on reminders'));
    await waitFor(() => expect(mockPush.registerForPush).toHaveBeenCalled());
    expect(await screen.findByLabelText('If I forget to check out')).toBeTruthy();
  });
});
