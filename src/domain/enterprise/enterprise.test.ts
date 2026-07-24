import { describe, expect, it } from 'vitest';
import { calculateCostControl } from '../controls/costControl';
import { createActivity, createBlankProjectRecord } from '../project/project';
import type { JournalEntry } from '../project/types';
import { analyzeRiskResources } from '../riskResources/riskResources';
import { calculateSchedule } from '../schedule/cpm';
import {
  AUDIT_COMMAND_REGISTRY,
  buildDashboardValues,
  buildReportRows,
  buildSupportBundle,
  createManualOverride,
  createReportSnapshot,
  explainFormula,
  summarizeAudit
} from './enterprise';

function fixture() {
  const project = createBlankProjectRecord('Enterprise', '2026-01-05T00:00:00.000Z');
  const root = project.wbs[0];
  const calendarId = project.settings.defaultCalendarId;
  project.metadata.owner = 'Private Owner';
  project.metadata.location = 'Secret Site';
  project.activities = [
    createActivity({ id: 'START', name: 'Start', type: 'milestone', duration: 0, wbsId: root.id, calendarId, now: project.createdAt }),
    createActivity({ id: 'A', name: 'Work', duration: 2, wbsId: root.id, calendarId, now: project.createdAt }),
    createActivity({ id: 'FINISH', name: 'Finish', type: 'milestone', duration: 0, wbsId: root.id, calendarId, now: project.createdAt })
  ];
  project.relationships = [
    { id: 'R1', predecessorId: 'START', successorId: 'A', type: 'FS', lag: 0 },
    { id: 'R2', predecessorId: 'A', successorId: 'FINISH', type: 'FS', lag: 0 }
  ];
  project.controls.activityLoadings = [{ activityId: 'A', budgetCost: 1000, phasing: 'uniform' }];
  project.enterprise.diagnostics = [{ id: 'D1', code: 'TEST', severity: 'error', message: 'Contact admin@example.com with bearer abcdefghijklmnopqrstuvwxyz123456', occurredAt: project.createdAt }];
  const schedule = calculateSchedule({
    projectStartDate: project.metadata.startDate,
    defaultCalendarId: calendarId,
    criticalFloatThresholdDays: 0,
    nearCriticalFloatThresholdDays: 2,
    calendars: project.calendars,
    activities: project.activities,
    relationships: project.relationships
  });
  const controls = calculateCostControl(project, schedule);
  const risk = analyzeRiskResources(project, schedule);
  return { project, schedule, controls, risk };
}

describe('Phase 9 enterprise reporting and audit', () => {
  it('creates revision-bound immutable report snapshots with stable input hashes', () => {
    const { project, schedule, controls, risk } = fixture();
    const rows = buildReportRows('executive', project, schedule, controls, risk);
    const first = createReportSnapshot(project, 'executive', rows, schedule.engineVersion, 'Executive', '2026-01-05T12:00:00.000Z');
    const second = createReportSnapshot(project, 'executive', structuredClone(rows), schedule.engineVersion, 'Executive', '2026-01-05T12:00:00.000Z');
    expect(first.inputHash).toBe(second.inputHash);
    expect(first.projectRevision).toBe(project.revision);
    rows[0].value = 999999;
    expect(first.rows[0].value).not.toBe(999999);
  });

  it('builds configurable dashboard values with explicit completeness', () => {
    const { project, schedule, controls, risk } = fixture();
    const values = buildDashboardValues(project, schedule, controls, risk);
    expect(values.find((item) => item.metric === 'bac')?.value).toBe(1000);
    expect(values.find((item) => item.metric === 'cpi')?.value).toBeNull();
    expect(values.find((item) => item.metric === 'cpi')?.completeness).toBe('unavailable');
  });

  it('maps every registered authoritative command and surfaces unknown classes', () => {
    const entries: JournalEntry[] = Object.keys(AUDIT_COMMAND_REGISTRY).map((commandType, index) => ({
      projectId: 'P', commandId: `C${index}`, commandType, createdAt: '2026-01-01T00:00:00.000Z', revisionBefore: index, revisionAfter: index + 1, summary: commandType
    }));
    entries.push({ projectId: 'P', commandId: 'UNKNOWN', commandType: 'UNREGISTERED_COMMAND', createdAt: '2026-01-01T00:00:00.000Z', revisionBefore: 0, revisionAfter: 1, summary: 'Unknown' });
    const audit = summarizeAudit(entries, [createManualOverride('settings.threshold', 1, 2, 'Approved change', 'Planner')]);
    expect(audit.mappedCount).toBe(Object.keys(AUDIT_COMMAND_REGISTRY).length);
    expect(audit.unmappedCommandTypes).toEqual(['UNREGISTERED_COMMAND']);
    expect(audit.overrideCount).toBe(1);
  });

  it('redacts private metadata, email addresses, and token-like values in support bundles', () => {
    const { project } = fixture();
    const bundle = buildSupportBundle(project, [], '0.9.0');
    const text = JSON.stringify(bundle);
    expect(text).not.toContain('Private Owner');
    expect(text).not.toContain('Secret Site');
    expect(text).not.toContain('admin@example.com');
    expect(text).not.toContain('abcdefghijklmnopqrstuvwxyz123456');
    expect(bundle.redactions.length).toBeGreaterThan(0);
  });

  it('documents formulas and generates large immutable reports within a CI safety budget', () => {
    expect(explainFormula('CPI')).toMatchObject({ formula: 'EV ÷ AC', undefinedWhen: 'AC is zero.' });
    const { project, schedule } = fixture();
    const rows = Array.from({ length: 20_000 }, (_, index) => ({ row: index, value: index * 2, label: `Row ${index}` }));
    const started = performance.now();
    const snapshot = createReportSnapshot(project, 'audit', rows, schedule.engineVersion);
    expect(snapshot.rows).toHaveLength(20_000);
    expect(performance.now() - started).toBeLessThan(3000);
  });
});
