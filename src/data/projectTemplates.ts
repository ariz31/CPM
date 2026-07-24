import { createSampleProject } from './sampleProject';
import { createActivity, createBlankProjectRecord } from '../domain/project/project';
import type { ProjectRecord, WbsNode } from '../domain/project/types';
import type { Relationship } from '../domain/schedule/types';

export interface ProjectTemplateDefinition {
  id: 'commercial-building' | 'linear-road' | 'interior-fitout';
  name: string;
  description: string;
}

export const PROJECT_TEMPLATES: ProjectTemplateDefinition[] = [
  { id: 'commercial-building', name: 'Commercial building', description: 'Reference vertical-construction schedule with BOQ, cost, PERT, risk, and resources.' },
  { id: 'linear-road', name: 'Linear road works', description: 'Mobilization, earthworks, drainage, pavement, markings, and handover sequence.' },
  { id: 'interior-fitout', name: 'Interior fit-out', description: 'Design release, procurement, partitions, MEP, finishes, testing, and turnover.' }
];

export function instantiateProjectTemplate(templateId: ProjectTemplateDefinition['id'], now = new Date().toISOString()): ProjectRecord {
  if (templateId === 'commercial-building') return { ...createSampleProject(now), name: 'Commercial Building Template' };
  const project = createBlankProjectRecord(templateId === 'linear-road' ? 'Linear Road Works Template' : 'Interior Fit-out Template', now);
  const root = project.wbs[0];
  const calendarId = project.settings.defaultCalendarId;
  const work: WbsNode = { id: `WBS-${templateId.toUpperCase()}`, code: '1.1', name: templateId === 'linear-road' ? 'Road construction' : 'Fit-out construction', parentId: root.id, sortOrder: 1 };
  const definitions = templateId === 'linear-road'
    ? [
        ['A100', 'Mobilization and traffic management', 5],
        ['A110', 'Clearing and earthworks', 15],
        ['A120', 'Drainage and cross structures', 20],
        ['A130', 'Subgrade and aggregate base', 18],
        ['A140', 'Asphalt pavement', 10],
        ['A150', 'Road furniture and markings', 6]
      ] as const
    : [
        ['A100', 'Design release and approvals', 7],
        ['A110', 'Long-lead procurement', 20],
        ['A120', 'Partitions and ceilings', 12],
        ['A130', 'MEP rough-in and fixtures', 15],
        ['A140', 'Floor, wall, and joinery finishes', 14],
        ['A150', 'Testing, punch list, and turnover', 7]
      ] as const;
  const activities = [
    createActivity({ id: 'START', name: 'Project start', type: 'milestone', duration: 0, wbsId: root.id, calendarId, now }),
    ...definitions.map(([id, name, duration]) => createActivity({ id, name, duration, wbsId: work.id, calendarId, now })),
    createActivity({ id: 'FINISH', name: 'Project finish', type: 'milestone', duration: 0, wbsId: root.id, calendarId, now })
  ];
  const ids = activities.map((activity) => activity.id);
  const relationships: Relationship[] = ids.slice(0, -1).map((predecessorId, index) => ({
    id: `R-${templateId}-${index + 1}`,
    predecessorId,
    successorId: ids[index + 1],
    type: 'FS',
    lag: 0
  }));
  return {
    ...project,
    metadata: { ...project.metadata, description: PROJECT_TEMPLATES.find((template) => template.id === templateId)!.description },
    wbs: [root, work],
    activities,
    relationships
  };
}
