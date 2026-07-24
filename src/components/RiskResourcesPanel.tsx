import { useMemo, useState } from 'react';
import { analyzeRiskResources } from '../domain/riskResources/riskResources';
import type { ProjectRecord } from '../domain/project/types';
import type { ScheduleResult } from '../domain/schedule/types';
import { normalizeEngineeringUnit } from '../domain/units/engineeringUnits';
import { NumericInput } from './NumericInput';

interface RiskResourcesPanelProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  onReplace: (project: ProjectRecord) => void;
}

export function RiskResourcesPanel({ project, result, onReplace }: RiskResourcesPanelProps) {
  const analysis = useMemo(() => result ? analyzeRiskResources(project, result) : undefined, [project, result]);
  const [selectedActivity, setSelectedActivity] = useState(project.activities.find((item) => item.type !== 'milestone')?.id ?? '');

  function setPert(activityId: string, field: 'optimistic' | 'mostLikely' | 'pessimistic', value: number): void {
    const existing = project.riskResources.pertEstimates.find((item) => item.activityId === activityId);
    const activityDuration = project.activities.find((item) => item.id === activityId)?.duration ?? 1;
    const created = existing ?? {
      activityId,
      optimistic: Math.max(0, activityDuration * 0.8),
      mostLikely: Math.max(0, activityDuration),
      pessimistic: Math.max(0, activityDuration * 1.4)
    };
    const pertEstimates = existing
      ? project.riskResources.pertEstimates.map((item) => item.activityId === activityId ? { ...item, [field]: value } : item)
      : [...project.riskResources.pertEstimates, { ...created, [field]: value }];
    onReplace({ ...project, riskResources: { ...project.riskResources, pertEstimates } });
  }

  function addRisk(): void {
    const title = window.prompt('Risk title');
    if (!title) return;
    onReplace({
      ...project,
      riskResources: {
        ...project.riskResources,
        risks: [...project.riskResources.risks, {
          id: `RISK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, title, probabilityPercent: 20,
          impactDays: 1, impactCost: 0, owner: '', status: 'open', linkedActivityIds: selectedActivity ? [selectedActivity] : [], response: ''
        }]
      }
    });
  }

  function addFieldRecord(): void {
    if (!selectedActivity) return;
    onReplace({
      ...project,
      riskResources: {
        ...project.riskResources,
        fieldRecords: [...project.riskResources.fieldRecords, {
          id: crypto.randomUUID(), activityId: selectedActivity, date: project.statusDate,
          completedQuantity: 0, unit: normalizeEngineeringUnit(project.riskResources.productivityPlans.find((item) => item.activityId === selectedActivity)?.unit ?? 'each'),
          laborHours: 0, equipmentHours: 0, notes: '', evidenceBytes: 0
        }]
      }
    });
  }

  return (
    <div className="controls-stack">
      <section className="surface">
        <div className="surface-heading"><div><p className="eyebrow">Phase 8 · uncertainty</p><h2>PERT and path probability</h2></div><label>Target days<NumericInput value={project.riskResources.targetCompletionDays} min={0} calculatorLabel="target completion days" onValueChange={(targetCompletionDays) => onReplace({ ...project, riskResources: { ...project.riskResources, targetCompletionDays } })} /></label></div>
        <div className="compact-table">
          {project.activities.filter((item) => item.type !== 'milestone').map((activity) => {
            const estimate = project.riskResources.pertEstimates.find((item) => item.activityId === activity.id);
            const calculated = analysis?.pert.activities.find((item) => item.activityId === activity.id);
            return <div className="compact-row pert-row" key={activity.id}><strong>{activity.id}</strong><span>{activity.name}</span>{(['optimistic', 'mostLikely', 'pessimistic'] as const).map((field) => <NumericInput key={field} min={0} step={0.25} calculatorLabel={`${field} duration for ${activity.id}`} aria-label={`${field} duration for ${activity.id}`} value={estimate?.[field]} placeholder={field === 'optimistic' ? 'O' : field === 'mostLikely' ? 'M' : 'P'} onValueChange={(value) => { if (value !== undefined) setPert(activity.id, field, value); }} />)}<span>μ {calculated?.expectedDuration ?? '—'}</span><span>σ² {calculated?.variance ?? '—'}</span></div>;
          })}
        </div>
        <div className="analysis-summary"><strong>Critical-path expected duration: {analysis?.pert.criticalPathExpectedDuration ?? '—'} days</strong><span>Standard deviation: {analysis?.pert.criticalPathStandardDeviation ?? '—'}</span><span>Target probability: {analysis?.pert.completionProbability === null || analysis?.pert.completionProbability === undefined ? 'Undefined' : `${(analysis.pert.completionProbability * 100).toFixed(2)}%`}</span></div>
        {analysis?.pert.warnings.map((warning) => <p className="notice" key={warning}>{warning}</p>)}
      </section>

      <div className="workspace-grid">
        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Risk register</p><h2>Expected exposure</h2></div><button className="button button-primary" type="button" onClick={addRisk}>Add risk</button></div>
          {analysis?.riskExposure.map((exposure) => {
            const risk = project.riskResources.risks.find((item) => item.id === exposure.riskId)!;
            return <article className="risk-card" key={risk.id}><div><strong>{risk.title}</strong><span>{risk.status} · {risk.probabilityPercent}%</span></div><p>{risk.response || 'No response recorded.'}</p><footer><span>{project.metadata.currency} {exposure.expectedCostExposure.toLocaleString('en-US')} expected</span><span>{exposure.expectedScheduleExposureDays} days expected</span></footer></article>;
          })}
          {project.riskResources.risks.length === 0 ? <p className="empty-state">No risks recorded.</p> : null}
        </section>

        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Field production</p><h2>Productivity forecast</h2></div><div className="toolbar-group"><select value={selectedActivity} onChange={(event) => setSelectedActivity(event.target.value)}>{project.activities.filter((item) => item.type !== 'milestone').map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}</select><button className="button button-small" type="button" onClick={addFieldRecord}>Add daily record</button></div></div>
          <div className="compact-table">{analysis?.productivity.map((item) => {
            const plan = project.riskResources.productivityPlans.find((candidate) => candidate.id === item.planId);
            const unit = normalizeEngineeringUnit(plan?.unit ?? 'unit');
            return <div className="compact-row wide" key={item.planId}><strong>{item.activityId}</strong><span>Planned {item.plannedRatePerDay} {unit}/day</span><span>Actual {item.actualRatePerDay ?? 'Undefined'} {unit}/day</span><span>Remaining {item.remainingQuantity} {unit}</span><span>Forecast {item.forecastDaysRemaining ?? 'Undefined'} days</span></div>;
          })}</div>
          {project.riskResources.productivityPlans.length === 0 ? <button className="button button-secondary" type="button" disabled={!selectedActivity} onClick={() => onReplace({ ...project, riskResources: { ...project.riskResources, productivityPlans: [...project.riskResources.productivityPlans, { id: crypto.randomUUID(), activityId: selectedActivity, description: 'Planned production', quantity: 100, unit: 'each', plannedRatePerDay: 10 }] } })}>Create productivity plan</button> : null}
        </section>
      </div>

      <section className="surface">
        <div className="surface-heading"><div><p className="eyebrow">Capacity control</p><h2>Resource histogram</h2></div><span className="engine-badge">{analysis?.histogram.filter((item) => item.overAllocated).length ?? 0} overallocated resource-days</span></div>
        <div className="resource-histogram" role="table" aria-label="Resource histogram">
          {analysis?.histogram.slice(0, 100).map((row) => <div className={`resource-row ${row.overAllocated ? 'overallocated' : ''}`} key={`${row.resourceId}-${row.date}`}><span>{row.date}</span><strong>{row.resourceId}</strong><span>{row.assigned} / {row.availability}</span><progress max={Math.max(row.assigned, row.availability, 1)} value={row.assigned} aria-label={`${row.resourceId} utilization on ${row.date}`} /><span>{row.utilizationPercent === null ? 'Undefined' : `${row.utilizationPercent}%`}</span></div>)}
        </div>
        {analysis?.validationIssues.map((issue) => <p className="notice notice-error" key={issue}>{issue}</p>)}
      </section>
    </div>
  );
}
