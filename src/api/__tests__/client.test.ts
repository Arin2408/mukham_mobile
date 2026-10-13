import { api, setOnSessionExpired } from '@/api/client';
import { ApiError, errorMessage } from '@/api/errors';
import { tokenStore } from '@/api/tokens';

jest.mock('@/api/config', () => ({ API_BASE_URL: 'http://api.test/api/v1' }));

// In-memory token storage instead of the phone's secure storage.
jest.mock('@/api/tokens', () => {
  const store: Record<string, string | null> = { access: null, refresh: null };
  return {
    tokenStore: {
      getAccess: jest.fn(async () => store.access),
      getRefresh: jest.fn(async () => store.refresh),
      save: jest.fn(async (t: { access: string; refresh: string }) => {
        store.access = t.access;
        store.refresh = t.refresh;
      }),
      clear: jest.fn(async () => {
        store.access = null;
        store.refresh = null;
      }),
    },
  };
});

function json(status: number, body: unknown) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

beforeEach(async () => {
  fetchMock.mockReset();
  await tokenStore.clear();
});

const calls = (path: string) =>
  fetchMock.mock.calls.filter(([url]: [string]) => url.endsWith(path)).length;

describe('api client', () => {
  it('sends the access token', async () => {
    await tokenStore.save({ access: 'A1', refresh: 'R1' });
    fetchMock.mockReturnValueOnce(json(200, { ok: true }));

    await api('/employee-details');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/employee-details');
    expect(init.headers.Authorization).toBe('Bearer A1');
  });

  it('leaves the token off public calls', async () => {
    await tokenStore.save({ access: 'A1', refresh: 'R1' });
    fetchMock.mockReturnValueOnce(json(200, {}));

    await api('/app/config', { auth: false });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('renews an expired session once and retries the request', async () => {
    await tokenStore.save({ access: 'old', refresh: 'R1' });
    fetchMock
      .mockReturnValueOnce(json(401, { code: 'unauthorized', message: 'expired' }))
      .mockReturnValueOnce(json(200, { access: 'new', refresh: 'R2' }))
      .mockReturnValueOnce(json(200, { name: 'Ravi' }));

    const result = await api<{ name: string }>('/employee-details');

    expect(result.name).toBe('Ravi');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer new');
    expect(await tokenStore.getRefresh()).toBe('R2');
  });

  it('renews only once when several requests expire together', async () => {
    await tokenStore.save({ access: 'old', refresh: 'R1' });
    fetchMock.mockImplementation((url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        return json(200, { access: 'new', refresh: 'R2' });
      }
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer new' ? json(200, { ok: true }) : json(401, { code: 'unauthorized' });
    });

    await Promise.all([api('/tasks'), api('/attendance/history'), api('/employee-details')]);

    // A refresh token works once; sending it twice would sign the phone out.
    expect(calls('/auth/refresh')).toBe(1);
  });

  it('signs out when the session can no longer be renewed', async () => {
    await tokenStore.save({ access: 'old', refresh: 'revoked' });
    const expired = jest.fn();
    setOnSessionExpired(expired);
    fetchMock
      .mockReturnValueOnce(json(401, { code: 'unauthorized' }))
      .mockReturnValueOnce(json(401, { code: 'unauthorized' }))
      .mockReturnValueOnce(json(401, { code: 'unauthorized', message: 'Not authenticated' }));

    await expect(api('/tasks')).rejects.toMatchObject({ status: 401, code: 'unauthorized' });
    expect(expired).toHaveBeenCalledTimes(1);
    expect(await tokenStore.getRefresh()).toBeNull();
  });

  it('turns server errors into code and message', async () => {
    fetchMock.mockReturnValueOnce(
      json(403, { code: 'outside_geofence', message: 'You are outside the office area.', detail: { distance_meters: 2100 } }),
    );

    const error = (await api('/attendance/mark', { method: 'POST', body: {} }).catch((e) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('outside_geofence');
    expect(errorMessage(error, (k) => k)).toBe('You are outside the office area.');
    expect(error.detail).toEqual({ distance_meters: 2100 });
  });

  it('reports a network failure without a server message', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    const error = (await api('/tasks', { auth: false }).catch((e) => e)) as ApiError;

    expect(error.code).toBe('network_error');
    expect(errorMessage(error, (k) => k)).toBe('errors.network');
  });
});
