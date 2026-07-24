import { createActivity, createBlankProjectRecord } from '../domain/project/project';
import type { ProjectRecord, WbsNode } from '../domain/project/types';
import type { Relationship } from '../domain/schedule/types';

export function createSampleProject(now = new Date().toISOString()): ProjectRecord {
  const project = createBlankProjectRecord('Commercial Building Reference', now);
  const root = project.wbs[0];
  const substructure: WbsNode = { id: crypto.randomUUID(), code: '1.1', name: 'Substructure', parentId: root.id, sortOrder: 1 };
  const superstructure: WbsNode = { id: crypto.randomUUID(), code: '1.2', name: 'Superstructure', parentId: root.id, sortOrder: 2 };
  const calendarId = project.settings.defaultCalendarId;
  const activities = [
    createActivity({ id: 'START', name: 'Project start', duration: 0, type: 'milestone', wbsId: root.id, calendarId, now }),
    createActivity({ id: 'A100', name: 'Site preparation', duration: 3, wbsId: substructure.id, calendarId, now }),
    createActivity({ id: 'A110', name: 'Excavation', duration: 5, wbsId: substructure.id, calendarId, now }),
    createActivity({ id: 'A120', name: 'Footings and foundations', duration: 8, wbsId: substructure.id, calendarId, now }),
    createActivity({ id: 'A130', name: 'Ground-floor slab', duration: 5, wbsId: substructure.id, calendarId, now }),
    createActivity({ id: 'A200', name: 'Structural frame', duration: 15, wbsId: superstructure.id, calendarId, now }),
    createActivity({ id: 'A210', name: 'Roof structure', duration: 6, wbsId: superstructure.id, calendarId, now }),
    createActivity({ id: 'FINISH', name: 'Project finish', duration: 0, type: 'milestone', wbsId: root.id, calendarId, now })
  ];
  const chain = ['START', 'A100', 'A110', 'A120', 'A130', 'A200', 'A210', 'FINISH'];
  const relationships: Relationship[] = chain.slice(0, -1).map((predecessorId, index) => ({
    id: `R-${index + 1}`,
    predecessorId,
    successorId: chain[index + 1],
    type: 'FS',
    lag: 0
  }));

  return {
    ...project,
    metadata: {
      ...project.metadata,
      description: 'Reference schedule for validating CPM, calendar, project-file, and recovery workflows.',
      location: 'Baguio City, Philippines',
      owner: 'Sample Owner',
      contractor: 'Sample Contractor'
    },
    wbs: [root, substructure, superstructure],
    activities,
    relationships
  };
}
