'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/retro/Shell';
import { Window } from '@/components/retro/Window';
import { Button } from '@/components/retro/Button';
import { Empty, Pill, Spinner } from '@/components/retro/ui';
import { api } from '@/lib/client/api';
import type { ProjectSummary } from '@/lib/storage/storage';
import type { PublicSettings } from '@/lib/services/settings';
import { NewProjectDialog } from './NewProjectDialog';
import { SettingsDialog } from './SettingsDialog';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

export function Desktop() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api.listProjects(), api.getSettings()]);
      setProjects(p);
      setSettings(s);
    } catch (e) {
      setError(errMsg(e));
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(id);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const engineLabel = !settings
    ? ''
    : settings.provider === 'mock'
      ? 'Mock (no key)'
      : settings.provider === 'anthropic'
        ? 'Claude (Anthropic)'
        : 'OpenAI';

  return (
    <Shell
      actions={
        <>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            ⚙ Settings
          </Button>
          <Button variant="gold" size="sm" onClick={() => setShowNew(true)}>
            ✨ New Vision
          </Button>
        </>
      }
    >
      <Window title="Vision Studio" color="sky" icon="📜">
        <div className="row between wrap gap-3">
          <div style={{ maxWidth: 640 }}>
            <p style={{ marginTop: 0 }}>
              Describe an idea and get a polished, structured <b>Vision Document</b> — executive summary, business
              context, full-scope vision, MVP scope, risks, and open questions. The AI asks a few quick questions, then
              writes it; you edit, refine, and download.
            </p>
            <div className="row gap-1 wrap">
              <Pill color="mint">1 · Describe your idea</Pill>
              <Pill color="sky">2 · Answer a few questions</Pill>
              <Pill color="gold">3 · Get your Vision Document</Pill>
            </div>
          </div>
          <div className="col gap-1">
            <Button variant="gold" onClick={() => setShowNew(true)}>
              ✨ New Vision Document
            </Button>
            {settings ? (
              <span className="small muted">
                Engine: <b>{engineLabel}</b>
              </span>
            ) : null}
            {settings && !settings.ready && settings.provider !== 'mock' ? (
              <span className="small" style={{ color: 'var(--coral-d)' }}>
                ⚠ No key — add one in Settings
              </span>
            ) : null}
          </div>
        </div>
      </Window>

      <Window title={`Your Visions ${projects ? `(${projects.length})` : ''}`} color="mint" icon="🗂️">
        {projects === null ? (
          <div className="row center" style={{ padding: 30 }}>
            <Spinner />
          </div>
        ) : projects.length === 0 ? (
          <Empty icon="📁">
            No visions yet. Click <b>New Vision</b> to begin.
          </Empty>
        ) : (
          <div className="project-grid">
            {projects.map((p) => (
              <div key={p.id} className="card project-card" onClick={() => router.push(`/project/${p.id}`)}>
                <div className="row between">
                  <div className="pc-icon" style={{ background: p.complete ? 'var(--mint)' : 'var(--gold)' }}>
                    {p.complete ? '✓' : '📜'}
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => remove(p.id, p.name, e)} title="Delete">
                    🗑
                  </Button>
                </div>
                <div>
                  <b>{p.name}</b>
                </div>
                <div
                  className="small muted"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {p.idea}
                </div>
                <div className="row between">
                  <Pill color={p.complete ? 'mint' : 'gray'}>{p.complete ? 'Vision ready' : 'Draft'}</Pill>
                  <span className="tiny muted">{new Date(p.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Window>

      {error ? (
        <Window title="Error" color="coral" icon="⚠">
          <span style={{ color: 'var(--coral-d)' }}>{error}</span>
        </Window>
      ) : null}

      {showNew ? <NewProjectDialog onClose={() => setShowNew(false)} /> : null}
      {showSettings ? (
        <SettingsDialog
          onClose={() => {
            setShowSettings(false);
            load();
          }}
        />
      ) : null}
    </Shell>
  );
}
