import { API_BASE_URL } from './config';
import { ApiError } from './errors';
import { tokenStore } from './tokens';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: Method;
  body?: unknown;
  /** Send the access token (default true). Public calls pass false. */
  auth?: boolean;
  /** Send this token instead (the 5-minute pre-sign-in token). Never renewed. */
  token?: string;
  signal?: AbortSignal;
};

let onSessionExpired: () => void = () => {};

/** Called when the session can't be renewed, so the app can go to sign-in. */
export function setOnSessionExpired(handler: () => void): void {
  onSessionExpired = handler;
}

async function send(path: string, options: RequestOptions, accessToken: string | null) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (__DEV__) {
      console.warn(`[api] ${options.method ?? 'GET'} ${path} failed before reaching the server:`, error);
    }
    throw ApiError.network();
  }
}

async function parse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// --------------------------------------------------
// Token renewal: one at a time
// --------------------------------------------------
// A refresh token works only once; presenting it twice signs the device
// out (backend: token reuse). So when several requests hit an expired
// access token together, they all wait for the same single renewal.

let renewal: Promise<boolean> | null = null;

export function renewSession(): Promise<boolean> {
  if (!renewal) {
    renewal = doRenew().finally(() => {
      renewal = null;
    });
  }
  return renewal;
}

async function doRenew(): Promise<boolean> {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) {
    return false;
  }

  let response: Response;
  try {
    response = await send('/auth/refresh', { method: 'POST', body: { refresh } }, null);
  } catch {
    // Offline: keep the tokens and try again later.
    return false;
  }

  if (!response.ok) {
    await tokenStore.clear();
    onSessionExpired();
    return false;
  }

  const data = (await parse(response)) as { access: string; refresh: string };
  await tokenStore.save({ access: data.access, refresh: data.refresh });
  return true;
}

// --------------------------------------------------
// Requests
// --------------------------------------------------

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.token) {
    return parseOrThrow<T>(await send(path, options, options.token));
  }

  const useAuth = options.auth ?? true;

  let response = await send(path, options, useAuth ? await tokenStore.getAccess() : null);

  if (response.status === 401 && useAuth && (await tokenStore.getRefresh())) {
    if (await renewSession()) {
      response = await send(path, options, await tokenStore.getAccess());
    }
  }

  return parseOrThrow<T>(response);
}

async function parseOrThrow<T>(response: Response): Promise<T> {
  const body = await parse(response);
  if (!response.ok) {
    throw ApiError.fromResponse(response.status, body);
  }
  return body as T;
}
