// OpenAI provider — calls the Chat Completions API directly via fetch (no SDK),
// authenticated with a standard OpenAI API key. (The Codex ChatGPT-subscription
// path is a separate provider.)

import type { StageResult } from '../engine/types';
import { buildSystemPrompt, buildUserPrompt } from '../aidlc/prompts';
import { parseQuestions, markdownToArtifact } from '../aidlc/parsing';
import { AppError } from '../security/errors';
import { logger } from '../security/logger';
import type { AiProvider, StageInput, StageMode } from './provider';

const API_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 240_000;

export class OpenAiProvider implements AiProvider {
  id = 'openai' as const;
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  private headers(): Record<string, string> {
    return { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` };
  }

  private async errorFor(res: Response): Promise<AppError> {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body.error?.message ? `: ${body.error.message}` : '';
    } catch {
      /* ignore */
    }
    logger.error('OpenAI API error', { status: res.status });
    if (res.status === 401) return new AppError(`The AI provider rejected the API key${detail}. Check it in Settings.`, 401, 'provider_auth');
    if (res.status === 404) return new AppError(`Model not found${detail}. Try a different model in Settings (e.g. gpt-4o).`, 404, 'provider_model');
    if (res.status === 429) return new AppError('AI provider rate limit reached. Please try again shortly.', 429, 'provider_rate');
    return new AppError(`The AI provider returned an error${detail}.`, 502, 'provider_error');
  }

  private body(system: string, user: string, maxTokens: number, stream: boolean): string {
    return JSON.stringify({
      model: this.model,
      max_completion_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      ...(stream ? { stream: true } : {}),
    });
  }

  private async call(system: string, user: string, maxTokens: number): Promise<string> {
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: this.headers(),
        body: this.body(system, user, maxTokens, false),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      logger.error('OpenAI request failed (network/timeout)');
      throw new AppError('The AI provider did not respond in time. Please try again.', 504, 'provider_timeout');
    }
    if (!res.ok) throw await this.errorFor(res);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text.trim()) throw new AppError('The AI provider returned an empty response.', 502, 'provider_empty');
    return text;
  }

  private async callStream(system: string, user: string, maxTokens: number, onText: (t: string) => void): Promise<string> {
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: this.headers(),
        body: this.body(system, user, maxTokens, true),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      logger.error('OpenAI stream failed (network/timeout)');
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
          const evt = JSON.parse(payload) as { choices?: { delta?: { content?: string } }[] };
          const piece = evt.choices?.[0]?.delta?.content;
          if (piece) {
            full += piece;
            onText(piece);
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
      return this.runStage(input, 'questions');
    }
    const text = await this.callStream(buildSystemPrompt(input, 'artifact'), buildUserPrompt(input, 'artifact'), 8000, onText);
    const art = markdownToArtifact(text, input.stageTitle);
    return { kind: 'artifact', title: art.title, markdown: art.markdown, summary: art.summary };
  }

  async testConnection(): Promise<void> {
    // Verify only that the key + model are accepted and reachable. Do NOT require
    // output text: reasoning models (e.g. gpt-5.x) can spend a small token budget
    // entirely on internal reasoning and return empty visible content — that is a
    // valid, authorized response, not a failure.
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ model: this.model, max_completion_tokens: 16, messages: [{ role: 'user', content: 'ping' }] }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new AppError('The AI provider did not respond in time. Please try again.', 504, 'provider_timeout');
    }
    if (!res.ok) throw await this.errorFor(res);
  }
}
