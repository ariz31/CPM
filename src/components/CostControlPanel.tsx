import { useMemo, useState } from 'react';
import { calculateCostControl } from '../domain/controls/costControl';
import type { CurvePeriod, PhasingMethod } from '../domain/controls/types';
import type { ProjectRecord } from '../domain/project/types';
import type { ScheduleResult } from '../domain/schedule/types';
import { activityReferenceFromId, activityReferenceLabel } from '../utils/activityReferences';
import { NumericInput } from './NumericInput';

interface CostControlPanelProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  onReplace: (project: ProjectRecord) => void;
}

export function CostControlPanel({ project, result, onReplace }: CostControlPanelProps) {
  const analysis = useMemo(() => result ? calculateCostControl(project, result) : undefined, [project, result]);
  const costActivities = useMemo(() => project.activities.filter((item) => item.type !== 'milestone'), [project.activities]);
  const [actualActivityId, setActualActivityId] = useState(costActivities[0]?.id ?? '');
  const [actualAmount, setActualAmount] = useState<number>();
  const effectiveActualActivityId = costActivities.some((activity) => activity.id === actualActivityId) ? actualActivityId : costActivities[0]?.id ?? '';
  const metrics = analysis?.metrics;

  function setPeriod(period: CurvePeriod): void {
    onReplace({ ...project, controls: { ...project.controls, period } });
  }

  function setPhasing(activityId: string, phasing: PhasingMethod): void {
    const existing = project.controls.activityLoadings.find((item) => item.activityId === activityId);
    const activityLoadings = existing
      ? project.controls.activityLoadings.map((item) => item.activityId === activityId ? { ...item, phasing } : item)
      : [...project.controls.activityLoadings, { activityId, phasing }];
    onReplace({ ...project, controls: { ...project.controls, activityLoadings } });
  }

  function addActualCost(): void {
    if (!effectiveActualActivityId || actualAmount === undefined || !Number.isFinite(actualAmount) || actualAmount <= 0) return;
    onReplace({
      ...project,
      controls: {
        ...project.controls,
        actualCosts: [...project.controls.actualCosts, {
          id: crypto.randomUUID(), activityId: effectiveActualActivityId, date: project.statusDate, amount: actualAmount,
          description: `Actual cost through ${project.statusDate}`, source: 'manual'
        }]
      }
    });
    setActualAmount(undefined);
  }

  return (
    <div className="controls-stack">
      <section className="surface">
        <div className="surface-heading">
          <div><p className="eyebrow">Phase 7 · authoritative cost control</p><h2>S-curves and earned value</h2></div>
          <label>Period<select value={project.controls.period} onChange={(event) => setPeriod(event.target.value as CurvePeriod)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="fiscal">Fiscal</option></select></label>
        </div>
        {!analysis ? <p className="notice">A valid schedule calculation is required.</p> : <>
          <div className="control-metric-grid">
            <ControlMetric label="PV" value={metrics?.pv} currency={project.metadata.currency} />
            <ControlMetric label="EV" value={metrics?.ev} currency={project.metadata.currency} />
            <ControlMetric label="AC" value={metrics?.ac} currency={project.metadata.currency} />
            <ControlMetric label="BAC" value={metrics?.bac} currency={project.metadata.currency} />
            <ControlMetric label="SPI" value={metrics?.spi} />
            <ControlMetric label="CPI" value={metrics?.cpi} />
            <ControlMetric label="EAC" value={metrics?.eac} currency={project.metadata.currency} />
            <ControlMetric label="VAC" value={metrics?.vac} currency={project.metadata.currency} />
          </div>
          <CurveChart curves={analysis.curves} />
          <div className={`completeness-banner ${analysis.completeness.allocationPercent === 100 ? 'complete' : 'partial'}`}>
            <strong>{analysis.completeness.allocationPercent === null ? 'No estimate loaded' : `${analysis.completeness.allocationPercent}% of estimate allocated`}</strong>
            <span>{analysis.completeness.activitiesWithoutBudget.length} activities without budget · {analysis.completeness.activitiesWithoutDates.length} without calculated dates</span>
          </div>
        </>}
      </section>

      <div className="workspace-grid">
        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Budget distribution</p><h2>Activity phasing</h2></div></div>
          <div className="compact-table" role="table" aria-label="Activity cost phasing">
            {costActivities.map((activity) => {
              const loading = project.controls.activityLoadings.find((item) => item.activityId === activity.id);
              return <div className="compact-row" role="row" key={activity.id}><span className="activity-reference-id">{activity.id}</span><span>{activity.name}</span><select aria-label={`Phasing for ${activity.name} (${activity.id})`} value={loading?.phasing ?? 'uniform'} onChange={(event) => setPhasing(activity.id, event.target.value as PhasingMethod)}><option value="uniform">Uniform</option><option value="front-loaded">Front loaded</option><option value="back-loaded">Back loaded</option><option value="bell">Bell</option><option value="custom">Custom</option><option value="milestone">Milestone</option></select></div>;
            })}
          </div>
        </section>
        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Cost ledger</p><h2>Actual costs</h2></div></div>
          <div className="inline-form actual-cost-form">
            <label>Activity<select value={effectiveActualActivityId} onChange={(event) => setActualActivityId(event.target.value)} aria-label="Actual cost activity">{costActivities.map((item) => <option key={item.id} value={item.id}>{activityReferenceLabel(item)}</option>)}</select></label>
            <label>Amount ({project.metadata.currency})<NumericInput value={actualAmount} min={0} calculatorLabel="actual cost amount" aria-label="Actual cost amount" placeholder="Enter amount or formula" onValueChange={setActualAmount} /></label>
            <button className="button button-primary" type="button" disabled={!effectiveActualActivityId || actualAmount === undefined || actualAmount <= 0} onClick={addActualCost}>Add at {project.statusDate}</button>
          </div>
          <div className="compact-table">{project.controls.actualCosts.slice().reverse().map((item) => <div className="compact-row wide" key={item.id}><span>{item.date}</span><span>{item.activityId ? activityReferenceFromId(project.activities, item.activityId) : 'Project-wide cost'}</span><span>{item.description}</span><strong>{project.metadata.currency} {item.amount.toLocaleString('en-US')}</strong></div>)}</div>
          {project.controls.actualCosts.length === 0 ? <p className="empty-state compact">No actual costs recorded.</p> : null}
        </section>
      </div>

      <section className="surface">
        <div className="surface-heading"><div><p className="eyebrow">Contract cash flow</p><h2>Billing, retention, recovery, and tax</h2></div></div>
        <div className="cashflow-grid">
          {(['billingLagDays', 'advancePercent', 'advanceRecoveryPercent', 'retentionPercent', 'retentionReleaseLagDays', 'taxPercent'] as const).map((key) => <label key={key}>{labelFor(key)}<NumericInput min={0} value={project.controls.cashFlow[key]} calculatorLabel={labelFor(key)} onValueChange={(value) => { if (value !== undefined) onReplace({ ...project, controls: { ...project.controls, cashFlow: { ...project.controls.cashFlow, [key]: value } } }); }} /></label>)}
        </div>
        <div className="compact-table">{analysis?.cashFlow.slice(-12).map((item, index) => <div className="compact-row wide" key={`${item.period}-${index}`}><span>{item.period}</span><span>Gross {item.grossBilling.toFixed(2)}</span><span>Retention {item.retention.toFixed(2)}</span><span>Net {item.netCashFlow.toFixed(2)}</span><strong>Cumulative {item.cumulativeNetCashFlow.toFixed(2)}</strong></div>)}</div>
      </section>
    </div>
  );
}

function ControlMetric({ label, value, currency }: { label: string; value: number | null | undefined; currency?: string }) {
  return <div className="control-metric"><span>{label}</span><strong>{value === null || value === undefined ? 'Undefined' : `${currency ? `${currency} ` : ''}${value.toLocaleString('en-US', { maximumFractionDigits: 4 })}`}</strong></div>;
}

function CurveChart({ curves }: { curves: ReturnType<typeof calculateCostControl>['curves'] }) {
  if (curves.length === 0) return <p className="notice">No curve data is available.</p>;
  const maximum = Math.max(1, ...curves.flatMap((item) => [item.plannedEarly, item.actual, item.earned, item.forecast]));
  const points = (key: 'plannedEarly' | 'actual' | 'earned' | 'forecast') => curves.map((item, index) => `${curves.length === 1 ? 0 : index / (curves.length - 1) * 100},${100 - item[key] / maximum * 100}`).join(' ');
  return <div className="curve-wrap"><svg className="curve-chart" viewBox="0 0 100 100" role="img" aria-label="Cumulative planned, actual, earned, and forecast curves"><polyline className="curve planned" points={points('plannedEarly')} /><polyline className="curve actual" points={points('actual')} /><polyline className="curve earned" points={points('earned')} /><polyline className="curve forecast" points={points('forecast')} /></svg><div className="curve-legend"><span>Planned</span><span>Actual</span><span>Earned</span><span>Forecast</span></div></div>;
}

function labelFor(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
}
