// ============================================================
// The single stage this app runs: produce the Vision Document.
// ============================================================

import type { PhaseId, StageId } from './types';

export interface StageDef {
  id: StageId;
  title: string;
  phase: PhaseId;
  blurb: string;
  artifactPath: string; // project-relative output path
}

export const STAGES: StageDef[] = [
  {
    id: 'vision',
    title: 'Vision Document',
    phase: 'inception',
    blurb: 'Clarify the idea and produce a structured Vision Document.',
    artifactPath: 'vision-document.md',
  },
];

export const STAGE_IDS: StageId[] = STAGES.map((s) => s.id);

export function getStageDef(id: StageId): StageDef {
  const def = STAGES.find((s) => s.id === id);
  if (!def) throw new Error(`Unknown stage: ${id}`);
  return def;
}

export function stageIndex(id: StageId): number {
  return STAGE_IDS.indexOf(id);
}

export const PHASE_TITLES: Record<PhaseId, string> = {
  inception: 'Inception',
};
