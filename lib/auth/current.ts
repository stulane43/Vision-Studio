// Current-user resolution + session cookie helpers for route handlers.

import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { getSession } from './sessions';
import { getUserById } from './users';
import { AppError } from '../security/errors';

export const SESSION_COOKIE = 'vs_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface CurrentUser {
  id: string;
  username: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  const user = await getUserById(session.userId);
  return user ? { id: user.id, username: user.username } : null;
}

/** Throws 401 if not signed in. Use at the top of every protected route handler. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError('Please sign in', 401, 'unauthorized');
  return user;
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Only mark Secure when actually served over HTTPS — otherwise the browser
    // won't send the cookie over plain-HTTP LAN access and login silently fails.
    secure: process.env.AIDLC_HTTPS === 'true',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}
