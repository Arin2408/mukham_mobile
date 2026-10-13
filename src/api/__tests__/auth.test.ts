import { cleanMobile, submitLivenessResult } from '@/api/auth';
import { api } from '@/api/client';

jest.mock('@/api/client', () => ({ api: jest.fn() }));

const apiMock = api as jest.Mock;

beforeEach(() => apiMock.mockReset());

describe('cleanMobile', () => {
  it('keeps the last 10 digits, like the web app', () => {
    expect(cleanMobile('+91 98765-43210')).toBe('9876543210');
    expect(cleanMobile('09876543210')).toBe('9876543210');
  });
});

describe('submitLivenessResult', () => {
  it('passes a first sign-in only when the face was registered', async () => {
    apiMock.mockResolvedValueOnce({ status: 'SUCCEEDED', registered: true, verified: true });
    await expect(submitLivenessResult('pre', 's1', '9876543210', 'register')).resolves.toBeNull();
  });

  it('passes a returning sign-in only when the face was verified', async () => {
    apiMock.mockResolvedValueOnce({ status: 'SUCCEEDED', verified: true });
    await expect(submitLivenessResult('pre', 's1', '9876543210', 'verify')).resolves.toBeNull();
  });

  it('fails when the face does not match, with the server reason', async () => {
    apiMock.mockResolvedValueOnce({
      status: 'SUCCEEDED',
      verified: false,
      message: 'Face does not match the registered employee.',
    });
    await expect(submitLivenessResult('pre', 's1', '9876543210', 'verify')).resolves.toBe(
      'Face does not match the registered employee.',
    );
  });

  it('fails when the live-person check did not succeed', async () => {
    apiMock.mockResolvedValueOnce({ status: 'FAILED', verified: true });
    await expect(submitLivenessResult('pre', 's1', '9876543210', 'verify')).resolves.toBe('');
  });

  it('sends the pre-sign-in token, the session and the mode', async () => {
    apiMock.mockResolvedValueOnce({ status: 'SUCCEEDED', registered: true });
    await submitLivenessResult('pre-token', 'sess-9', '+91 98765 43210', 'register');
    expect(apiMock).toHaveBeenCalledWith('/face/liveness/result', {
      method: 'POST',
      token: 'pre-token',
      body: { session_id: 'sess-9', mobile_number: '9876543210', mode: 'register' },
    });
  });
});
