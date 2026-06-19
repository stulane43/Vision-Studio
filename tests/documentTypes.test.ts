import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { DOCUMENT_TYPE_LIST, getDocumentType } from '@/lib/aidlc/documentTypes';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/aidlc/prompts';
import type { StageInput } from '@/lib/providers/provider';
import type { DocumentType } from '@/lib/engine/types';
import { DOCUMENT_TYPES, DEFAULT_DOCUMENT_TYPE } from '@/lib/engine/types';

function makeInput(documentType: DocumentType, withAnswers = false): StageInput {
  return {
    stageId: 'vision',
    stageTitle: 'Doc',
    stageBlurb: 'blurb',
    phase: 'Inception',
    documentType,
    project: { name: 'Test', idea: 'Some idea text', isExisting: false },
    priorArtifacts: [],
    answers: withAnswers ? [{ questionId: 'q1', selectedKeys: ['A'] }] : [],
    askedQuestions: withAnswers ? [{ id: 'q1', text: 'Q?', options: [{ key: 'A', label: 'a' }] }] : [],
    feedback: [],
  };
}

describe('document-type registry', () => {
  it('lists every DocumentType exactly once', () => {
    const ids = DOCUMENT_TYPE_LIST.map((d) => d.id).sort();
    expect(ids).toEqual([...DOCUMENT_TYPES].sort());
    expect(new Set(ids).size).toBe(DOCUMENT_TYPES.length);
  });

  it('getDocumentType returns the matching def for every known id', () => {
    for (const id of DOCUMENT_TYPES) {
      expect(getDocumentType(id).id).toBe(id);
    }
  });

  it('PROPERTY: getDocumentType is total and always returns a valid def', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.constantFrom<unknown>(undefined, null, '', 'dev-vision', 'nope')), (s) => {
        const def = getDocumentType(s as string | null | undefined);
        expect(DOCUMENT_TYPES).toContain(def.id);
      }),
    );
  });

  it('unknown / missing ids fall back to the default type', () => {
    expect(getDocumentType('totally-bogus').id).toBe(DEFAULT_DOCUMENT_TYPE);
    expect(getDocumentType(undefined).id).toBe(DEFAULT_DOCUMENT_TYPE);
    expect(getDocumentType(null).id).toBe(DEFAULT_DOCUMENT_TYPE);
  });

  it('every def has the required, non-empty fields', () => {
    for (const d of DOCUMENT_TYPE_LIST) {
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.chipLabel.length).toBeGreaterThan(0);
      expect(d.shortDescription.length).toBeGreaterThan(0);
      expect(d.systemRole.length).toBeGreaterThan(0);
      expect(d.questionGuidance.length).toBeGreaterThan(0);
      expect(d.structureGuide.length).toBeGreaterThan(0);
      expect(d.examples.length).toBeGreaterThanOrEqual(2);
      expect(d.artifactFileName.endsWith('.md')).toBe(true);
    }
  });

  it('preserves the development artifact filename (no regression for existing projects)', () => {
    expect(getDocumentType('dev-vision').artifactFileName).toBe('vision-document.md');
  });

  it('has exactly one recommended fallback type', () => {
    expect(DOCUMENT_TYPE_LIST.filter((d) => d.recommendedFallback).length).toBe(1);
  });
});

describe('per-type prompt selection', () => {
  it('artifact prompt uses the selected type structure guide and role', () => {
    for (const id of DOCUMENT_TYPES) {
      const def = getDocumentType(id);
      const input = makeInput(id);
      const sys = buildSystemPrompt(input, 'artifact');
      const user = buildUserPrompt(input, 'artifact');
      expect(sys).toContain(def.systemRole);
      expect(user).toContain(def.structureGuide);
    }
  });

  it('questions prompt uses the selected type question guidance', () => {
    for (const id of DOCUMENT_TYPES) {
      const def = getDocumentType(id);
      const sys = buildSystemPrompt(makeInput(id), 'questions');
      expect(sys).toContain(def.questionGuidance);
    }
  });

  it('non-development types require AI Instructions and a copy-ready prompt', () => {
    for (const d of DOCUMENT_TYPE_LIST.filter((x) => !x.isDev)) {
      const sys = buildSystemPrompt(makeInput(d.id), 'artifact');
      expect(sys).toContain('AI Instructions');
      expect(sys).toContain('Ready-to-Use AI Prompt');
    }
  });
});
