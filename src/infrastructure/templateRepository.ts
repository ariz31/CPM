import { instantiateProjectTemplate, type ProjectTemplateDefinition } from '../data/projectTemplates';
import type { ProjectRecord } from '../domain/project/types';
import { database } from './projectRepository';

export async function createProjectFromTemplate(templateId: ProjectTemplateDefinition['id']): Promise<ProjectRecord> {
  const project = instantiateProjectTemplate(templateId);
  await database.transaction('rw', database.projects, database.journal, async () => {
    await database.projects.add(project);
    await database.journal.add({
      projectId: project.id,
      commandId: crypto.randomUUID(),
      commandType: 'PROJECT_CREATE_TEMPLATE',
      createdAt: project.createdAt,
      revisionBefore: 0,
      revisionAfter: project.revision,
      summary: `Created project from ${templateId} template`
    });
  });
  return project;
}
