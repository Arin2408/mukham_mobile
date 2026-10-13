/**
 * Every backend error has a stable `code` and a user-facing `message`
 * (mukham_fastAPI README, "API conventions"). The app branches on `code`
 * and shows `message`.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(status: number, body: unknown): ApiError {
    const data = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    const code = typeof data.code === 'string' ? data.code : 'error';
    const message = typeof data.message === 'string' ? data.message : '';
    return new ApiError(status, code, message, data.detail);
  }

  /** The request never reached the server (no internet, server down). */
  static network(): ApiError {
    return new ApiError(0, 'network_error', '');
  }
}

/** The text to show the user for any error thrown by the API client. */
export function errorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.code === 'network_error') {
      return t('errors.network');
    }
    if (error.message) {
      return error.message;
    }
  }
  return t('errors.unknown');
}
