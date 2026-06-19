import { getPublicSettings, updateSettings } from '@/lib/services/settings';
import { requireUser } from '@/lib/auth/current';
import { jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk(await getPublicSettings(user.id));
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const settings = await updateSettings(user.id, await req.json());
    return jsonOk(settings);
  } catch (e) {
    return jsonError(e);
  }
}
