import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { serializeProject, deserializeProject } from '@/lib/aidlc/serialization';
import * as M from '@/lib/engine/machine';
import type { Project, Run } from '@/lib/engine/types';
import { DOCUMENT_TYPES } from '@/lib/engine/types';
import { STAGE_IDS } from '@/lib/engine/stages';

const isoArb = fc.integer({ min: 0, max: 2_000_000_000_000 }).map((ms) => new Date(ms).toISOString());

// A realistic Run advanced a random number of stages.
const runArb = fc.nat({ max: STAGE_IDS.length }).map((n): Run => {
  let run = M.createRun();
  for (let i = 0; i < n && run.currentStageId; i++) {
    const id = run.currentStageId;
    run = M.setArtifact(run, id, 'path.md', 'summary');
    run = M.approve(run, id);
  }
  return run;
});

const artifactArb = fc.record({
  stageId: fc.constantFrom(...STAGE_IDS),
  documentType: fc.constantFrom(...DOCUMENT_TYPES),
  path: fc.string({ minLength: 1, maxLength: 60 }),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  markdown: fc.string({ maxLength: 400 }),
  version: fc.nat({ max: 20 }),
  updatedAt: isoArb,
  editedByUser: fc.boolean(),
});

const projectArb: fc.Arbitrary<Project> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 40 }),
  name: fc.string({ minLength: 1, maxLength: 80 }),
  idea: fc.string({ maxLength: 400 }),
  documentType: fc.constantFrom(...DOCUMENT_TYPES),
  isExisting: fc.boolean(),
  createdAt: isoArb,
  updatedAt: isoArb,
  run: runArb,
  artifacts: fc.array(artifactArb, { maxLength: 5 }),
  schemaVersion: fc.constant(2),
}) as fc.Arbitrary<Project>;

describe('project serialization', () => {
  it('PROPERTY: round-trips any valid Project through serialize/deserialize', () => {
    fc.assert(
      fc.property(projectArb, (project) => {
        const restored = deserializeProject(serializeProject(project));
        expect(restored).toEqual(project);
      }),
    );
  });

  it('rejects malformed project JSON', () => {
    expect(() => deserializeProject('{"id":"x"}')).toThrow();
    expect(() => deserializeProject('not json')).toThrow();
  });

  it('back-compat: a legacy project without documentType defaults to dev-vision', () => {
    const legacy = JSON.stringify({
      id: 'p1',
      name: 'Legacy',
      idea: 'old idea',
      isExisting: false,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
      run: {
        currentStageId: 'vision',
        stages: [
          { id: 'vision', status: 'awaiting-review', questions: [], answers: [], feedback: [], artifactPath: 'vision-document.md' },
        ],
      },
      artifacts: [
        { stageId: 'vision', path: 'vision-document.md', title: 'V', markdown: '# V', version: 1, updatedAt: '2020-01-01T00:00:00.000Z' },
      ],
      schemaVersion: 1,
    });
    const p = deserializeProject(legacy);
    expect(p.documentType).toBe('dev-vision');
    expect(p.artifacts[0].documentType).toBe('dev-vision');
  });

  it('back-compat: an unknown stored documentType falls back to dev-vision', () => {
    const bad = JSON.stringify({
      id: 'p2',
      name: 'X',
      idea: 'y',
      documentType: 'totally-bogus',
      isExisting: false,
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
      run: { currentStageId: 'vision', stages: [{ id: 'vision', status: 'active', questions: [], answers: [], feedback: [] }] },
      artifacts: [],
      schemaVersion: 1,
    });
    expect(deserializeProject(bad).documentType).toBe('dev-vision');
  });
});
