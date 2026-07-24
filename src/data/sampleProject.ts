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
  const startDate = now.slice(0, 10);
  return {
    ...project,
    metadata: {
      ...project.metadata,
      description: 'Reference project for validating scheduling, cost control, PERT, productivity, resources, enterprise reporting, project-file, and recovery workflows.',
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
    },
    controls: {
      ...project.controls,
      period: 'weekly',
      activityLoadings: [
        { activityId: 'A110', phasing: 'front-loaded' },
        { activityId: 'A120', phasing: 'bell' },
        { activityId: 'A200', phasing: 'back-loaded' }
      ],
      actualCosts: [{ id: 'AC-DEMO', activityId: 'A100', date: startDate, amount: 25000, description: 'Mobilization and site setup', source: 'manual' }],
      cashFlow: { billingLagDays: 14, advancePercent: 10, advanceRecoveryPercent: 10, retentionPercent: 5, retentionReleaseLagDays: 30, taxPercent: 2 }
    },
    riskResources: {
      pertEstimates: [
        { activityId: 'A110', optimistic: 3, mostLikely: 5, pessimistic: 8 },
        { activityId: 'A120', optimistic: 6, mostLikely: 8, pessimistic: 12 },
        { activityId: 'A200', optimistic: 12, mostLikely: 15, pessimistic: 22 }
      ],
      targetCompletionDays: 48,
      risks: [
        { id: 'RISK-GROUND', title: 'Groundwater during excavation', probabilityPercent: 35, impactDays: 5, impactCost: 180000, owner: 'Site engineer', status: 'mitigating', linkedActivityIds: ['A110'], response: 'Prepare standby pumps and discharge route.' },
        { id: 'RISK-STEEL', title: 'Structural steel delivery delay', probabilityPercent: 25, impactDays: 8, impactCost: 250000, owner: 'Procurement lead', status: 'open', linkedActivityIds: ['A200', 'A210'], response: 'Approve alternate supplier and early shop drawings.' }
      ],
      productivityPlans: [{ id: 'PROD-EXC', activityId: 'A110', description: 'Bulk excavation', quantity: 180, unit: 'm3', plannedRatePerDay: 36 }],
      fieldRecords: [{ id: 'FIELD-001', activityId: 'A110', date: startDate, completedQuantity: 30, unit: 'm3', laborHours: 32, equipmentHours: 8, notes: 'Initial excavation shift', evidenceBytes: 0 }],
      resources: [
        { id: 'CREW-CIVIL', name: 'Civil crew', kind: 'labor', unit: 'crew', availabilityPerDay: 2, costRate: 12000 },
        { id: 'BACKHOE-01', name: 'Backhoe', kind: 'equipment', unit: 'unit', availabilityPerDay: 1, costRate: 2800 }
      ],
      assignments: [
        { id: 'ASSIGN-1', resourceId: 'CREW-CIVIL', activityId: 'A110', unitsPerDay: 1 },
        { id: 'ASSIGN-2', resourceId: 'BACKHOE-01', activityId: 'A110', unitsPerDay: 1 }
      ]
    }
  };
}
