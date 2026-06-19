// User accounts — stored in a local gitignored file, passwords hashed with scrypt.
// SECURITY-12: adaptive hashing, per-user salt, timing-safe verification, no secrets in logs.

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { AppError } from '../security/errors';
import { AIDLC_DIR } from '../config/paths';

const DIR = AIDLC_DIR;
const FILE = path.join(DIR, 'users.json');

export interface User {
  id: string;
  username: string;
  salt: string;
  hash: string;
  createdAt: string;
}

async function readAll(): Promise<User[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as User[];
  } catch {
    return [];
  }
}

async function writeAll(users: User[]): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(users, null, 2), 'utf8');
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export async function findByUsername(username: string): Promise<User | null> {
  const users = await readAll();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readAll();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(username: string, password: string): Promise<User> {
  if (await findByUsername(username)) {
    throw new AppError('That username is already taken', 409, 'username_taken');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const user: User = {
    id: crypto.randomUUID(),
    username,
    salt,
    hash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  const users = await readAll();
  users.push(user);
  await writeAll(users);
  return user;
}

export function verifyPassword(user: User, password: string): boolean {
  const candidate = Buffer.from(hashPassword(password, user.salt), 'hex');
  const expected = Buffer.from(user.hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
