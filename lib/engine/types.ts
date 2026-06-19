// ============================================================
// Domain model for AI-DLC Studio (pure types — no I/O).
// ============================================================

export type PhaseId = 'inception';

// This app runs a single stage that produces one document.
export type StageId = 'vision';

// The kind of document the user is creating. The stage is shared; the
// document type selects the clarifying questions, output structure, and
// artifact filename (see lib/aidlc/documentTypes.ts).
export type DocumentType = 'dev-vision' | 'business-brief' | 'presentation-brief';
export const DOCUMENT_TYPES: DocumentType[] = ['dev-vision', 'business-brief', 'presentation-brief'];
// Back-compat + lowest-regression default: projects/artifacts with no stored
// type are treated as Development Vision Documents (the original behavior).
export const DEFAULT_DOCUMENT_TYPE: DocumentType = 'dev-vision';

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
  documentType: DocumentType; // which kind of document this is
  path: string; // project-relative, e.g. vision-document.md / business-brief.md
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

// Lightweight post-approval feedback: "was this ready to use with AI?"
export interface Readiness {
  rating: 'yes' | 'minor' | 'major';
  at: string; // ISO timestamp
}

export interface Project {
  id: string;
  name: string;
  idea: string;
  documentType: DocumentType; // chosen at creation
  isExisting: boolean;
  createdAt: string;
  updatedAt: string;
  run: Run;
  artifacts: Artifact[];
  readiness?: Readiness; // set when the user rates the finalized document
  schemaVersion: number;
}

// Result returned by an AI provider for a single stage run.
export type StageResult =
  | { kind: 'questions'; questions: Question[] }
  | { kind: 'artifact'; title: string; markdown: string; summary: string };

export const SCHEMA_VERSION = 2;
