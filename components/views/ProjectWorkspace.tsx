'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Shell } from '@/components/retro/Shell';
import { Window } from '@/components/retro/Window';
import { Button } from '@/components/retro/Button';
import { Pill, Spinner, TextInput, Thinking, TextArea } from '@/components/retro/ui';
import { Markdown } from '@/components/retro/Markdown';
import { QuestionCard } from '@/components/retro/QuestionCard';
import { SettingsDialog } from './SettingsDialog';
import { api, type StageActionInput } from '@/lib/client/api';
import type { Answer, Project, StageState } from '@/lib/engine/types';
import type { PublicSettings } from '@/lib/services/settings';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
const VISION = 'vision' as const;

export function ProjectWorkspace({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('Thinking');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [comments, setComments] = useState<{ id: string; quote: string; note: string }[]>([]);
  const [instruction, setInstruction] = useState('');
  const [commentAnchor, setCommentAnchor] = useState<{ x: number; y: number; quote: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [liveText, setLiveText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const autoRan = useRef<Set<string>>(new Set());
  const docRef = useRef<HTMLDivElement>(null);

  const loadSettings = useCallback(() => {
    api.getSettings().then(setSettings).catch(() => undefined);
  }, []);
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let on = true;
    api
      .getProject(id)
      .then((p) => on && setProject(p))
      .catch((e) => on && setError(errMsg(e)));
    return () => {
      on = false;
    };
  }, [id]);

  const cur: StageState | null = project ? project.run.stages.find((s) => s.id === VISION) ?? null : null;
  const complete = project ? project.run.currentStageId === null : false;
  const artifact = project ? project.artifacts.find((a) => a.stageId === VISION) ?? null : null;

  const act = useCallback(
    async (action: StageActionInput, label = 'Thinking') => {
      setBusy(true);
      setBusyLabel(label);
      setError('');
      try {
        const p = await api.stageAction(id, action);
        setProject(p);
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setBusy(false);
      }
    },
    [id],
  );

  const actStream = useCallback(
    async (action: StageActionInput, label = 'Thinking'): Promise<boolean> => {
      setBusy(true);
      setBusyLabel(label);
      setError('');
      setLiveText('');
      try {
        const p = await api.stageActionStream(id, action, (t) => setLiveText((prev) => prev + t));
        setProject(p);
        return true;
      } catch (e) {
        setError(errMsg(e));
        return false;
      } finally {
        setBusy(false);
        setLiveText('');
      }
    },
    [id],
  );

  // Auto-run the stage once when it's active (asks questions, or writes the doc).
  useEffect(() => {
    if (!project || busy) return;
    const c = project.run.currentStageId
      ? project.run.stages.find((s) => s.id === project.run.currentStageId)
      : null;
    if (c && c.status === 'active' && !autoRan.current.has(c.id)) {
      autoRan.current.add(c.id);
      actStream({ action: 'run' }, 'Reading your idea');
    }
  }, [project, busy, actStream]);

  useEffect(() => {
    if (cur?.status === 'awaiting-answers') {
      // Preserve answers already given (so earlier rounds aren't wiped when more questions arrive).
      setAnswers(
        cur.questions.map((q) => cur.answers.find((a) => a.questionId === q.id) ?? { questionId: q.id, selectedKeys: [] }),
      );
    }
    setEditing(false);
    setComments([]);
    setInstruction('');
    setCommentAnchor(null);
  }, [cur?.status, cur?.questions.length]);

  useEffect(() => {
    if (!busy) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [busy]);

  // If the stage is generating server-side (e.g. we navigated away and came back), poll
  // until it finishes — do NOT restart it.
  useEffect(() => {
    if (busy || cur?.status !== 'generating') return;
    let on = true;
    const iv = setInterval(() => {
      api
        .getProject(id)
        .then((p) => {
          if (on) setProject(p);
        })
        .catch(() => undefined);
    }, 2500);
    return () => {
      on = false;
      clearInterval(iv);
    };
  }, [busy, cur?.status, id]);

  const otherUnfilled = (a: Answer): boolean => {
    const q = cur?.questions.find((x) => x.id === a.questionId);
    const otherSelected = q?.options.some((o) => o.isOther && a.selectedKeys.includes(o.key));
    return !!otherSelected && !(a.otherText && a.otherText.trim());
  };
  const canSubmit = answers.length > 0 && answers.every((a) => a.selectedKeys.length > 0 && !otherUnfilled(a));

  const download = () => {
    if (!artifact || !project) return;
    const blob = new Blob([artifact.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(project.name || 'vision').replace(/[^a-z0-9-_]+/gi, '-')}-vision.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ---- select-to-comment ----
  const onDocMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setCommentAnchor(null);
      return;
    }
    const text = sel.toString().trim();
    const node = sel.anchorNode;
    if (!text || !node || !docRef.current || !docRef.current.contains(node)) {
      setCommentAnchor(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setCommentAnchor({ x: rect.left + rect.width / 2, y: Math.max(44, rect.top), quote: text.slice(0, 280) });
  };

  const addComment = (quote: string) => {
    setComments((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, quote, note: '' }]);
    setCommentAnchor(null);
    window.getSelection()?.removeAllRanges();
  };

  const canRevise = comments.length > 0 || instruction.trim().length > 0;
  const doRevise = async () => {
    const ok = await actStream(
      {
        action: 'revise',
        stageId: VISION,
        comments: comments.map((c) => ({ quote: c.quote, note: c.note.trim() })),
        instruction: instruction.trim(),
      },
      'Revising your document',
    );
    if (ok) {
      setComments([]);
      setInstruction('');
    }
  };

  const engineReady = settings?.ready ?? false;
  const engineShort = !settings
    ? '…'
    : settings.provider === 'mock'
      ? '🧪 Mock'
      : settings.provider === 'anthropic'
        ? '✦ Claude'
        : '⚡ OpenAI';
  const settingsModal = showSettings ? (
    <SettingsDialog
      onClose={() => {
        setShowSettings(false);
        loadSettings();
      }}
    />
  ) : null;

  const headerActions = (
    <>
      {settings ? (
        <button
          className="pill"
          style={{ cursor: 'pointer', background: engineReady ? 'var(--sky)' : '#d7d1c4' }}
          onClick={() => setShowSettings(true)}
          title="AI engine — click to change"
        >
          {engineShort}
        </button>
      ) : null}
      <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/')}>
        ← Projects
      </Button>
    </>
  );

  if (!project) {
    return (
      <Shell actions={headerActions}>
        {error ? (
          <Window title="Error" color="coral" icon="⚠">
            <span style={{ color: 'var(--coral-d)' }}>{error}</span>
          </Window>
        ) : (
          <div className="row center" style={{ padding: 60 }}>
            <Spinner />
          </div>
        )}
        {settingsModal}
      </Shell>
    );
  }

  const showDoc = !busy && (cur?.status === 'awaiting-review' || complete) && !!artifact;
  const showQuestions = !busy && cur?.status === 'awaiting-answers';

  return (
    <Shell actions={headerActions}>
      <div style={{ maxWidth: 880, margin: '0 auto', width: '100%' }}>
        <Window title="Vision Document" color={complete ? 'mint' : 'sky'} icon="📜">
          <div className="row between wrap gap-1 mb-2">
            <div className="row gap-1">
              <Pill color="sky">{project.name}</Pill>
              {complete ? <Pill color="mint">✓ finalized</Pill> : <Pill color="gray">draft</Pill>}
            </div>
            {artifact ? (
              <Button variant="ghost" size="sm" onClick={download}>
                📥 Download .md
              </Button>
            ) : null}
          </div>

          {error ? (
            <div className="card flat mb-2" style={{ borderColor: 'var(--coral-d)' }}>
              <span style={{ color: 'var(--coral-d)' }}>⚠ {error}</span>{' '}
              {cur ? (
                <Button
                  variant="coral"
                  size="sm"
                  onClick={() => {
                    autoRan.current.delete(VISION);
                    actStream({ action: 'run' }, 'Retrying');
                  }}
                >
                  ↻ Retry
                </Button>
              ) : null}
            </div>
          ) : null}

          {busy ? (
            <div className="card flat mb-2">
              <div className="row gap-2" style={{ marginBottom: liveText ? 10 : 0 }}>
                <Thinking label={liveText ? 'Writing your Vision Document' : busyLabel} />
                <span className="tiny muted">{elapsed}s</span>
              </div>
              {liveText ? (
                <div style={{ maxHeight: '52vh', overflow: 'auto' }}>
                  <Markdown>{liveText}</Markdown>
                </div>
              ) : null}
            </div>
          ) : null}

          {!busy && cur?.status === 'generating' ? (
            <div className="card flat mb-2">
              <div className="row gap-2" style={{ marginBottom: 8 }}>
                <Thinking label="Your Vision Document is being written" />
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                This keeps going even if you leave this page — it&apos;ll appear here when it&apos;s ready.
              </p>
              <div className="row end mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    autoRan.current.delete(VISION);
                    actStream({ action: 'run' }, 'Resuming');
                  }}
                >
                  ↻ Restart
                </Button>
              </div>
            </div>
          ) : null}

          {showQuestions && cur ? (
            <div>
              <p className="small muted" style={{ marginTop: 0 }}>
                A few quick questions to sharpen your Vision Document:
              </p>
              {cur.questions.map((q, i) => {
                const a = answers.find((x) => x.questionId === q.id) ?? { questionId: q.id, selectedKeys: [] };
                return (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    index={i}
                    answer={a}
                    onChange={(na) => setAnswers((prev) => prev.map((x) => (x.questionId === q.id ? na : x)))}
                  />
                );
              })}
              <div className="row between wrap gap-1">
                <Button
                  variant="ghost"
                  disabled={!canSubmit || busy}
                  onClick={() => act({ action: 'more-questions', stageId: VISION, answers }, 'Thinking of more questions')}
                  title="Add another, deeper round of questions before writing"
                >
                  🔁 Ask me more questions
                </Button>
                <Button
                  variant="mint"
                  disabled={!canSubmit}
                  onClick={() => actStream({ action: 'answers', stageId: VISION, answers }, 'Writing your Vision Document')}
                >
                  Generate Vision Document →
                </Button>
              </div>
              <p className="tiny muted mt-1" style={{ marginBottom: 0 }}>
                Not confident yet? <b>Ask me more</b> keeps adding deeper questions; hit <b>Generate</b> whenever you&apos;re ready.
              </p>
            </div>
          ) : null}

          {showDoc && artifact ? (
            editing ? (
              <div>
                <TextArea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={22}
                  style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem' }}
                />
                <div className="row end gap-1 mt-1">
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="sky"
                    onClick={() =>
                      act({ action: 'edit', stageId: VISION, markdown: draft }, 'Saving').then(() => setEditing(false))
                    }
                  >
                    💾 Save edits
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div
                  ref={docRef}
                  onMouseUp={onDocMouseUp}
                  onScroll={() => setCommentAnchor(null)}
                  className="window-body scroll"
                  style={{ padding: 0, maxHeight: '60vh' }}
                >
                  <Markdown>{artifact.markdown}</Markdown>
                </div>

                {!complete ? (
                  <div className="card mt-2">
                    <div className="row between wrap gap-1">
                      <b>✨ Revise with AI</b>
                      <span className="tiny muted">Tip: select text in the document to comment on a specific part.</span>
                    </div>

                    {comments.length > 0 ? (
                      <div className="col gap-1 mt-1">
                        {comments.map((c) => (
                          <div key={c.id} className="card flat" style={{ padding: 10 }}>
                            <div className="row between gap-1">
                              <span
                                className="tiny mono"
                                style={{ background: 'var(--cream-2)', padding: '2px 6px', borderRadius: 5, border: '1.5px solid var(--ink)' }}
                              >
                                “{c.quote.length > 90 ? c.quote.slice(0, 90) + '…' : c.quote}”
                              </span>
                              <button
                                className="btn ghost sm"
                                onClick={() => setComments((p) => p.filter((x) => x.id !== c.id))}
                                title="Remove comment"
                              >
                                ✕
                              </button>
                            </div>
                            <TextInput
                              value={c.note}
                              placeholder="Your note (e.g. too vague, wrong number, make this punchy)…"
                              onChange={(e) =>
                                setComments((p) => p.map((x) => (x.id === c.id ? { ...x, note: e.target.value } : x)))
                              }
                              style={{ marginTop: 6 }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <TextArea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      rows={2}
                      placeholder="Anything else to change overall? (optional) e.g. shrink the MVP, add a competitor section…"
                      style={{ marginTop: 8 }}
                    />
                    <div className="row end mt-1">
                      <Button variant="lav" disabled={!canRevise} onClick={doRevise}>
                        ✨ Revise with AI
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="row between wrap gap-1 mt-2">
                  <div className="row gap-1 wrap">
                    <Button variant="ghost" size="sm" onClick={() => { setDraft(artifact.markdown); setEditing(true); }}>
                      ✏ Edit
                    </Button>
                    {artifact.editedByUser ? <Pill color="gold">edited · v{artifact.version}</Pill> : null}
                  </div>
                  {!complete ? (
                    <Button variant="mint" onClick={() => act({ action: 'approve', stageId: VISION }, 'Finalizing')}>
                      ✓ Finalize
                    </Button>
                  ) : (
                    <Button variant="gold" onClick={download}>
                      📥 Download .md
                    </Button>
                  )}
                </div>
              </div>
            )
          ) : null}
        </Window>
      </div>
      {commentAnchor ? (
        <button
          className="btn gold sm"
          style={{
            position: 'fixed',
            left: commentAnchor.x,
            top: commentAnchor.y - 40,
            transform: 'translateX(-50%)',
            zIndex: 70,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            addComment(commentAnchor.quote);
          }}
        >
          💬 Comment
        </button>
      ) : null}
      {settingsModal}
    </Shell>
  );
}
