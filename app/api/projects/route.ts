import { createProjectFromIdea, listProjects } from '@/lib/services/projectService';
import { createProjectSchema } from '@/lib/security/validation';
import { requireUser } from '@/lib/auth/current';
import { clientProject, jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    return jsonOk(await listProjects(user.id));
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const input = createProjectSchema.parse(await req.json());
    const project = await createProjectFromIdea(user.id, input);
    return jsonOk(clientProject(project), 201);
  } catch (e) {
    return jsonError(e);
  }
}
