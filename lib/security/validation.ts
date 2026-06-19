// SECURITY-05: input validation on all API parameters via Zod schemas.

import { z } from 'zod';

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(40)
    .regex(/^[A-Za-z0-9_.-]+$/, 'Use letters, numbers, and . _ - only'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});
export type Credentials = z.infer<typeof credentialsSchema>;

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  idea: z.string().trim().min(3, 'Describe your idea (a few words at least)').max(8000),
  isExisting: z.boolean().optional().default(false),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const answerSchema = z.object({
  questionId: z.string().min(1).max(160),
  selectedKeys: z.array(z.string().min(1).max(8)).max(20),
  otherText: z.string().max(4000).optional(),
});

export const stageActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('run') }),
  z.object({
    action: z.literal('answers'),
    stageId: z.string().min(1).max(64),
    answers: z.array(answerSchema).max(60),
  }),
  z.object({
    action: z.literal('more-questions'),
    stageId: z.string().min(1).max(64),
    answers: z.array(answerSchema).max(60),
  }),
  z.object({ action: z.literal('approve'), stageId: z.string().min(1).max(64) }),
  z.object({
    action: z.literal('request-changes'),
    stageId: z.string().min(1).max(64),
    feedback: z.string().trim().min(1).max(4000),
  }),
  z.object({
    action: z.literal('edit'),
    stageId: z.string().min(1).max(64),
    markdown: z.string().max(200000),
  }),
  z.object({
    action: z.literal('revise'),
    stageId: z.string().min(1).max(64),
    comments: z
      .array(z.object({ quote: z.string().max(2000), note: z.string().max(2000) }))
      .max(50)
      .optional()
      .default([]),
    instruction: z.string().max(4000).optional().default(''),
  }),
]);
export type StageAction = z.infer<typeof stageActionSchema>;

export const settingsSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'mock']),
  model: z.string().trim().max(120).optional(),
  // The key for the currently-selected provider (anthropic -> Anthropic key, openai -> OpenAI key).
  apiKey: z.string().trim().max(500).optional(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
