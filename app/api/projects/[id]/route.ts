import { deleteProject, loadProject } from '@/lib/services/projectService';
import { safeId } from '@/lib/security/paths';
import { requireUser } from '@/lib/auth/current';
import { clientProject, jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const project = await loadProject(user.id, safeId(params.id));
    return jsonOk(clientProject(project));
  } catch (e) {
    return jsonError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    await deleteProject(user.id, safeId(params.id));
    return jsonOk({ deleted: true });
  } catch (e) {
    return jsonError(e);
  }
}
