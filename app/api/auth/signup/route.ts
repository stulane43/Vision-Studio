import { createUser } from '@/lib/auth/users';
import { createSession } from '@/lib/auth/sessions';
import { setSessionCookie } from '@/lib/auth/current';
import { credentialsSchema } from '@/lib/security/validation';
import { jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { username, password } = credentialsSchema.parse(await req.json());
    const user = await createUser(username, password);
    const token = await createSession(user.id);
    const res = jsonOk({ id: user.id, username: user.username }, 201);
    setSessionCookie(res, token);
    return res;
  } catch (e) {
    return jsonError(e);
  }
}
