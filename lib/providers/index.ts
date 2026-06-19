import { AnthropicProvider } from './anthropic';
import { OpenAiProvider } from './openai';
import { MockProvider } from './mock';
import type { AiProvider } from './provider';
import { getResolvedSettings, type ProviderId } from '../services/settings';

export interface BuildOpts {
  provider: ProviderId;
  model: string;
  key: string;
}

/** Build a provider from resolved settings. Falls back to Mock when credentials are missing. */
export function buildProvider(opts: BuildOpts): AiProvider {
  const { provider, model, key } = opts;
  if (provider === 'anthropic' && key) return new AnthropicProvider(key, model);
  if (provider === 'openai' && key) return new OpenAiProvider(key, model);
  return new MockProvider();
}

/** Resolve the active provider for a user from their saved settings. */
export async function getProvider(userId: string): Promise<AiProvider> {
  return buildProvider(await getResolvedSettings(userId));
}

export type { AiProvider, StageInput, StageMode } from './provider';
