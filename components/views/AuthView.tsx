'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Window } from '@/components/retro/Window';
import { Button } from '@/components/retro/Button';
import { Field, TextInput } from '@/components/retro/ui';
import { api } from '@/lib/client/api';

export function AuthView() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') await api.signup(username.trim(), password);
      else await api.login(username.trim(), password);
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="logo">📜</span>
          <span>
            Vision <span style={{ color: 'var(--coral-d)' }}>Studio</span>
          </span>
          <span className="blink">_</span>
        </div>
        <Window
          title={mode === 'login' ? 'Sign in' : 'Create your account'}
          color="lav"
          icon={mode === 'login' ? '🔑' : '✨'}
          controls={false}
        >
          <form onSubmit={submit} className="col">
            <Field label="Username">
              <TextInput
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="e.g. stu"
                autoFocus
                maxLength={40}
              />
            </Field>
            <Field label="Password" hint={mode === 'signup' ? 'At least 8 characters' : undefined}>
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                maxLength={200}
              />
            </Field>
            {error ? <p className="auth-error">{error}</p> : null}
            <Button type="submit" variant="mint" block disabled={busy || !username.trim() || !password}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </Button>
          </form>
          <p className="tiny muted mt-1" style={{ textAlign: 'center', marginBottom: 0 }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
            <button
              type="button"
              className="linklike"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </Window>
        <p className="tiny muted" style={{ textAlign: 'center', marginTop: 10 }}>
          Your visions are private to your account.
        </p>
      </div>
    </div>
  );
}
