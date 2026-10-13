import { signOutOnServer, verifySession } from '@/api/auth';
import { ApiError } from '@/api/errors';
import { tokenStore } from '@/api/tokens';
import { useSession } from '@/store/session';

jest.mock('@/api/auth', () => ({
  verifySession: jest.fn(),
  signOutOnServer: jest.fn(async () => {}),
}));

jest.mock('@/api/tokens', () => {
  const store: Record<string, string | null> = { access: null, refresh: null, role: null };
  return {
    tokenStore: {
      getAccess: jest.fn(async () => store.access),
      getRefresh: jest.fn(async () => store.refresh),
      getRole: jest.fn(async () => store.role),
      save: jest.fn(async (t: { access: string; refresh: string }) => {
        store.access = t.access;
        store.refresh = t.refresh;
      }),
      saveRole: jest.fn(async (role: string) => {
        store.role = role;
      }),
      clear: jest.fn(async () => {
        store.access = store.refresh = store.role = null;
      }),
    },
  };
});

const verifyMock = verifySession as jest.Mock;

beforeEach(async () => {
  verifyMock.mockReset();
  await tokenStore.clear();
  useSession.setState({ status: 'loading', role: null });
});

describe('session', () => {
  it('opens the sign-in screens when nothing is stored', async () => {
    await useSession.getState().restore();
    expect(useSession.getState().status).toBe('signedOut');
  });

  it('restores an admin session that the server still accepts', async () => {
    await useSession.getState().signIn({ access: 'a', refresh: 'r' }, 'organization');
    useSession.setState({ status: 'loading', role: null });
    verifyMock.mockResolvedValueOnce({ valid: true, role: 'organization' });

    await useSession.getState().restore();

    expect(useSession.getState()).toMatchObject({ status: 'signedIn', role: 'organization' });
  });

  it('keeps the session when the phone is offline at start-up', async () => {
    await useSession.getState().signIn({ access: 'a', refresh: 'r' }, 'employee');
    verifyMock.mockRejectedValueOnce(ApiError.network());

    await useSession.getState().restore();

    expect(useSession.getState()).toMatchObject({ status: 'signedIn', role: 'employee' });
  });

  it('signs out when the server no longer accepts the session', async () => {
    await useSession.getState().signIn({ access: 'a', refresh: 'r' }, 'employee');
    verifyMock.mockRejectedValueOnce(new ApiError(401, 'unauthorized', 'Not authenticated'));

    await useSession.getState().restore();

    expect(useSession.getState().status).toBe('signedOut');
    expect(await tokenStore.getRefresh()).toBeNull();
  });

  it('signs out on the server and on the phone', async () => {
    await useSession.getState().signIn({ access: 'a', refresh: 'r' }, 'employee');

    await useSession.getState().signOut();

    expect(signOutOnServer).toHaveBeenCalled();
    expect(useSession.getState().status).toBe('signedOut');
    expect(await tokenStore.getRole()).toBeNull();
  });
});
