'use client';

import { useEffect, useState } from 'react';
import { Dialog, Field, TextInput } from '@/components/retro/ui';
import { Button } from '@/components/retro/Button';
import { api } from '@/lib/client/api';
import type { PublicSettings, ProviderId } from '@/lib/services/settings';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

const DEFAULT_MODEL: Record<ProviderId, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o',
  mock: 'mock',
};

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  mock: 'Mock',
};

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<PublicSettings | null>(null);
  const [provider, setProvider] = useState<ProviderId>('mock');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api
      .getSettings()
      .then((x) => {
        setS(x);
        setProvider(x.provider);
        setModel(x.model);
      })
      .catch((e) => setErr(errMsg(e)));
  }, []);

  const pickProvider = (p: ProviderId) => {
    setProvider(p);
    setApiKey('');
    setMsg('');
    setErr('');
    // Default the model field to the new provider's default.
    setModel(DEFAULT_MODEL[p]);
  };

  const saveAndTest = async () => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      const next = await api.saveSettings({
        provider,
        model,
        apiKey: apiKey || undefined,
      });
      setS(next);
      setApiKey('');
      try {
        const r = await api.testSettings();
        setMsg(`Saved ✓ — connected to ${PROVIDER_LABEL[r.provider] ?? r.provider} (${r.model}).`);
      } catch (te) {
        setErr(`Saved, but the connection test failed — ${errMsg(te)}`);
      }
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const hasKey = provider === 'anthropic' ? s?.hasAnthropicKey : provider === 'openai' ? s?.hasOpenaiKey : false;

  return (
    <Dialog title="Settings" color="lav" icon="⚙" onClose={onClose} width={580}>
      <Field label="AI provider">
        <div className="row gap-1 wrap">
          <Button variant={provider === 'mock' ? 'mint' : 'ghost'} onClick={() => pickProvider('mock')} type="button">
            🧪 Mock (no key)
          </Button>
          <Button variant={provider === 'anthropic' ? 'sky' : 'ghost'} onClick={() => pickProvider('anthropic')} type="button">
            ✦ Claude (Anthropic)
          </Button>
          <Button variant={provider === 'openai' ? 'gold' : 'ghost'} onClick={() => pickProvider('openai')} type="button">
            ⚡ OpenAI
          </Button>
        </div>
      </Field>

      {provider === 'anthropic' ? (
        <>
          <Field label="Model" hint="e.g. claude-sonnet-4-6 (fast) or claude-opus-4-8 (deepest)">
            <TextInput value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field
            label="Anthropic API key"
            hint="Saved to a local, gitignored file on this machine — only ever sent to Anthropic. Leave blank to keep the existing key."
          >
            <TextInput
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? '•••••••• (a key is already saved)' : 'sk-ant-…'}
            />
          </Field>
        </>
      ) : provider === 'openai' ? (
        <>
          <Field label="Model" hint="e.g. gpt-4o, gpt-4.1, or gpt-4o-mini">
            <TextInput value={model} onChange={(e) => setModel(e.target.value)} />
          </Field>
          <Field
            label="OpenAI API key"
            hint="Saved to a local, gitignored file on this machine — only ever sent to OpenAI. Leave blank to keep the existing key."
          >
            <TextInput
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? '•••••••• (a key is already saved)' : 'sk-…'}
            />
          </Field>
        </>
      ) : (
        <p className="small muted">
          The Mock provider returns canned questions/artifacts (no real AI). Switch to <b>Claude</b> or <b>OpenAI</b> and add a key
          for genuine, idea-specific generation.
        </p>
      )}

      {s ? (
        <div className="small muted">
          Current: <b>{PROVIDER_LABEL[s.provider] ?? s.provider}</b> · {s.ready ? 'ready ✓' : 'needs a key'}
        </div>
      ) : null}
      {msg ? (
        <div className="small" style={{ color: 'var(--mint-d)' }}>
          ✓ {msg}
        </div>
      ) : null}
      {err ? (
        <div className="small" style={{ color: 'var(--coral-d)' }}>
          ⚠ {err}
        </div>
      ) : null}

      <div className="row end gap-1 mt-2">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button variant="lav" onClick={saveAndTest} disabled={busy}>
          {busy ? 'Saving & testing…' : '💾 Save & test connection'}
        </Button>
      </div>
    </Dialog>
  );
}
