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
    id: `R-${index + 1}`, predecessorId, successorId: chain[index + 1], type: 'FS', lag: 0
  }));
  return {
    ...project,
    metadata: {
      ...project.metadata,
      description: 'Reference project for validating scheduling, baselines, progress, Gantt, network, BOQ, estimating, project-file, and recovery workflows.',
      location: 'Baguio City, Philippines', owner: 'Sample Owner', contractor: 'Sample Contractor'
    },
    wbs: [root, substructure, superstructure],
    activities,
    relationships,
    boq: {
      sections: [
        { id: 'BOQ-ROOT', code: '1', name: 'Bill of Quantities', sortOrder: 0 },
        { id: 'BOQ-SUB', code: '1.1', name: 'Substructure', parentId: 'BOQ-ROOT', sortOrder: 1 },
        { id: 'BOQ-SUP', code: '1.2', name: 'Superstructure', parentId: 'BOQ-ROOT', sortOrder: 2 }
      ],
      items: [
        {
          id: 'BOQ-001', sectionId: 'BOQ-SUB', code: '1.1.1', description: 'Structural excavation', unit: 'm3', quantity: 180,
          resources: [
            { id: 'RES-EXC-EQ', category: 'equipment', description: 'Backhoe', quantityPerUnit: 0.08, unit: 'hr', unitCost: 2800, wastePercent: 0 },
            { id: 'RES-EXC-LAB', category: 'labor', description: 'Excavation crew', quantityPerUnit: 0.4, unit: 'hr', unitCost: 180, wastePercent: 0 }
          ],
          allocations: [{ activityId: 'A110', percent: 100 }]
        },
        {
          id: 'BOQ-002', sectionId: 'BOQ-SUB', code: '1.1.2', description: 'Reinforced concrete footings', unit: 'm3', quantity: 65,
          resources: [
            { id: 'RES-CON-MAT', category: 'material', description: 'Ready-mix concrete', quantityPerUnit: 1, unit: 'm3', unitCost: 5200, wastePercent: 3 },
            { id: 'RES-CON-LAB', category: 'labor', description: 'Concrete crew', quantityPerUnit: 1.2, unit: 'hr', unitCost: 220, wastePercent: 0 }
          ],
          allocations: [{ activityId: 'A120', percent: 100 }]
        },
        {
          id: 'BOQ-003', sectionId: 'BOQ-SUP', code: '1.2.1', description: 'Structural frame', unit: 'lot', quantity: 1, manualUnitRate: 3200000,
          resources: [], allocations: [{ activityId: 'A200', percent: 100 }]
        }
      ],
      markups: [
        { id: 'MU-OH', name: 'Overhead', ratePercent: 8, order: 1, basis: 'direct-cost' },
        { id: 'MU-PROFIT', name: 'Profit', ratePercent: 10, order: 2, basis: 'running-subtotal' }
      ],
      revisions: []
    }
  };
}
