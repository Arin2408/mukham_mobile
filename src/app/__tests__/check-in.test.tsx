import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import '@/i18n';

import CheckInScreen from '@/app/(employee)/check-in';
import { ApiError } from '@/api/errors';

// --- stand-ins for the phone and the server ---------------------------------

const mockParams = { action: 'checkin' };
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [{ granted: true, canAskAgain: true }, jest.fn()],
}));

// The AWS face check: "completes" as soon as it appears.
jest.mock('@/features/face/liveness-detector', () => {
  // jest.mock factories can't use imports, only require().
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEffect, useRef } = require('react');
  return {
    livenessAvailable: true,
    LivenessDetector: ({ onComplete }: { onComplete: () => void }) => {
      const done = useRef(false);
      useEffect(() => {
        if (!done.current) {
          done.current = true;
          onComplete();
        }
      });
      return null;
    },
  };
});

const mockGetPosition = jest.fn();
jest.mock('@/features/location/get-position', () => {
  const actual = jest.requireActual('@/features/location/get-position');
  return { ...actual, getPosition: () => mockGetPosition() };
});

jest.mock('@/lib/device-id', () => ({ getDeviceId: async () => 'android-test' }));

jest.mock('@/api/auth', () => ({
  createLivenessSession: jest.fn(async () => ({ session_id: 'sess-1', region: 'ap-south-1' })),
  getLivenessCredentials: jest.fn(async () => ({
    accessKeyId: 'a',
    secretAccessKey: 's',
    sessionToken: 't',
    expiration: '2030-01-01T00:00:00Z',
  })),
}));

const mockMark = jest.fn();
const mockVerify = jest.fn();
jest.mock('@/api/attendance', () => ({
  getMyProfile: async () => ({ mobile_number: '9000000302' }),
  markAttendance: (input: unknown) => mockMark(input),
  verifyCheckInFace: (...args: unknown[]) => mockVerify(...args),
}));

const { PositionError } = jest.requireActual('@/features/location/get-position');

const AT_OFFICE = { latitude: 28.614, longitude: 77.2091, accuracy: 12, mocked: false };

async function renderScreen() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return await render(<CheckInScreen />, { wrapper });
}

beforeEach(() => {
  mockParams.action = 'checkin';
  mockGetPosition.mockReset().mockResolvedValue(AT_OFFICE);
  mockMark.mockReset();
  mockVerify.mockReset().mockResolvedValue({ faceToken: 'ft-1', reason: '' });
});

// --- the paths ---------------------------------------------------------------

describe('check-in screen', () => {
  it('checks in: location, face check, then a clear success', async () => {
    mockMark.mockResolvedValueOnce({
      action: 'checkin',
      status: 'On time',
      check_in: '2026-10-13T03:32:00Z',
      check_out: null,
      hours_worked: null,
      distance_meters: 14.6,
      location_name: 'HQ Delhi',
    });

    await renderScreen();

    expect(await screen.findByText(/^Checked in at \d\d:\d\d$/)).toBeTruthy();
    expect(screen.getByText('HQ Delhi, 15 m from the office')).toBeTruthy();
    expect(screen.getByText('Live face check passed')).toBeTruthy();
    expect(mockVerify).toHaveBeenCalledWith('sess-1', '9000000302');
    expect(mockMark).toHaveBeenCalledWith({
      action: 'checkin',
      ...AT_OFFICE,
      faceToken: 'ft-1',
      isMocked: false,
      deviceId: 'android-test',
    });
  });

  it('explains how far away the office is when outside the geofence', async () => {
    mockMark.mockRejectedValueOnce(
      new ApiError(403, 'outside_geofence', 'You are outside the permitted attendance location.', {
        distance_meters: 2100,
        office_location: 'HQ Delhi',
      }),
    );

    await renderScreen();

    expect(await screen.findByText('Outside the office area')).toBeTruthy();
    expect(screen.getByText('You are 2.1 km from HQ Delhi. Move closer and try again.')).toBeTruthy();
  });

  it('does not check in when the face does not match', async () => {
    mockVerify.mockResolvedValueOnce({ faceToken: null, reason: 'Face does not match the registered employee.' });

    await renderScreen();

    expect(await screen.findByText("The face check didn't pass")).toBeTruthy();
    expect(screen.getByText('Face does not match the registered employee.')).toBeTruthy();
    expect(mockMark).not.toHaveBeenCalled();
  });

  it('sends the fake-GPS flag when Android reports one', async () => {
    mockGetPosition.mockResolvedValueOnce({ ...AT_OFFICE, mocked: true });
    mockMark.mockResolvedValueOnce({
      action: 'checkin',
      check_in: '2026-10-13T03:32:00Z',
      check_out: null,
      hours_worked: null,
      distance_meters: 10,
      location_name: 'HQ Delhi',
      status: 'On time',
    });

    await renderScreen();

    await screen.findByText(/^Checked in at/);
    expect(mockMark).toHaveBeenCalledWith(expect.objectContaining({ isMocked: true }));
  });

  it('links to Settings when location access is blocked', async () => {
    mockGetPosition.mockRejectedValueOnce(new PositionError('permissionBlocked'));

    await renderScreen();

    expect(await screen.findByText('Location access needed')).toBeTruthy();
    expect(screen.getByText('Open settings')).toBeTruthy();
  });

  it('tries again from the start after a poor GPS fix', async () => {
    mockGetPosition.mockRejectedValueOnce(new PositionError('timeout'));
    mockMark.mockResolvedValueOnce({
      action: 'checkin',
      check_in: '2026-10-13T03:32:00Z',
      check_out: null,
      hours_worked: null,
      distance_meters: 10,
      location_name: 'HQ Delhi',
      status: 'On time',
    });

    await renderScreen();

    expect(await screen.findByText(/Couldn't get a GPS fix/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(await screen.findByText(/^Checked in at/)).toBeTruthy();
    expect(mockGetPosition).toHaveBeenCalledTimes(2);
  });

  it('checks out without a face check and shows the hours worked', async () => {
    mockParams.action = 'checkout';
    mockMark.mockResolvedValueOnce({
      action: 'checkout',
      status: 'On time',
      check_in: '2026-10-13T03:32:00Z',
      check_out: '2026-10-13T12:35:00Z',
      hours_worked: 9.05,
      distance_meters: null,
      location_name: null,
    });

    await renderScreen();

    expect(await screen.findByText(/^Checked out at \d\d:\d\d$/)).toBeTruthy();
    expect(screen.getByText('9.1 h worked today')).toBeTruthy();
    expect(mockVerify).not.toHaveBeenCalled();
    expect(mockMark).toHaveBeenCalledWith({ action: 'checkout', ...AT_OFFICE, isMocked: false });
  });

  it('closes with Done', async () => {
    mockMark.mockResolvedValueOnce({
      action: 'checkin',
      check_in: '2026-10-13T03:32:00Z',
      check_out: null,
      hours_worked: null,
      distance_meters: 10,
      location_name: 'HQ Delhi',
      status: 'On time',
    });
    await renderScreen();
    await screen.findByText(/^Checked in at/);
    await fireEvent.press(screen.getByText('Done'));
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
