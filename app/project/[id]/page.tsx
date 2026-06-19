'use client';

import { ProjectWorkspace } from '@/components/views/ProjectWorkspace';

export default function ProjectPage({ params }: { params: { id: string } }) {
  return <ProjectWorkspace id={params.id} />;
}
