// ============================================================
// Parse AI provider output into a validated StageResult.
// Models sometimes wrap JSON in prose or ```json fences — this
// extracts the JSON robustly. PURE. Property-based-testing target.
// ============================================================

import { z } from 'zod';
import type { Question, StageResult } from '../engine/types';

const optionSchema = z.object({
  key: z.string().min(1).max(8),
  label: z.string().min(1).max(800),
  isOther: z.boolean().optional(),
});

const questionSchema = z.object({
  id: z.string().min(1).max(160),
  text: z.string().min(1).max(2000),
  options: z.array(optionSchema).min(2).max(8),
  multi: z.boolean().optional(),
});

export const stageResultSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('questions'), questions: z.array(questionSchema).min(1).max(12) }),
  z.object({
    kind: z.literal('artifact'),
    title: z.string().min(1).max(300),
    markdown: z.string().min(1).max(200000),
    summary: z.string().min(1).max(4000),
  }),
]);

/** Extract the first balanced JSON object substring starting at `start`. */
function extractBalanced(s: string, start: number): string | null {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/** Best-effort extraction of a JSON object from arbitrary model text. */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* fall through */
    }
  }
  const start = trimmed.indexOf('{');
  if (start >= 0) {
    const candidate = extractBalanced(trimmed, start);
    if (candidate) {
      try {
        return JSON.parse(candidate);
      } catch {
        /* fall through */
      }
    }
  }
  throw new Error('No JSON object found in provider output');
}

/** Parse + validate raw provider output into a StageResult. */
export function parseStageResult(raw: string): StageResult {
  const obj = extractJson(raw);
  return stageResultSchema.parse(obj) as StageResult;
}

export const questionsOnlySchema = z.object({
  questions: z.array(questionSchema).min(1).max(8),
});

/** Parse + validate a questions-only JSON result. */
export function parseQuestions(raw: string): Question[] {
  const obj = extractJson(raw);
  return questionsOnlySchema.parse(obj).questions as Question[];
}

/** Turn a raw markdown artifact response into {title, markdown, summary}. */
export function markdownToArtifact(
  raw: string,
  fallbackTitle: string,
): { title: string; markdown: string; summary: string } {
  let md = raw.trim();
  // Unwrap if the whole thing was fenced.
  const whole = md.match(/^```(?:markdown|md)?\s*([\s\S]*?)```$/i);
  if (whole) md = whole[1].trim();

  const h1 = md.match(/^#\s+(.+)$/m);
  const title = h1 ? h1[1].trim() : fallbackTitle;

  const firstProse = md
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith('#'));
  const summary = firstProse ? firstProse.replace(/[*_`>#-]/g, '').slice(0, 200) : `${fallbackTitle} ready for review.`;

  return { title, markdown: md, summary };
}

