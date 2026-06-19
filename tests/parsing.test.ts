import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseStageResult, extractJson } from '@/lib/aidlc/parsing';

const optionArb = fc.record({
  key: fc.string({ minLength: 1, maxLength: 8 }),
  label: fc.string({ minLength: 1, maxLength: 100 }),
  isOther: fc.boolean(),
});

const questionArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  text: fc.string({ minLength: 1, maxLength: 100 }),
  options: fc.array(optionArb, { minLength: 2, maxLength: 6 }),
  multi: fc.boolean(),
});

const questionsResultArb = fc.record({
  kind: fc.constant('questions' as const),
  questions: fc.array(questionArb, { minLength: 1, maxLength: 6 }),
});

const artifactResultArb = fc.record({
  kind: fc.constant('artifact' as const),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  markdown: fc.string({ minLength: 1, maxLength: 500 }),
  summary: fc.string({ minLength: 1, maxLength: 200 }),
});

const stageResultArb = fc.oneof(questionsResultArb, artifactResultArb);

describe('stage result parsing', () => {
  it('PROPERTY: round-trips any valid StageResult through JSON', () => {
    fc.assert(
      fc.property(stageResultArb, (result) => {
        const parsed = parseStageResult(JSON.stringify(result));
        expect(parsed).toEqual(result);
      }),
    );
  });

  it('extracts JSON from a ```json fenced block', () => {
    const result = { kind: 'artifact', title: 'T', markdown: '# Hi', summary: 's' };
    const raw = 'Here is your artifact:\n```json\n' + JSON.stringify(result) + '\n```\nDone.';
    expect(parseStageResult(raw)).toEqual(result);
  });

  it('extracts JSON preceded by prose', () => {
    const result = { kind: 'artifact', title: 'T', markdown: 'body', summary: 's' };
    const raw = 'Sure! Here it is:\n' + JSON.stringify(result);
    expect(parseStageResult(raw)).toEqual(result);
  });

  it('extracts a balanced object with nested braces', () => {
    const raw = 'noise {"kind":"artifact","title":"a","markdown":"x {y} z","summary":"s"} trailing';
    expect(extractJson(raw)).toEqual({ kind: 'artifact', title: 'a', markdown: 'x {y} z', summary: 's' });
  });

  it('throws on output containing no JSON', () => {
    expect(() => parseStageResult('I could not help with that.')).toThrow();
  });

  it('rejects a structurally invalid StageResult', () => {
    expect(() => parseStageResult(JSON.stringify({ kind: 'artifact', title: 'only title' }))).toThrow();
  });
});
