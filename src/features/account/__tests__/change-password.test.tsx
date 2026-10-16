import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import '@/i18n';

import { changePassword } from '@/api/auth';

import { ChangePasswordScreen } from '../change-password-screen';

jest.mock('@/api/auth', () => ({ changePassword: jest.fn() }));
jest.mock('@/features/notifications/push', () => ({ savedPushToken: async () => null }));
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

const mockChange = changePassword as jest.MockedFunction<typeof changePassword>;

async function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <ChangePasswordScreen />
    </QueryClientProvider>,
  );
}

async function fill(current: string, next: string, confirm: string) {
  await fireEvent.changeText(screen.getByLabelText('Current password'), current);
  await fireEvent.changeText(screen.getByLabelText('New password'), next);
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), confirm);
  await fireEvent.press(screen.getAllByText('Change password').at(-1)!);
}

beforeEach(() => mockChange.mockReset());

describe('change password', () => {
  it("doesn't send a new password that is too short or typed differently twice", async () => {
    await setup();
    await fill('old-pass', 'short', 'short');
    expect(screen.getByText('The new password must be at least 8 characters.')).toBeTruthy();

    await fill('old-pass', 'new-pass-1', 'new-pass-2');
    expect(screen.getByText("The new passwords don't match.")).toBeTruthy();
    expect(mockChange).not.toHaveBeenCalled();
  });

  it('changes it and confirms', async () => {
    mockChange.mockResolvedValueOnce({ message: 'ok' });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await setup();
    await fill('old-pass', 'new-pass-1', 'new-pass-1');

    expect(mockChange).toHaveBeenCalledWith('old-pass', 'new-pass-1', null);
    expect(alert).toHaveBeenCalledWith('Password changed', expect.any(String), expect.any(Array));
  });
});
