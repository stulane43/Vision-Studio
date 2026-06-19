// Anthropic provider — calls the Messages API directly via fetch (no SDK dependency).

import type { StageResult } from '../engine/types';
import { buildSystemPrompt, buildUserPrompt } from '../aidlc/prompts';
import { parseQuestions, markdownToArtifact } from '../aidlc/parsing';
import { AppError } from '../security/errors';
import { logger } from '../security/logger';
import type { AiProvider, StageInput, StageMode } from './provider';

const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const REQUEST_TIMEOUT_MS = 240_000;

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

export class AnthropicProvider implements AiProvider {
  id = 'anthropic' as const;
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  private headers(): Record<string, string> {
    return {
      'content-type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    };
  }

  private async errorFor(res: Response): Promise<AppError> {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body.error?.message ? `: ${body.error.message}` : '';
    } catch {
      /* ignore */
    }
    logger.error('Anthropic API error', { status: res.status });
    if (res.status === 401) return new AppError(`The AI provider rejected the API key${detail}. Check it in Settings.`, 401, 'provider_auth');
    if (res.status === 404) return new AppError(`Model not found${detail}. Try a different model in Settings (e.g. claude-sonnet-4-6).`, 404, 'provider_model');
    if (res.status === 429) return new AppError('AI provider rate limit reached. Please try again shortly.', 429, 'provider_rate');
    return new AppError(`The AI provider returned an error${detail}.`, 502, 'provider_error');
  }

  /** Non-streaming call. */
  private async call(system: string, user: string, maxTokens: number): Promise<string> {
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ model: this.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      logger.error('Anthropic request failed (network/timeout)');
      throw new AppError('The AI provider did not respond in time. Please try again.', 504, 'provider_timeout');
    }
    if (!res.ok) throw await this.errorFor(res);
    const data = (await res.json()) as { content?: AnthropicContentBlock[] };
    const text = Array.isArray(data.content)
      ? data.content.filter((b) => b.type === 'text' && b.text).map((b) => b.text).join('')
      : '';
    if (!text.trim()) throw new AppError('The AI provider returned an empty response.', 502, 'provider_empty');
    return text;
  }

  /** Streaming call — invokes onText for each text delta; returns the full text. */
  private async callStream(system: string, user: string, maxTokens: number, onText: (t: string) => void): Promise<string> {
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ model: this.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }], stream: true }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      logger.error('Anthropic stream failed (network/timeout)');
      throw new AppError('The AI provider did not respond in time. Please try again.', 504, 'provider_timeout');
    }
    if (!res.ok) throw await this.errorFor(res);
    if (!res.body) throw new AppError('The AI provider returned no stream.', 502, 'provider_empty');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload) as { type?: string; delta?: { type?: string; text?: string } };
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
            full += evt.delta.text;
            onText(evt.delta.text);
          }
        } catch {
          /* ignore keep-alive / non-JSON lines */
        }
      }
    }
    if (!full.trim()) throw new AppError('The AI provider returned an empty response.', 502, 'provider_empty');
    return full;
  }

  async runStage(input: StageInput, mode: StageMode): Promise<StageResult> {
    if (mode === 'questions') {
      const text = await this.call(buildSystemPrompt(input, 'questions'), buildUserPrompt(input, 'questions'), 2000);
      return { kind: 'questions', questions: parseQuestions(text) };
    }
    const text = await this.call(buildSystemPrompt(input, 'artifact'), buildUserPrompt(input, 'artifact'), 8000);
    const art = markdownToArtifact(text, input.stageTitle);
    return { kind: 'artifact', title: art.title, markdown: art.markdown, summary: art.summary };
  }

  async runStageStream(input: StageInput, mode: StageMode, onText: (t: string) => void): Promise<StageResult> {
    if (mode === 'questions') {
      // Questions are small JSON — no useful streaming; reuse the non-streaming path.
      return this.runStage(input, 'questions');
    }
    const text = await this.callStream(buildSystemPrompt(input, 'artifact'), buildUserPrompt(input, 'artifact'), 8000, onText);
    const art = markdownToArtifact(text, input.stageTitle);
    return { kind: 'artifact', title: art.title, markdown: art.markdown, summary: art.summary };
  }

  async testConnection(): Promise<void> {
    // Verify only that the key + model are accepted and reachable (HTTP 200) —
    // don't require output text, so a tiny token budget can't cause a false failure.
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ model: this.model, max_tokens: 16, messages: [{ role: 'user', content: 'ping' }] }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new AppError('The AI provider did not respond in time. Please try again.', 504, 'provider_timeout');
    }
    if (!res.ok) throw await this.errorFor(res);
  }
}
