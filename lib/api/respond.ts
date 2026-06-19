import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import type { Project } from '../engine/types';
import { toUserError } from '../security/errors';
import { logger } from '../security/logger';

export function jsonOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function jsonError(e: unknown): NextResponse {
  if (e instanceof ZodError) {
    const msg = e.issues[0]?.message || 'Invalid input';
    return NextResponse.json({ ok: false, error: msg, code: 'validation' }, { status: 400 });
  }
  const u = toUserError(e);
  if (u.status >= 500) logger.error('Request failed', { code: u.code });
  return NextResponse.json({ ok: false, error: u.message, code: u.code }, { status: u.status });
}

export function clientProject(p: Project) {
  return p;
}
