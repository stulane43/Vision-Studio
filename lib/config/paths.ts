// Centralized data-directory resolution. Locally this defaults to the project
// root; in a container set AIDLC_DATA_DIR=/data and mount a single volume there.

import path from 'node:path';

/** Root for all persisted data (auth, settings, projects). */
export const DATA_DIR = path.resolve(process.env.AIDLC_DATA_DIR || process.cwd());

/** Auth + per-user settings live under <data>/.aidlc. */
export const AIDLC_DIR = path.join(DATA_DIR, '.aidlc');

/** Project files live under <data>/projects (overridable via AIDLC_PROJECTS_DIR). */
export const PROJECTS_DIR = path.resolve(process.env.AIDLC_PROJECTS_DIR || path.join(DATA_DIR, 'projects'));
