// Storage abstraction — filesystem now, swappable for cloud later.

import type { Project, StageId } from '../engine/types';

export interface ProjectSummary {
  id: string;
  name: string;
  idea: string;
  createdAt: string;
  updatedAt: string;
  currentStageId: StageId | null;
  complete: boolean;
}

export interface Storage {
  listProjects(): Promise<ProjectSummary[]>;
  getProject(id: string): Promise<Project | null>;
  saveProject(p: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  appendAudit(id: string, entry: string): Promise<void>;
}
