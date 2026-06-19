// Server-side sessions persisted to a local gitignored file, so logins survive restarts.
// SECURITY-12: server-side expiration, invalidated on logout (revocable).

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { AIDLC_DIR } from '../config/paths';

const DIR = AIDLC_DIR;
const FILE = path.join(DIR, 'sessions.json');
const TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

async function readAll(): Promise<Session[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as Session[];
  } catch {
    return [];
  }
}

async function writeAll(sessions: Session[]): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = (await readAll()).filter((s) => s.expiresAt > Date.now());
  sessions.push({ token, userId, expiresAt: Date.now() + TTL_MS });
  await writeAll(sessions);
  return token;
}

export async function getSession(token: string): Promise<{ userId: string } | null> {
  const sessions = await readAll();
  const s = sessions.find((x) => x.token === token && x.expiresAt > Date.now());
  return s ? { userId: s.userId } : null;
}

export async function deleteSession(token: string): Promise<void> {
  const sessions = (await readAll()).filter((s) => s.token !== token);
  await writeAll(sessions);
}
