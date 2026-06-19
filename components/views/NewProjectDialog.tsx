'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Field, TextInput, TextArea } from '@/components/retro/ui';
import { Button } from '@/components/retro/Button';
import { api } from '@/lib/client/api';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Could not create project');

export function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const create = async () => {
    setBusy(true);
    setErr('');
    try {
      const p = await api.createProject({ name: name.trim(), idea: idea.trim(), isExisting });
      router.push(`/project/${p.id}`);
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Dialog title="New Vision Document" color="gold" icon="✨" onClose={busy ? undefined : onClose} width={580}>
      <Field label="Project name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. TideTracker"
          maxLength={120}
          autoFocus
        />
      </Field>
      <Field label="Your idea" hint="Describe what you want to build — a sentence or a paragraph.">
        <TextArea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={5}
          placeholder="A mobile app that reminds local surfers of the best tide windows for their beach…"
          maxLength={8000}
        />
      </Field>
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
      {err ? (
        <div className="card" style={{ borderColor: 'var(--coral-d)', background: '#fbe6e3' }}>
          <b>⚠ {err}</b>
        </div>
      ) : null}
      <div className="row end gap-1 mt-2">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="gold"
          onClick={create}
          disabled={busy || !name.trim() || idea.trim().length < 3}
        >
          {busy ? 'Creating…' : 'Create →'}
        </Button>
      </div>
    </Dialog>
  );
}
