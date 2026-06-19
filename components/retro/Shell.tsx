'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { api } from '@/lib/client/api';

function Taskbar() {
  const [time, setTime] = useState('--:--');
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="taskbar">
      <span className="pill mint">● online</span>
      <span className="small muted">Vision Studio</span>
      <span className="clock">{time}</span>
    </div>
  );
}

function UserMenu() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    api
      .me()
      .then((r) => setName(r.user?.username ?? null))
      .catch(() => setName(null));
  }, []);
  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    router.replace('/login');
    router.refresh();
  };
  if (!name) return null;
  return (
    <span className="row gap-1" style={{ alignItems: 'center' }}>
      <span className="pill gray">👤 {name}</span>
      <Button variant="ghost" size="sm" onClick={logout} title="Log out">
        Log out
      </Button>
    </span>
  );
}

export function Shell({ actions, children }: { actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="desktop">
      <div className="topbar">
        <Link href="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="logo">📜</span>
          <span>
            Vision <span style={{ color: 'var(--coral-d)' }}>Studio</span>
          </span>
          <span className="blink">_</span>
        </Link>
        <div className="row gap-1 wrap" style={{ alignItems: 'center' }}>
          {actions}
          <UserMenu />
        </div>
      </div>
      <div className="desktop-main">{children}</div>
      <Taskbar />
    </div>
  );
}
