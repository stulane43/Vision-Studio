// ============================================================
// Workflow state machine — PURE, deterministic, immutable.
// All transitions return a new Run. No I/O, no Date.now (caller
// supplies timestamps). This module is a property-based-testing target.
// ============================================================

import type { Answer, Question, Run, StageId, StageState } from './types';
import { STAGE_IDS } from './stages';

function freshStage(id: StageId, status: StageState['status']): StageState {
  return { id, status, questions: [], answers: [], feedback: [] };
}

/** Initialize a run: first stage active, the rest locked. */
export function createRun(): Run {
  const stages = STAGE_IDS.map((id, i) => freshStage(id, i === 0 ? 'active' : 'locked'));
  return { currentStageId: STAGE_IDS[0], stages };
}

export function getStage(run: Run, id: StageId): StageState {
  const s = run.stages.find((x) => x.id === id);
  if (!s) throw new Error(`Stage not in run: ${id}`);
  return s;
}

export function currentStage(run: Run): StageState | null {
  if (!run.currentStageId) return null;
  return getStage(run, run.currentStageId);
}

export function isComplete(run: Run): boolean {
  return run.currentStageId === null;
}

function mapStage(run: Run, id: StageId, fn: (s: StageState) => StageState): Run {
  return { ...run, stages: run.stages.map((s) => (s.id === id ? fn(s) : s)) };
}

function assertCurrent(run: Run, id: StageId): void {
  if (run.currentStageId !== id) {
    throw new Error(`Transition target "${id}" is not the current stage ("${run.currentStageId}")`);
  }
}

/** The next stage that should become active after `from` completes (or null). */
export function nextStageId(run: Run, from: StageId): StageId | null {
  const idx = STAGE_IDS.indexOf(from);
  for (let i = idx + 1; i < STAGE_IDS.length; i++) {
    const st = getStage(run, STAGE_IDS[i]);
    if (st.status !== 'skipped') return STAGE_IDS[i];
  }
  return null;
}

/** Advance: mark the current stage with `finalStatus`, activate the next. */
function advanceFrom(run: Run, id: StageId, finalStatus: 'done' | 'skipped', skipReason?: string): Run {
  const settled = mapStage(run, id, (s) => ({ ...s, status: finalStatus, skipReason }));
  const next = nextStageId(settled, id);
  if (!next) return { ...settled, currentStageId: null };
  const activated = mapStage(settled, next, (s) => ({ ...s, status: 'active' }));
  return { ...activated, currentStageId: next };
}

/** Mark the current stage as generating (a provider call is in flight). */
export function setGenerating(run: Run, id: StageId): Run {
  assertCurrent(run, id);
  return mapStage(run, id, (s) => ({ ...s, status: 'generating' }));
}

/** Return a generating stage to active (e.g. to retry after an interrupted generation). */
export function reactivate(run: Run, id: StageId): Run {
  assertCurrent(run, id);
  return mapStage(run, id, (s) => ({ ...s, status: 'active' }));
}

/** Provider returned clarifying questions for the current stage. */
export function setQuestions(run: Run, id: StageId, questions: Question[]): Run {
  assertCurrent(run, id);
  return mapStage(run, id, (s) => ({ ...s, questions, status: 'awaiting-answers' }));
}

/** User submitted answers; stage becomes active again so the runner can regenerate. */
export function setAnswers(run: Run, id: StageId, answers: Answer[]): Run {
  assertCurrent(run, id);
  return mapStage(run, id, (s) => ({ ...s, answers, status: 'active' }));
}

/** Provider produced an artifact for the current stage; awaiting review. */
export function setArtifact(run: Run, id: StageId, artifactPath: string, summary: string): Run {
  assertCurrent(run, id);
  return mapStage(run, id, (s) => ({ ...s, artifactPath, summary, status: 'awaiting-review' }));
}

/** Approve the current stage and advance. */
export function approve(run: Run, id: StageId): Run {
  assertCurrent(run, id);
  const s = getStage(run, id);
  if (s.status !== 'awaiting-review') {
    throw new Error(`Cannot approve stage "${id}" in status "${s.status}"`);
  }
  return advanceFrom(run, id, 'done');
}

/** Request changes: capture feedback, set the stage active to regenerate. */
export function requestChanges(run: Run, id: StageId, feedback: string): Run {
  assertCurrent(run, id);
  return mapStage(run, id, (s) => ({
    ...s,
    feedback: [...s.feedback, feedback],
    status: 'active',
  }));
}

/** Skip the current stage with a reason, and advance. */
export function skip(run: Run, id: StageId, reason: string): Run {
  assertCurrent(run, id);
  return advanceFrom(run, id, 'skipped', reason);
}

/** Count of stages that have been approved. */
export function doneCount(run: Run): number {
  return run.stages.filter((s) => s.status === 'done').length;
}

/** Re-open `stageId`: it becomes active (fresh), every later stage resets to locked,
 *  earlier stages are untouched. Used by "restart from here". */
export function resetFrom(run: Run, stageId: StageId): Run {
  const idx = STAGE_IDS.indexOf(stageId);
  if (idx < 0) throw new Error(`Unknown stage: ${stageId}`);
  const stages = run.stages.map((s) => {
    const i = STAGE_IDS.indexOf(s.id);
    if (i < idx) return s;
    if (i === idx) return freshStage(s.id, 'active');
    return freshStage(s.id, 'locked');
  });
  return { currentStageId: stageId, stages };
}
