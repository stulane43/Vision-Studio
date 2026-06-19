// SECURITY-15: fail-safe error handling. User-facing messages are generic;
// internal detail is never leaked to the client.

export class AppError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = 'bad_request') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export interface UserError {
  message: string;
  status: number;
  code: string;
}

/** Normalize any thrown value into a safe, user-facing error. */
export function toUserError(e: unknown): UserError {
  if (e instanceof AppError) {
    return { message: e.message, status: e.status, code: e.code };
  }
  // Unknown/unexpected errors: never expose internals (no stack, no message).
  return { message: 'Something went wrong. Please try again.', status: 500, code: 'internal' };
}
