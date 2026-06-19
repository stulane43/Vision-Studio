import type { Project, StageId } from '@/lib/engine/types';
import {
  approveStage,
  editArtifact,
  recordFeedback,
  requestMoreQuestions,
  requestStageChanges,
  runCurrentStage,
  submitAnswers,
} from '@/lib/services/projectService';
import { stageActionSchema } from '@/lib/security/validation';
import { safeId } from '@/lib/security/paths';
import { requireUser } from '@/lib/auth/current';
import { clientProject, jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const id = safeId(params.id);
    const body = stageActionSchema.parse(await req.json());
    let project: Project;
    switch (body.action) {
      case 'run':
        project = await runCurrentStage(user.id, id);
        break;
      case 'answers':
        project = await submitAnswers(user.id, id, body.stageId as StageId, body.answers);
        break;
      case 'more-questions':
        project = await requestMoreQuestions(user.id, id, body.stageId as StageId, body.answers);
        break;
      case 'approve':
        project = await approveStage(user.id, id, body.stageId as StageId);
        break;
      case 'request-changes':
        project = await requestStageChanges(user.id, id, body.stageId as StageId, body.feedback);
        break;
      case 'edit':
        project = await editArtifact(user.id, id, body.stageId as StageId, body.markdown);
        break;
      case 'feedback':
        project = await recordFeedback(user.id, id, body.rating);
        break;
      default:
        throw new Error('This action must use the streaming endpoint.');
    }
    return jsonOk(clientProject(project));
  } catch (e) {
    return jsonError(e);
  }
}
