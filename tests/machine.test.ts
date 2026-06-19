import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import * as M from '@/lib/engine/machine';
import type { Run } from '@/lib/engine/types';
import { STAGE_IDS } from '@/lib/engine/stages';

function checkInvariants(run: Run): void {
  const idx = run.currentStageId ? STAGE_IDS.indexOf(run.currentStageId) : STAGE_IDS.length;
  run.stages.forEach((s, i) => {
    if (i < idx) expect(['done', 'skipped']).toContain(s.status);
    else if (i === idx) expect(['active', 'awaiting-answers', 'awaiting-review']).toContain(s.status);
    else expect(s.status).toBe('locked');
  });
}

/** Drive a run to completion: each step either skips or builds+approves the current stage. */
function drive(choices: boolean[]): Run {
  let run = M.createRun();
  let step = 0;
  while (run.currentStageId && step < 100) {
    checkInvariants(run);
    const id = run.currentStageId;
    if (choices[step % choices.length]) {
      run = M.skip(run, id, 'not needed');
    } else {
      run = M.setArtifact(run, id, 'path.md', 'summary');
      run = M.approve(run, id);
    }
    step++;
  }
  return run;
}

describe('workflow engine', () => {
  it('initializes with the first stage active and the rest locked', () => {
    const run = M.createRun();
    expect(run.currentStageId).toBe(STAGE_IDS[0]);
    expect(run.stages[0].status).toBe('active');
    expect(run.stages.slice(1).every((s) => s.status === 'locked')).toBe(true);
  });

  it('follows the question -> answer -> artifact -> approve cycle', () => {
    let run = M.createRun();
    const id = STAGE_IDS[0];
    run = M.setQuestions(run, id, [
      { id: 'q1', text: 'Q?', options: [{ key: 'A', label: 'a' }, { key: 'X', label: 'other', isOther: true }] },
    ]);
    expect(M.getStage(run, id).status).toBe('awaiting-answers');
    run = M.setAnswers(run, id, [{ questionId: 'q1', selectedKeys: ['A'] }]);
    expect(M.getStage(run, id).status).toBe('active');
    run = M.setArtifact(run, id, 'p.md', 's');
    expect(M.getStage(run, id).status).toBe('awaiting-review');
    run = M.approve(run, id);
    expect(M.getStage(run, id).status).toBe('done');
    expect(M.isComplete(run)).toBe(true);
  });

  it('rejects approving a stage that has no artifact', () => {
    const run = M.createRun();
    expect(() => M.approve(run, STAGE_IDS[0])).toThrow();
  });

  it('records request-changes feedback and reactivates the stage', () => {
    let run = M.createRun();
    const id = STAGE_IDS[0];
    run = M.setArtifact(run, id, 'p.md', 's');
    run = M.requestChanges(run, id, 'make it shorter');
    expect(M.getStage(run, id).status).toBe('active');
    expect(M.getStage(run, id).feedback).toEqual(['make it shorter']);
  });

  it('PROPERTY: any sequence of build/skip choices drives the run to completion', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: STAGE_IDS.length }), (choices) => {
        const run = drive(choices);
        expect(M.isComplete(run)).toBe(true);
        run.stages.forEach((s) => expect(['done', 'skipped']).toContain(s.status));
      }),
    );
  });

  it('PROPERTY: doneCount never exceeds the number of stages and grows monotonically', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: STAGE_IDS.length }), (choices) => {
        let run = M.createRun();
        let prevDone = 0;
        let step = 0;
        while (run.currentStageId && step < 100) {
          const id = run.currentStageId;
          if (choices[step % choices.length]) run = M.skip(run, id, 'x');
          else {
            run = M.setArtifact(run, id, 'p', 's');
            run = M.approve(run, id);
          }
          const done = M.doneCount(run);
          expect(done).toBeGreaterThanOrEqual(prevDone);
          expect(done).toBeLessThanOrEqual(STAGE_IDS.length);
          prevDone = done;
          step++;
        }
      }),
    );
  });
});
