import { buildProvider } from '@/lib/providers';
import { getResolvedSettings } from '@/lib/services/settings';
import { requireUser } from '@/lib/auth/current';
import { AppError } from '@/lib/security/errors';
import { jsonError, jsonOk } from '@/lib/api/respond';

export const dynamic = 'force-dynamic';

// Tests the provider. Any of provider/model/apiKey/openaiMode may be supplied in the
// body to test un-saved form values; anything omitted falls back to saved settings.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const stored = await getResolvedSettings(user.id);
    let provider = stored.provider;
    let model = stored.model;
    let key = stored.key;

    const raw = await req.text();
    if (raw && raw.trim() && raw.trim() !== '{}') {
      let body: { provider?: unknown; model?: unknown; apiKey?: unknown } = {};
      try {
        body = JSON.parse(raw);
      } catch {
        throw new AppError('Invalid request body', 400, 'bad_request');
      }
      if (body.provider === 'anthropic' || body.provider === 'openai' || body.provider === 'mock') provider = body.provider;
      if (typeof body.model === 'string' && body.model.trim()) model = body.model.trim();
      if (typeof body.apiKey === 'string' && body.apiKey.trim()) key = body.apiKey.trim();
    }

    if (provider === 'anthropic' && !key) {
      throw new AppError('No API key set — enter your Anthropic key above first.', 400, 'no_key');
    }
    if (provider === 'openai' && !key) {
      throw new AppError('No API key set — enter your OpenAI key above first.', 400, 'no_key');
    }

    const provInstance = buildProvider({ provider, model, key });
    await provInstance.testConnection();
    return jsonOk({ ok: true, provider: provInstance.id, model });
  } catch (e) {
    return jsonError(e);
  }
}
