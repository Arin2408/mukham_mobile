import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { api } from './client';
import { tokenStore } from './tokens';

/** Label for this phone's session, shown to the server (e.g. "Pixel 8"). */
export const DEVICE_NAME = Device.modelName ?? `${Platform.OS} device`;

/** The web app accepts the last 10 digits of a mobile number. */
export function cleanMobile(input: string): string {
  return input.replace(/\D/g, '').slice(-10);
}

// --------------------------------------------------
// Admin (organisation)
// --------------------------------------------------

type AdminLoginResponse = { access: string; refresh: string; org_id: number; role: string };

export function adminSignIn(mobile: string, password: string) {
  return api<AdminLoginResponse>('/org/login', {
    method: 'POST',
    auth: false,
    body: { mobile_number: cleanMobile(mobile), password, device_name: DEVICE_NAME },
  });
}

export type RegisterInput = { name: string; mobile: string; email: string; details: string };
type RegisterResponse = { mobile_number: string; generated_password: string; message: string };

export function registerOrganisation(input: RegisterInput) {
  return api<RegisterResponse>('/org/signup', {
    method: 'POST',
    auth: false,
    body: {
      name: input.name.trim(),
      mobile_number: cleanMobile(input.mobile),
      email: input.email.trim() || null,
      details: input.details.trim() || null,
    },
  });
}

export function requestPasswordReset(email: string) {
  return api<{ message: string }>('/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email: email.trim() },
  });
}

// --------------------------------------------------
// Employee: password, then a live face check
// --------------------------------------------------

export function employeePasswordStep(mobile: string, password: string) {
  return api<{ pre_auth_token: string }>('/member/login', {
    method: 'POST',
    auth: false,
    body: { mobile_number: cleanMobile(mobile), password },
  });
}

export async function isFaceRegistered(mobile: string): Promise<boolean> {
  const data = await api<{ is_face_registered: boolean }>('/face/check-status', {
    method: 'POST',
    auth: false,
    body: { mobile_number: cleanMobile(mobile) },
  });
  return data.is_face_registered === true;
}

/**
 * Liveness calls work for sign-in (pass the pre-sign-in token) and for
 * check-in (no token: the signed-in session is used).
 */
export function createLivenessSession(preAuthToken?: string) {
  return api<{ session_id: string; region: string }>('/face/liveness/create', {
    method: 'POST',
    token: preAuthToken,
  });
}

export type LivenessCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: string;
};

export function getLivenessCredentials(preAuthToken?: string) {
  return api<LivenessCredentials>('/face/liveness/credentials', {
    method: 'POST',
    token: preAuthToken,
  });
}

type LivenessResult = {
  status?: string;
  verified?: boolean;
  registered?: boolean;
  message?: string;
  error?: string;
};

/**
 * Sends the finished liveness session for checking. `register` saves the
 * face (first sign-in); `verify` compares it with the saved one.
 * Returns null on success, or the reason it failed.
 */
export async function submitLivenessResult(
  preAuthToken: string,
  sessionId: string,
  mobile: string,
  mode: 'register' | 'verify',
): Promise<string | null> {
  const data = await api<LivenessResult>('/face/liveness/result', {
    method: 'POST',
    token: preAuthToken,
    body: { session_id: sessionId, mobile_number: cleanMobile(mobile), mode },
  });

  const succeeded =
    data.status === 'SUCCEEDED' && (mode === 'register' ? data.registered : data.verified) === true;
  return succeeded ? null : (data.message ?? data.error ?? '');
}

type EmployeeLoginResponse = { access_token: string; refresh_token: string };

export function completeEmployeeSignIn(preAuthToken: string, sessionId: string) {
  return api<EmployeeLoginResponse>('/member/login/complete', {
    method: 'POST',
    token: preAuthToken,
    body: { session_id: sessionId, device_name: DEVICE_NAME },
  });
}

// --------------------------------------------------
// Session
// --------------------------------------------------

/** Ends this phone's session on the server. Never throws. */
export async function signOutOnServer(): Promise<void> {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) {
    return;
  }
  try {
    await api('/auth/logout', { method: 'POST', auth: false, body: { refresh } });
  } catch {
    // Signing out locally must not depend on the network.
  }
}

/** Confirms the stored session still works; renews it if needed. */
export function verifySession() {
  return api<{ valid: boolean; role: string }>('/auth/verify');
}
