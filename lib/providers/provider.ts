// AI provider abstraction (pluggable). Implementations: Anthropic, OpenAI, Codex, Mock.

import type { Answer, DocumentType, Question, StageId, StageResult } from '../engine/types';

export type StageMode = 'questions' | 'artifact';

export interface PriorArtifact {
  stageId: StageId;
  title: string;
  markdown: string;
}

export interface ReviewComment {
  quote: string; // the text the user highlighted
  note: string; // their note about it
}

export interface StageInput {
  stageId: StageId;
  stageTitle: string;
  stageBlurb: string;
  phase: string;
  documentType: DocumentType; // selects role, questions, and output structure
  project: { name: string; idea: string; isExisting: boolean };
  priorArtifacts: PriorArtifact[];
  answers: Answer[];
  askedQuestions: Question[];
  feedback: string[];
  // When revising: the current document to edit, and the user's anchored comments.
  currentDocument?: string;
  comments?: ReviewComment[];
}

export interface AiProvider {
  id: 'anthropic' | 'openai' | 'codex' | 'mock';
  /** Run the stage in the given mode: produce clarifying questions, or the artifact. */
  runStage(input: StageInput, mode: StageMode): Promise<StageResult>;
  /** Like runStage, but streams artifact text via onText as it is generated. */
  runStageStream(input: StageInput, mode: StageMode, onText: (text: string) => void): Promise<StageResult>;
  /** Verify the provider is reachable and configured (throws AppError on failure). */
  testConnection(): Promise<void>;
}
