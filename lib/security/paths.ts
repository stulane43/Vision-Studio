// SECURITY-05 / SECURITY-11: path-traversal protection for all file access.

import path from 'node:path';
import { AppError } from './errors';

/** Resolve `segments` under `root`, rejecting any path that escapes `root`. */
export function safeJoin(root: string, ...segments: string[]): string {
  const normalizedRoot = path.resolve(root);
  const target = path.resolve(normalizedRoot, ...segments);
  if (target !== normalizedRoot && !target.startsWith(normalizedRoot + path.sep)) {
    throw new AppError('Invalid path', 400, 'invalid_path');
  }
  return target;
}

/** Validate an opaque id used as a directory name. */
export function safeId(id: string): string {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    throw new AppError('Invalid project id', 400, 'invalid_id');
  }
  return id;
}

/** Validate a relative path (e.g. for generated code files) — no absolute, no `..`. */
export function safeRelPath(rel: string): string {
  const normalized = rel.replace(/\\/g, '/');
  if (
    normalized.startsWith('/') ||
    /^[A-Za-z]:/.test(normalized) ||
    normalized.split('/').some((seg) => seg === '..')
  ) {
    throw new AppError('Invalid relative path', 400, 'invalid_path');
  }
  return normalized;
}
