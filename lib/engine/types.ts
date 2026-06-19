// ============================================================
// Domain model for AI-DLC Studio (pure types — no I/O).
// ============================================================

export type PhaseId = 'inception';

// This app produces a single artifact: the Vision Document.
export type StageId = 'vision';

export type StageStatus =
  | 'locked' // not yet reachable
  | 'active' // current stage, ready to run (generate questions or artifact)
  | 'generating' // a provider call is in flight (questions, or writing the document)
  | 'awaiting-answers' // questions issued; waiting for the user
  | 'awaiting-review' // artifact generated; waiting for approve / request-changes
  | 'done' // approved
  | 'skipped';

export interface QuestionOption {
  key: string; // "A", "B", ... or "X" for Other
  label: string;
  isOther?: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  multi?: boolean;
}

export interface Answer {
  questionId: string;
  selectedKeys: string[];
  otherText?: string;
}

export interface Artifact {
  stageId: StageId;
  path: string; // project-relative, e.g. aidlc-docs/inception/requirements/requirements.md
  title: string;
  markdown: string;
  version: number;
  updatedAt: string;
  editedByUser?: boolean;
}

export interface StageState {
  id: StageId;
  status: StageStatus;
  questions: Question[];
  answers: Answer[];
  artifactPath?: string;
  summary?: string;
  feedback: string[]; // request-changes feedback history
  skipReason?: string;
}

export interface Run {
  currentStageId: StageId | null; // null when complete
  stages: StageState[];
}

export interface Project {
  id: string;
  name: string;
  idea: string;
  isExisting: boolean;
  createdAt: string;
  updatedAt: string;
  run: Run;
  artifacts: Artifact[];
  schemaVersion: number;
}

// Result returned by an AI provider for a single stage run.
export type StageResult =
  | { kind: 'questions'; questions: Question[] }
  | { kind: 'artifact'; title: string; markdown: string; summary: string };

export const SCHEMA_VERSION = 1;
