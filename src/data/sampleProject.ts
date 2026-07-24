import type { ProjectRecord } from '../infrastructure/projectRepository';

export function createSampleProject(now = new Date().toISOString()): ProjectRecord {
  return {
    id: 'sample-commercial-building',
    name: 'Commercial Building — Sample CPM',
    description: 'Reference schedule demonstrating FS, SS, and lag relationships.',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    activities: [
      { id: 'A100', name: 'Notice to proceed', duration: 0, type: 'milestone', wbs: '1.0' },
      { id: 'A110', name: 'Mobilization', duration: 3, type: 'task', wbs: '1.1' },
      { id: 'A120', name: 'Site facilities and controls', duration: 4, type: 'task', wbs: '1.1' },
      { id: 'A130', name: 'Bulk excavation', duration: 5, type: 'task', wbs: '2.1' },
      { id: 'A140', name: 'Foundations', duration: 6, type: 'task', wbs: '2.2' },
      { id: 'A150', name: 'Structural frame', duration: 10, type: 'task', wbs: '3.1' },
      { id: 'A160', name: 'MEP rough-in', duration: 8, type: 'task', wbs: '4.1' },
      { id: 'A170', name: 'Building envelope', duration: 7, type: 'task', wbs: '3.2' },
      { id: 'A180', name: 'Architectural finishes', duration: 9, type: 'task', wbs: '5.1' },
      { id: 'A190', name: 'Testing and commissioning', duration: 3, type: 'task', wbs: '6.1' },
      { id: 'A200', name: 'Project handover', duration: 0, type: 'milestone', wbs: '6.2' }
    ],
    relationships: [
      { id: 'R100', predecessorId: 'A100', successorId: 'A110', type: 'FS', lag: 0 },
      { id: 'R110', predecessorId: 'A110', successorId: 'A120', type: 'SS', lag: 1 },
      { id: 'R120', predecessorId: 'A110', successorId: 'A130', type: 'FS', lag: 0 },
      { id: 'R130', predecessorId: 'A130', successorId: 'A140', type: 'FS', lag: 0 },
      { id: 'R140', predecessorId: 'A140', successorId: 'A150', type: 'FS', lag: 0 },
      { id: 'R150', predecessorId: 'A150', successorId: 'A160', type: 'SS', lag: 3 },
      { id: 'R160', predecessorId: 'A150', successorId: 'A170', type: 'SS', lag: 4 },
      { id: 'R170', predecessorId: 'A160', successorId: 'A180', type: 'FS', lag: 0 },
      { id: 'R180', predecessorId: 'A170', successorId: 'A180', type: 'FS', lag: 0 },
      { id: 'R190', predecessorId: 'A180', successorId: 'A190', type: 'FS', lag: 0 },
      { id: 'R200', predecessorId: 'A190', successorId: 'A200', type: 'FS', lag: 0 }
    ]
  };
}
