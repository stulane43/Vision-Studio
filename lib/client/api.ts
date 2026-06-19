// Typed client-side API wrappers. Imports are type-only where they touch
// server modules, so no Node code leaks into the browser bundle.

import type { Answer, Project, StageId } from '@/lib/engine/types';
import type { ProjectSummary } from '@/lib/storage/storage';
import type { PublicSettings } from '@/lib/services/settings';

export type StageActionInput =
  | { action: 'run' }
  | { action: 'answers'; stageId: StageId; answers: Answer[] }
  | { action: 'more-questions'; stageId: StageId; answers: Answer[] }
  | { action: 'approve'; stageId: StageId }
  | { action: 'request-changes'; stageId: StageId; feedback: string }
  | { action: 'edit'; stageId: StageId; markdown: string }
  | { action: 'revise'; stageId: StageId; comments: { quote: string; note: string }[]; instruction: string };

export interface SettingsInput {
  provider: 'anthropic' | 'openai' | 'mock';
  model?: string;
  apiKey?: string;
}

export interface AuthUser {
  id: string;
  username: string;
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  let body: { ok?: boolean; data?: T; error?: string } = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok || !body.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body.data as T;
}

export const api = {
  listProjects: () => req<ProjectSummary[]>('/api/projects'),
  createProject: (input: { name: string; idea: string; isExisting: boolean }) =>
    req<Project>('/api/projects', { method: 'POST', body: JSON.stringify(input) }),
  getProject: (id: string) => req<Project>(`/api/projects/${id}`),
  deleteProject: (id: string) =>
    req<{ deleted: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
  stageAction: (id: string, action: StageActionInput) =>
    req<Project>(`/api/projects/${id}/stage`, { method: 'POST', body: JSON.stringify(action) }),
  stageActionStream: async (
    id: string,
    action: StageActionInput,
    onDelta: (t: string) => void,
  ): Promise<Project> => {
    const res = await fetch(`/api/projects/${id}/stage/stream`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(action),
    });
    if (!res.ok || !res.body) {
      let msg = `Request failed (${res.status})`;
      try {
        const j = (await res.json()) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        /* non-JSON */
      }
      throw new Error(msg);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let project: Project | null = null;
    let error = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        let evt: { type?: string; text?: string; project?: Project; error?: string };
        try {
          evt = JSON.parse(t);
        } catch {
          continue;
        }
        if (evt.type === 'delta' && typeof evt.text === 'string') onDelta(evt.text);
        else if (evt.type === 'done' && evt.project) project = evt.project;
        else if (evt.type === 'error') error = evt.error ?? 'Generation failed';
      }
    }
    if (error) throw new Error(error);
    if (!project) throw new Error('No result from server.');
    return project;
  },
  getSettings: () => req<PublicSettings>('/api/settings'),
  saveSettings: (input: SettingsInput) =>
    req<PublicSettings>('/api/settings', { method: 'POST', body: JSON.stringify(input) }),
  testSettings: (input?: SettingsInput) =>
    req<{ ok: boolean; provider: string; model: string }>('/api/settings/test', {
      method: 'POST',
      body: JSON.stringify(input ?? {}),
    }),

  // Auth
  me: () => req<{ user: AuthUser | null }>('/api/auth/me'),
  login: (username: string, password: string) =>
    req<AuthUser>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  signup: (username: string, password: string) =>
    req<AuthUser>('/api/auth/signup', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => req<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
};
