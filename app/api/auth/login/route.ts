import { findByUsername, verifyPassword } from '@/lib/auth/users';
import { createSession } from '@/lib/auth/sessions';
import { setSessionCookie } from '@/lib/auth/current';
import { credentialsSchema } from '@/lib/security/validation';
import { AppError } from '@/lib/security/errors';
import { jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

// SECURITY-12: basic brute-force protection (in-memory lockout per username).
const attempts = new Map<string, { count: number; until: number }>();

function checkLock(key: string): void {
  const a = attempts.get(key);
  if (a && a.until > Date.now()) {
    throw new AppError('Too many attempts — wait a minute and try again.', 429, 'rate_limited');
  }
}

function recordFail(key: string): void {
  const a = attempts.get(key) ?? { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= 5) {
    a.until = Date.now() + 60_000;
    a.count = 0;
  }
  attempts.set(key, a);
}

export async function POST(req: Request) {
  try {
    const { username, password } = credentialsSchema.parse(await req.json());
    const key = username.toLowerCase();
    checkLock(key);
    const user = await findByUsername(username);
    if (!user || !verifyPassword(user, password)) {
      recordFail(key);
      throw new AppError('Invalid username or password', 401, 'bad_credentials');
    }
    attempts.delete(key);
    const token = await createSession(user.id);
    const res = jsonOk({ id: user.id, username: user.username });
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    return jsonError(e);
  }
}
