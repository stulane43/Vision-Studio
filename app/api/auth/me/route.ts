import { getCurrentUser } from '@/lib/auth/current';
import { jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return jsonOk({ user }); // user is null when not signed in
  } catch (e) {
    return jsonError(e);
  }
}
