import { create } from 'zustand';

import { signOutOnServer, verifySession } from '@/api/auth';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/api/query-client';
import { tokenStore, type Role } from '@/api/tokens';
import { unregisterFromPush } from '@/features/notifications/push';

type Status = 'loading' | 'signedOut' | 'signedIn';

/**
 * Every way of being signed out ends here: nothing from this person's
 * session (profile, tasks, attendance) stays cached for whoever signs in next.
 */
function signedOut() {
  queryClient.clear();
  return { status: 'signedOut' as const, role: null };
}

type SessionState = {
  status: Status;
  role: Role | null;
  /** On app start: is there a session on this phone, and does it still work? */
  restore: () => Promise<void>;
  signIn: (tokens: { access: string; refresh: string }, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  /** The session could not be renewed (e.g. signed out elsewhere). */
  expire: () => void;
};

export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  role: null,

  async restore() {
    const [refresh, role] = await Promise.all([tokenStore.getRefresh(), tokenStore.getRole()]);
    if (!refresh || !role) {
      set(signedOut());
      return;
    }

    try {
      await verifySession();
      set({ status: 'signedIn', role });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'network_error') {
        // Offline: open the app as before; the server checks again later.
        set({ status: 'signedIn', role });
      } else {
        await tokenStore.clear();
        set(signedOut());
      }
    }
  },

  async signIn(tokens, role) {
    await tokenStore.save(tokens);
    await tokenStore.saveRole(role);
    set({ status: 'signedIn', role });
  },

  async signOut() {
    // First, while the session still works: this phone gets no more reminders.
    await unregisterFromPush();
    await signOutOnServer();
    await tokenStore.clear();
    set(signedOut());
  },

  expire() {
    set(signedOut());
  },
}));

/**
 * The employee sign-in in progress: the 5-minute pre-sign-in token stays
 * in memory only and is dropped when sign-in ends.
 */
type EmployeeSignInState = {
  mobile: string;
  preAuthToken: string | null;
  faceRegistered: boolean;
  start: (mobile: string, preAuthToken: string, faceRegistered: boolean) => void;
  reset: () => void;
};

export const useEmployeeSignIn = create<EmployeeSignInState>((set) => ({
  mobile: '',
  preAuthToken: null,
  faceRegistered: false,
  start: (mobile, preAuthToken, faceRegistered) => set({ mobile, preAuthToken, faceRegistered }),
  reset: () => set({ mobile: '', preAuthToken: null, faceRegistered: false }),
}));
