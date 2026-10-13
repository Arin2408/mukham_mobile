import { getLatestAttendance, markAttendance, verifyCheckInFace } from '@/api/attendance';
import { api } from '@/api/client';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const apiMock = api as jest.Mock;

beforeEach(() => apiMock.mockReset());

describe('check-in face result', () => {
  it('returns the face token when the live check matched', async () => {
    apiMock.mockResolvedValueOnce({ status: 'SUCCEEDED', verified: true, face_token: 'ft-1' });
    await expect(verifyCheckInFace('s1', '9876543210')).resolves.toEqual({ faceToken: 'ft-1', reason: '' });
    expect(apiMock).toHaveBeenCalledWith('/face/liveness/result', {
      method: 'POST',
      body: { session_id: 's1', mobile_number: '9876543210', mode: 'verify' },
    });
  });

  it('returns no token, with the reason, when the face did not match', async () => {
    apiMock.mockResolvedValueOnce({ status: 'SUCCEEDED', verified: false, message: 'Face does not match' });
    await expect(verifyCheckInFace('s1', '9876543210')).resolves.toEqual({
      faceToken: null,
      reason: 'Face does not match',
    });
  });

  it('returns no token when the live-person check failed', async () => {
    apiMock.mockResolvedValueOnce({ status: 'FAILED', verified: true, face_token: 'ft-1' });
    await expect(verifyCheckInFace('s1', '9876543210')).resolves.toMatchObject({ faceToken: null });
  });
});

describe('marking attendance', () => {
  it('sends the location, face token, fake-GPS flag and device ID on check-in', async () => {
    apiMock.mockResolvedValueOnce({ action: 'checkin' });
    await markAttendance({
      action: 'checkin',
      latitude: 28.6,
      longitude: 77.2,
      accuracy: 12,
      faceToken: 'ft-1',
      isMocked: false,
      deviceId: 'android-1',
    });
    expect(apiMock).toHaveBeenCalledWith('/attendance/mark', {
      method: 'POST',
      body: {
        action: 'checkin',
        latitude: 28.6,
        longitude: 77.2,
        accuracy: 12,
        face_token: 'ft-1',
        is_mocked: false,
        device_id: 'android-1',
      },
    });
  });

  it('finds the latest record, or none', async () => {
    apiMock.mockResolvedValueOnce([{ id: 7, check_in: '2026-10-13T03:32:00Z', check_out: null }]);
    await expect(getLatestAttendance()).resolves.toMatchObject({ id: 7 });
    apiMock.mockResolvedValueOnce([]);
    await expect(getLatestAttendance()).resolves.toBeNull();
  });
});
