// ============================================================
// Project Service — coordinates the engine, the AI provider, and
// per-user storage to produce a Vision Document. Every operation is
// scoped to a userId so each account's projects are isolated.
// ============================================================

import crypto from 'node:crypto';
import type { Answer, Artifact, DocumentType, Project, Readiness, StageId } from '../engine/types';
import { DEFAULT_DOCUMENT_TYPE, SCHEMA_VERSION } from '../engine/types';
import * as M from '../engine/machine';
import { getStageDef, PHASE_TITLES } from '../engine/stages';
import { getDocumentType } from '../aidlc/documentTypes';
import { getProvider } from '../providers';
import type { PriorArtifact, ReviewComment, StageInput, StageMode } from '../providers/provider';
import { stageAsksQuestions } from '../aidlc/prompts';
import { getStorage } from '../storage';
import type { ProjectSummary } from '../storage';
import { AppError } from '../security/errors';
import { logger } from '../security/logger';

const now = (): string => new Date().toISOString();

function priorArtifacts(p: Project): PriorArtifact[] {
  const doneIds = new Set(p.run.stages.filter((s) => s.status === 'done').map((s) => s.id));
  return p.artifacts
    .filter((a) => doneIds.has(a.stageId))
    .map((a) => ({ stageId: a.stageId, title: a.title, markdown: a.markdown }));
}

function upsertArtifact(p: Project, art: Artifact): void {
  const i = p.artifacts.findIndex((a) => a.stageId === art.stageId);
  if (i >= 0) p.artifacts[i] = art;
  else p.artifacts.push(art);
}

function auditEntry(stage: string, action: string, detail = ''): string {
  return `\n## ${stage} — ${action}\n**Timestamp**: ${now()}\n${detail ? detail + '\n' : ''}\n---\n`;
}

async function persist(userId: string, p: Project, audit: string): Promise<Project> {
  p.updatedAt = now();
  await getStorage(userId).saveProject(p);
  await getStorage(userId).appendAudit(p.id, audit);
  return p;
}

async function persistState(userId: string, p: Project): Promise<void> {
  p.updatedAt = now();
  await getStorage(userId).saveProject(p);
}

export async function loadProject(userId: string, id: string): Promise<Project> {
  const p = await getStorage(userId).getProject(id);
  if (!p) throw new AppError('Project not found', 404, 'not_found');
  return p;
}

export async function listProjects(userId: string): Promise<ProjectSummary[]> {
  return getStorage(userId).listProjects();
}

export async function deleteProject(userId: string, id: string): Promise<void> {
  await getStorage(userId).deleteProject(id);
  logger.info('Project deleted', { id });
}

export async function createProjectFromIdea(
  userId: string,
  input: { name: string; idea: string; isExisting: boolean; documentType?: DocumentType },
): Promise<Project> {
  const id = crypto.randomUUID();
  const ts = now();
  const documentType = input.documentType ?? DEFAULT_DOCUMENT_TYPE;
  const project: Project = {
    id,
    name: input.name,
    idea: input.idea,
    documentType,
    isExisting: input.isExisting,
    createdAt: ts,
    updatedAt: ts,
    run: M.createRun(),
    artifacts: [],
    schemaVersion: SCHEMA_VERSION,
  };
  await getStorage(userId).saveProject(project);
  await getStorage(userId).appendAudit(
    id,
    `# Audit Log — ${input.name}\n` +
      auditEntry('Project', 'Created', `Type: ${getDocumentType(documentType).label}\nIdea: ${input.idea}`),
  );
  logger.info('Project created', { id, documentType });
  return project;
}

interface ReviseContext {
  currentDocument: string;
  comments: ReviewComment[];
  instruction: string;
}

/** Generate questions or the Vision Document for the current active stage. */
async function generateForCurrent(
  userId: string,
  p: Project,
  onText?: (t: string) => void,
  revise?: ReviseContext,
): Promise<Project> {
  const cur = M.currentStage(p.run);
  if (!cur || cur.status !== 'active') return p;
  const def = getStageDef(cur.id);
  const doc = getDocumentType(p.documentType);
  const input: StageInput = {
    stageId: cur.id,
    stageTitle: doc.artifactTitle,
    stageBlurb: def.blurb,
    phase: PHASE_TITLES[def.phase],
    documentType: p.documentType,
    project: { name: p.name, idea: p.idea, isExisting: p.isExisting },
    priorArtifacts: priorArtifacts(p),
    answers: cur.answers,
    askedQuestions: cur.questions,
    feedback: revise?.instruction ? [...cur.feedback, revise.instruction] : cur.feedback,
    currentDocument: revise?.currentDocument,
    comments: revise?.comments ?? [],
  };
  const mode: StageMode =
    !revise && stageAsksQuestions(cur.id) && cur.answers.length === 0 && cur.feedback.length === 0
      ? 'questions'
      : 'artifact';

  // Mark as generating and persist so a reload (or returning after navigating away)
  // shows progress instead of restarting. The generation runs to completion server-side.
  p.run = M.setGenerating(p.run, cur.id);
  await persistState(userId, p);

  try {
    const provider = await getProvider(userId);
    const result = onText
      ? await provider.runStageStream(input, mode, onText)
      : await provider.runStage(input, mode);

    if (result.kind === 'questions') {
      p.run = M.setQuestions(p.run, cur.id, result.questions);
      return persist(userId, p, auditEntry(doc.label, 'Clarifying questions issued', `${result.questions.length} question(s).`));
    }

    const existing = p.artifacts.find((a) => a.stageId === cur.id);
    const art: Artifact = {
      stageId: cur.id,
      documentType: p.documentType,
      path: doc.artifactFileName,
      title: result.title,
      markdown: result.markdown,
      version: existing ? existing.version + 1 : 1,
      updatedAt: now(),
    };
    upsertArtifact(p, art);
    p.run = M.setArtifact(p.run, cur.id, doc.artifactFileName, result.summary);
    return persist(userId, p, auditEntry(doc.label, 'Document generated', result.summary));
  } catch (e) {
    p.run = M.reactivate(p.run, cur.id);
    await persistState(userId, p);
    throw e;
  }
}

export async function runCurrentStage(userId: string, id: string): Promise<Project> {
  const p = await loadProject(userId, id);
  return generateForCurrent(userId, p);
}

type StreamAction =
  | { action: 'run' }
  | { action: 'answers'; stageId: StageId; answers: Answer[] }
  | { action: 'request-changes'; stageId: StageId; feedback: string }
  | { action: 'revise'; stageId: StageId; comments: ReviewComment[]; instruction: string };

export async function runStageStreaming(
  userId: string,
  id: string,
  action: StreamAction,
  onText: (t: string) => void,
): Promise<Project> {
  const p = await loadProject(userId, id);
  if (action.action === 'answers') {
    if (p.run.currentStageId !== action.stageId) throw new AppError('That stage is not active', 409, 'stage_conflict');
    const cur = M.getStage(p.run, action.stageId);
    if (cur.status !== 'awaiting-answers') throw new AppError('This stage is not awaiting answers', 409, 'stage_conflict');
    p.run = M.setAnswers(p.run, action.stageId, action.answers);
    await persist(userId, p, auditEntry(getStageDef(action.stageId).title, 'Answers submitted', `${action.answers.length} answer(s).`));
  } else if (action.action === 'request-changes') {
    if (p.run.currentStageId !== action.stageId) throw new AppError('That stage is not active', 409, 'stage_conflict');
    p.run = M.requestChanges(p.run, action.stageId, action.feedback);
    await persist(userId, p, auditEntry(getStageDef(action.stageId).title, 'Changes requested', action.feedback));
  } else if (action.action === 'revise') {
    if (p.run.currentStageId !== action.stageId) throw new AppError('That stage is not active', 409, 'stage_conflict');
    const art = p.artifacts.find((a) => a.stageId === action.stageId);
    if (!art) throw new AppError('No document to revise yet', 409, 'stage_conflict');
    p.run = M.reactivate(p.run, action.stageId);
    await persist(userId, p, auditEntry(getStageDef(action.stageId).title, 'Revision requested', `${action.comments.length} comment(s)`));
    return generateForCurrent(userId, p, onText, {
      currentDocument: art.markdown,
      comments: action.comments,
      instruction: action.instruction,
    });
  } else if (action.action === 'run') {
    const cur = M.currentStage(p.run);
    if (cur && cur.status === 'generating') p.run = M.reactivate(p.run, cur.id);
  }
  return generateForCurrent(userId, p, onText);
}

export async function submitAnswers(userId: string, id: string, stageId: StageId, answers: Answer[]): Promise<Project> {
  const p = await loadProject(userId, id);
  if (p.run.currentStageId !== stageId) throw new AppError('That stage is not active', 409, 'stage_conflict');
  const cur = M.getStage(p.run, stageId);
  if (cur.status !== 'awaiting-answers') throw new AppError('This stage is not awaiting answers', 409, 'stage_conflict');
  p.run = M.setAnswers(p.run, stageId, answers);
  await persist(userId, p, auditEntry(getStageDef(stageId).title, 'Answers submitted', `${answers.length} answer(s).`));
  return generateForCurrent(userId, p);
}

/** Accumulate the current answers and ask another, deeper round of clarifying questions. */
export async function requestMoreQuestions(userId: string, id: string, stageId: StageId, answers: Answer[]): Promise<Project> {
  const p = await loadProject(userId, id);
  if (p.run.currentStageId !== stageId) throw new AppError('That stage is not active', 409, 'stage_conflict');
  const cur = M.getStage(p.run, stageId);
  if (cur.status !== 'awaiting-answers') throw new AppError('This stage is not awaiting answers', 409, 'stage_conflict');
  const def = getStageDef(stageId);
  const doc = getDocumentType(p.documentType);
  const input: StageInput = {
    stageId,
    stageTitle: doc.artifactTitle,
    stageBlurb: def.blurb,
    phase: PHASE_TITLES[def.phase],
    documentType: p.documentType,
    project: { name: p.name, idea: p.idea, isExisting: p.isExisting },
    priorArtifacts: priorArtifacts(p),
    answers,
    askedQuestions: cur.questions,
    feedback: cur.feedback,
  };
  const provider = await getProvider(userId);
  const result = await provider.runStage(input, 'questions');
  const fresh = result.kind === 'questions' ? result.questions : [];
  const reIded = fresh.map((q, i) => ({ ...q, id: `q${cur.questions.length + i + 1}` }));
  p.run = M.setAnswers(p.run, stageId, answers);
  p.run = M.setQuestions(p.run, stageId, [...cur.questions, ...reIded]);
  return persist(userId, p, auditEntry(def.title, 'More questions requested', `${reIded.length} new question(s).`));
}

export async function approveStage(userId: string, id: string, stageId: StageId): Promise<Project> {
  const p = await loadProject(userId, id);
  if (p.run.currentStageId !== stageId) throw new AppError('That stage is not active', 409, 'stage_conflict');
  const cur = M.getStage(p.run, stageId);
  if (cur.status !== 'awaiting-review') throw new AppError('There is nothing to finalize yet', 409, 'stage_conflict');
  p.run = M.approve(p.run, stageId);
  return persist(userId, p, auditEntry(getStageDef(stageId).title, 'Finalized', 'Vision Document finalized.'));
}

export async function requestStageChanges(userId: string, id: string, stageId: StageId, feedback: string): Promise<Project> {
  const p = await loadProject(userId, id);
  if (p.run.currentStageId !== stageId) throw new AppError('That stage is not active', 409, 'stage_conflict');
  p.run = M.requestChanges(p.run, stageId, feedback);
  await persist(userId, p, auditEntry(getStageDef(stageId).title, 'Changes requested', feedback));
  return generateForCurrent(userId, p);
}

export async function editArtifact(userId: string, id: string, stageId: StageId, markdown: string): Promise<Project> {
  const p = await loadProject(userId, id);
  const art = p.artifacts.find((a) => a.stageId === stageId);
  if (!art) throw new AppError('No document to edit yet', 404, 'not_found');
  art.markdown = markdown;
  art.version += 1;
  art.editedByUser = true;
  art.updatedAt = now();
  return persist(userId, p, auditEntry(getStageDef(stageId).title, 'Edited by user'));
}

/** Record lightweight "ready to use with AI?" feedback on a finalized project. */
export async function recordFeedback(userId: string, id: string, rating: Readiness['rating']): Promise<Project> {
  const p = await loadProject(userId, id);
  p.readiness = { rating, at: now() };
  return persist(
    userId,
    p,
    auditEntry(getDocumentType(p.documentType).label, 'Readiness feedback', `Ready to use with AI: ${rating}`),
  );
}
