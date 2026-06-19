'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Field, Pill, TextInput, TextArea } from '@/components/retro/ui';
import { Button } from '@/components/retro/Button';
import { api } from '@/lib/client/api';
import type { DocumentType } from '@/lib/engine/types';
import { DOCUMENT_TYPE_LIST } from '@/lib/aidlc/documentTypes';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Could not create project');

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [docType, setDocType] = useState<DocumentType>('dev-vision');
  const [isExisting, setIsExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const selected = DOCUMENT_TYPE_LIST.find((d) => d.id === docType) ?? DOCUMENT_TYPE_LIST[0];
  const isDev = selected.id === 'dev-vision';
  const ideaLabel = isDev ? 'Your idea' : selected.id === 'presentation-brief' ? 'Your presentation topic' : 'Your task';
  const ideaHint = isDev
    ? 'Describe what you want to build — a sentence or a paragraph.'
    : 'Describe what you need — a sentence or a paragraph. The AI will ask a few questions next.';

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const p = await api.createProject({
        name: name.trim(),
        idea: idea.trim(),
        isExisting: isDev ? isExisting : false,
        documentType: docType,
      });
      router.push(`/project/${p.id}`);
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Dialog title="New Document" color="gold" icon="✨" onClose={busy ? undefined : onClose} width={640}>
      <Field label="What do you want to create?" hint="Pick the kind of document — each asks different questions and produces a different structure.">
        <div className="col gap-1">
          {DOCUMENT_TYPE_LIST.map((d) => {
            const active = d.id === docType;
            return (
              <button
                key={d.id}
                type="button"
                className="card flat"
                onClick={() => setDocType(d.id)}
                aria-pressed={active}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderWidth: active ? 3 : undefined,
                  background: active ? 'var(--cream-2)' : 'var(--cream)',
                }}
              >
                <div className="row between gap-1" style={{ alignItems: 'center' }}>
                  <b>
                    {active ? '◉ ' : '○ '}
                    {d.label}
                  </b>
                  {d.recommendedFallback ? <Pill color="mint">Recommended if unsure</Pill> : null}
                </div>
                <div className="small muted" style={{ marginTop: 2 }}>
                  {d.shortDescription}
                </div>
                <div className="tiny muted" style={{ marginTop: 4 }}>
                  e.g. {d.examples.join(' · ')}
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Project name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isDev ? 'e.g. TideTracker' : 'e.g. Q3 Policy Update'}
          maxLength={120}
          autoFocus
        />
      </Field>

      <Field label={ideaLabel} hint={ideaHint}>
        <TextArea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={5}
          placeholder={
            isDev
              ? 'A mobile app that reminds local surfers of the best tide windows for their beach…'
              : selected.id === 'presentation-brief'
                ? 'A 10-slide executive update on Q3 results, ending with a recommendation to expand the pilot…'
                : 'Draft a friendly customer email announcing our new refund policy, for existing subscribers…'
          }
          maxLength={8000}
        />
      </Field>

      {isDev ? (
        <Field label="Is this…">
          <div className="row gap-1 wrap">
            <Button variant={isExisting ? 'ghost' : 'mint'} onClick={() => setIsExisting(false)} type="button">
              🌱 Starting fresh
            </Button>
            <Button variant={isExisting ? 'sky' : 'ghost'} onClick={() => setIsExisting(true)} type="button">
              🧩 Part of an existing project
            </Button>
          </div>
        </Field>
      ) : null}

      <p className="tiny muted" style={{ marginTop: 4 }}>
        🔒 Your text is sent to your configured AI provider to generate the document.
      </p>

      {err ? (
        <div className="card" style={{ borderColor: 'var(--coral-d)', background: '#fbe6e3' }}>
          <b>⚠ {err}</b>
        </div>
      ) : null}
      <div className="row end gap-1 mt-2">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="gold" onClick={create} disabled={busy || !name.trim() || idea.trim().length < 3}>
          {busy ? 'Creating…' : 'Create →'}
        </Button>
      </div>
    </Dialog>
  );
}
