import { FsStorage } from './fsStorage';
import type { Storage } from './storage';

const cache = new Map<string, Storage>();

/** Storage scoped to a single user (filesystem implementation). */
export function getStorage(userId: string): Storage {
  let s = cache.get(userId);
  if (!s) {
    s = new FsStorage(userId);
    cache.set(userId, s);
  }
  return s;
}

export type { Storage, ProjectSummary } from './storage';
