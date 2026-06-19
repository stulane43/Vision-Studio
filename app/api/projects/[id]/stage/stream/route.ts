import { runStageStreaming } from '@/lib/services/projectService';
import { stageActionSchema } from '@/lib/security/validation';
import { safeId } from '@/lib/security/paths';
import { requireUser } from '@/lib/auth/current';
import { clientProject, jsonError } from '@/lib/api/respond';
import { toUserError } from '@/lib/security/errors';
import type { StageId } from '@/lib/engine/types';

export const dynamic = 'force-dynamic';

// Streams artifact generation as newline-delimited JSON:
//   {"type":"delta","text":"..."}   (repeated)
//   {"type":"done","project":{...}} (final) OR {"type":"error","error":"..."}
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const id = safeId(params.id);
    const body = stageActionSchema.parse(await req.json());

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // If the client disconnects, enqueue throws — swallow it and keep running so the
        // generation still completes and persists server-side (no restart on return).
        let closed = false;
        const send = (obj: unknown) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
          } catch {
            closed = true;
          }
        };
        try {
          let action;
          if (body.action === 'answers') {
            action = { action: 'answers' as const, stageId: body.stageId as StageId, answers: body.answers };
          } else if (body.action === 'request-changes') {
            action = { action: 'request-changes' as const, stageId: body.stageId as StageId, feedback: body.feedback };
          } else if (body.action === 'revise') {
            action = {
              action: 'revise' as const,
              stageId: body.stageId as StageId,
              comments: body.comments,
              instruction: body.instruction,
            };
          } else if (body.action === 'run') {
            action = { action: 'run' as const };
          } else {
            throw new Error('Unsupported streaming action');
          }
          const project = await runStageStreaming(user.id, id, action, (t) => send({ type: 'delta', text: t }));
          send({ type: 'done', project: clientProject(project) });
        } catch (e) {
          send({ type: 'error', error: toUserError(e).message });
        } finally {
          try {
            controller.close();
          } catch {
            /* already closed by client disconnect */
          }
        }
      },
    });

    return new Response(stream, {
      headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-cache, no-transform' },
    });
  } catch (e) {
    return jsonError(e);
  }
}
