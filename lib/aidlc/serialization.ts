// ============================================================
// Project <-> JSON (de)serialization with schema validation.
// SECURITY-13: untrusted persisted data is validated on read.
// PURE. Property-based-testing target (round-trip).
// ============================================================

import { z } from 'zod';
import type { Project } from '../engine/types';
import { STAGE_IDS } from '../engine/stages';

const stageIdSchema = z.enum(STAGE_IDS as [string, ...string[]]);

const optionSchema = z.object({
  key: z.string(),
  label: z.string(),
  isOther: z.boolean().optional(),
});
const questionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(optionSchema),
  multi: z.boolean().optional(),
});
const answerSchema = z.object({
  questionId: z.string(),
  selectedKeys: z.array(z.string()),
  otherText: z.string().optional(),
});
const stageStateSchema = z.object({
  id: stageIdSchema,
  status: z.enum(['locked', 'active', 'generating', 'awaiting-answers', 'awaiting-review', 'done', 'skipped']),
  questions: z.array(questionSchema),
  answers: z.array(answerSchema),
  artifactPath: z.string().optional(),
  summary: z.string().optional(),
  feedback: z.array(z.string()),
  skipReason: z.string().optional(),
});
const runSchema = z.object({
  currentStageId: stageIdSchema.nullable(),
  stages: z.array(stageStateSchema),
});
const artifactSchema = z.object({
  stageId: stageIdSchema,
  path: z.string(),
  title: z.string(),
  markdown: z.string(),
  version: z.number(),
  updatedAt: z.string(),
  editedByUser: z.boolean().optional(),
});
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  idea: z.string(),
  isExisting: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  run: runSchema,
  artifacts: z.array(artifactSchema),
  schemaVersion: z.number(),
});

export function serializeProject(p: Project): string {
  return JSON.stringify(p, null, 2);
}

export function deserializeProject(raw: string): Project {
  const obj = JSON.parse(raw);
  return projectSchema.parse(obj) as Project;
}
