// Per-user settings: provider, model, and credentials, persisted to a local,
// gitignored file (.aidlc/settings/<userId>.json). Each account has its own
// provider config and keys. SECURITY-12: secrets are never returned to the
// client, never logged, and live under a gitignored directory.

import fs from 'node:fs/promises';
import path from 'node:path';
import { settingsSchema, type SettingsInput } from '../security/validation';
import { safeId, safeJoin } from '../security/paths';
import { AIDLC_DIR } from '../config/paths';

const SETTINGS_DIR = path.join(AIDLC_DIR, 'settings');

export type ProviderId = 'anthropic' | 'openai' | 'mock';

const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: process.env.AIDLC_MODEL || 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  mock: 'mock',
};

interface StoredSettings {
  provider: ProviderId;
  model: string;
  anthropicKey?: string;
  openaiKey?: string;
}

export interface PublicSettings {
  provider: ProviderId;
  model: string;
  hasAnthropicKey: boolean;
  hasOpenaiKey: boolean;
  /** Does the currently-selected provider have working credentials? */
  ready: boolean;
}

export interface ResolvedSettings {
  provider: ProviderId;
  model: string;
  key: string; // the active provider's key (anthropic/openai)
}

function fileFor(userId: string): string {
  return safeJoin(SETTINGS_DIR, `${safeId(userId)}.json`);
}

function envProvider(): ProviderId {
  const p = process.env.AIDLC_PROVIDER;
  return p === 'anthropic' || p === 'openai' ? p : 'mock';
}

async function readStored(userId: string): Promise<StoredSettings> {
  try {
    const raw = await fs.readFile(fileFor(userId), 'utf8');
    const p = JSON.parse(raw) as Partial<StoredSettings>;
    const provider: ProviderId =
      p.provider === 'anthropic' || p.provider === 'openai' || p.provider === 'mock' ? p.provider : envProvider();
    return {
      provider,
      model: typeof p.model === 'string' && p.model ? p.model : DEFAULT_MODELS[provider],
      anthropicKey: typeof p.anthropicKey === 'string' && p.anthropicKey ? p.anthropicKey : undefined,
      openaiKey: typeof p.openaiKey === 'string' && p.openaiKey ? p.openaiKey : undefined,
    };
  } catch {
    const provider = envProvider();
    return { provider, model: DEFAULT_MODELS[provider] };
  }
}

async function writeStored(userId: string, s: StoredSettings): Promise<void> {
  await fs.mkdir(SETTINGS_DIR, { recursive: true });
  await fs.writeFile(fileFor(userId), JSON.stringify(s, null, 2), 'utf8');
}

function resolveAnthropicKey(s: StoredSettings): string {
  return s.anthropicKey || process.env.ANTHROPIC_API_KEY || '';
}
function resolveOpenaiKey(s: StoredSettings): string {
  return s.openaiKey || process.env.OPENAI_API_KEY || '';
}

export async function getResolvedSettings(userId: string): Promise<ResolvedSettings> {
  const s = await readStored(userId);
  const key = s.provider === 'anthropic' ? resolveAnthropicKey(s) : s.provider === 'openai' ? resolveOpenaiKey(s) : '';
  return { provider: s.provider, model: s.model, key };
}

export async function getPublicSettings(userId: string): Promise<PublicSettings> {
  const s = await readStored(userId);
  const hasAnthropicKey = !!resolveAnthropicKey(s);
  const hasOpenaiKey = !!resolveOpenaiKey(s);
  const ready =
    s.provider === 'mock' ||
    (s.provider === 'anthropic' && hasAnthropicKey) ||
    (s.provider === 'openai' && hasOpenaiKey);
  return { provider: s.provider, model: s.model, hasAnthropicKey, hasOpenaiKey, ready };
}

export async function updateSettings(userId: string, input: unknown): Promise<PublicSettings> {
  const parsed: SettingsInput = settingsSchema.parse(input);
  const current = await readStored(userId);
  const provider = parsed.provider;
  const model =
    parsed.model?.trim() || (provider !== current.provider ? DEFAULT_MODELS[provider] : current.model) || DEFAULT_MODELS[provider];
  const next: StoredSettings = { ...current, provider, model };
  // Store the supplied key into the slot for the selected provider.
  if (parsed.apiKey && parsed.apiKey.trim()) {
    const k = parsed.apiKey.trim();
    if (provider === 'anthropic') next.anthropicKey = k;
    else if (provider === 'openai') next.openaiKey = k;
  }
  await writeStored(userId, next);
  return getPublicSettings(userId);
}
