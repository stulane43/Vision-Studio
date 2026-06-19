import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/auth/sessions';
import { SESSION_COOKIE, clearSessionCookie } from '@/lib/auth/current';
import { jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (token) await deleteSession(token);
    const res = jsonOk({ ok: true });
    clearSessionCookie(res);
    return res;
  } catch (e) {
    return jsonError(e);
  }
}
