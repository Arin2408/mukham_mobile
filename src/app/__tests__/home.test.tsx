import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import '@/i18n';

import HomeScreen from '@/app/(employee)/(tabs)/index';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const mockProfile = jest.fn();
const mockLatest = jest.fn();
jest.mock('@/api/attendance', () => ({
  getMyProfile: () => mockProfile(),
  getLatestAttendance: () => mockLatest(),
}));

const PROFILE = {
  first_name: 'Asha',
  mobile_number: '9000000302',
  shift_start_time: '09:00:00',
  shift_end_time: '18:00:00',
  office_location: { location_id: 1, location_name: 'HQ Delhi', latitude: 28.6, longitude: 77.2, radius_meters: 200 },
};

async function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return await render(<HomeScreen />, { wrapper });
}

describe('Home', () => {
  it('shows the shift, the office and a Check in button', async () => {
    mockProfile.mockResolvedValue(PROFILE);
    mockLatest.mockResolvedValue(null);

    await renderHome();

    expect(await screen.findByText('Hello, Asha')).toBeTruthy();
    expect(screen.getByText('09:00 - 18:00')).toBeTruthy();
    expect(screen.getByText('HQ Delhi, within 200 m')).toBeTruthy();
    expect(screen.getByText('Not checked in yet')).toBeTruthy();
    expect(screen.getByText('Check in')).toBeTruthy();
  });

  it('offers Check out while checked in', async () => {
    mockProfile.mockResolvedValue(PROFILE);
    mockLatest.mockResolvedValue({ id: 1, check_in: new Date().toISOString(), check_out: null, status: 'On time', hours_worked: null });

    await renderHome();

    expect(await screen.findByText('Check out')).toBeTruthy();
    expect(screen.getByText(/^Checked in at \d\d:\d\d$/)).toBeTruthy();
  });

  it('blocks check-in when no office is assigned', async () => {
    mockProfile.mockResolvedValue({ ...PROFILE, office_location: null });
    mockLatest.mockResolvedValue(null);

    await renderHome();

    expect(await screen.findByText('No office assigned. Ask your admin.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Check in' })).toBeDisabled();
  });
});
