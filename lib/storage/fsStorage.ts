// Filesystem implementation of Storage, scoped to a single user. Each user's
// projects live under projects/<userId>/<projectId>/.

import fs from 'node:fs/promises';
import path from 'node:path';
import type { Project } from '../engine/types';
import { serializeProject, deserializeProject } from '../aidlc/serialization';
import { safeId, safeJoin, safeRelPath } from '../security/paths';
import { logger } from '../security/logger';
import { PROJECTS_DIR } from '../config/paths';
import type { ProjectSummary, Storage } from './storage';

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export class FsStorage implements Storage {
  constructor(private readonly userId: string) {}

  private userRoot(): string {
    return safeJoin(PROJECTS_DIR, safeId(this.userId));
  }

  projectRoot(id: string): string {
    return safeJoin(this.userRoot(), safeId(id));
  }

  private projectJson(id: string): string {
    return safeJoin(this.projectRoot(id), 'project.json');
  }

  async listProjects(): Promise<ProjectSummary[]> {
    const root = this.userRoot();
    if (!(await exists(root))) return [];
    const entries = await fs.readdir(root, { withFileTypes: true });
    const summaries: ProjectSummary[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      try {
        const raw = await fs.readFile(safeJoin(root, e.name, 'project.json'), 'utf8');
        const p = deserializeProject(raw);
        summaries.push({
          id: p.id,
          name: p.name,
          idea: p.idea,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          currentStageId: p.run.currentStageId,
          complete: p.run.currentStageId === null,
        });
      } catch {
        logger.warn('Skipping unreadable project folder', { folder: e.name });
      }
    }
    return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getProject(id: string): Promise<Project | null> {
    const file = this.projectJson(id);
    if (!(await exists(file))) return null;
    const raw = await fs.readFile(file, 'utf8');
    return deserializeProject(raw);
  }

  async saveProject(p: Project): Promise<void> {
    const root = this.projectRoot(p.id);
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(this.projectJson(p.id), serializeProject(p), 'utf8');
    for (const a of p.artifacts) {
      const dest = safeJoin(root, safeRelPath(a.path));
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, a.markdown, 'utf8');
    }
  }

  async deleteProject(id: string): Promise<void> {
    await fs.rm(this.projectRoot(id), { recursive: true, force: true });
  }

  async appendAudit(id: string, entry: string): Promise<void> {
    const dest = safeJoin(this.projectRoot(id), 'audit.md');
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.appendFile(dest, entry, 'utf8');
  }
}
