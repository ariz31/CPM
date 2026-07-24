import { useMemo } from 'react';
import { calculateCostControl } from '../domain/controls/costControl';
import { analyzeProgress } from '../domain/progress/progress';
import type { ProjectRecord } from '../domain/project/types';
import { analyzeRiskResources } from '../domain/riskResources/riskResources';
import type { ScheduleResult } from '../domain/schedule/types';
import { MetricCard } from './MetricCard';

interface ControlOverviewProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  onReplace: (project: ProjectRecord) => void;
  onNavigate: (tab: 'progress' | 'boq' | 'controls' | 'risk') => void;
}

interface ControlException {
  id: string;
  severity: 'critical' | 'warning' | 'information';
  category: string;
  title: string;
  detail: string;
  destination: 'progress' | 'boq' | 'controls' | 'risk';
}

export function ControlOverview({ project, result, onReplace, onNavigate }: ControlOverviewProps) {
  const analysis = useMemo(() => {
    if (!result) return undefined;
    const progress = analyzeProgress(project, result);
    const cost = calculateCostControl(project, result);
    const risk = analyzeRiskResources(project, result);
    const exceptions: ControlException[] = [];
    for (const warning of result.warnings) exceptions.push({ id: `schedule-${warning.code}-${warning.activityId ?? warning.relationshipId ?? warning.message}`, severity: warning.severity === 'error' ? 'critical' : warning.severity === 'warning' ? 'warning' : 'information', category: 'Schedule', title: warning.code.replaceAll('_', ' '), detail: warning.message, destination: 'progress' });
    for (const item of progress.activities.filter((activity) => activity.isOutOfSequence)) exceptions.push({ id: `progress-${item.activityId}`, severity: 'warning', category: 'Progress', title: 'Out-of-sequence activity', detail: `${item.activityId} has progress before one or more predecessors completed.`, destination: 'progress' });
    for (const activityId of cost.completeness.activitiesWithoutBudget) exceptions.push({ id: `budget-${activityId}`, severity: 'warning', category: 'Cost', title: 'Missing activity budget', detail: `${activityId} is dated but has no cost loading.`, destination: 'controls' });
    for (const exposure of risk.riskExposure.slice(0, 10)) exceptions.push({ id: `risk-${exposure.riskId}`, severity: exposure.score >= 5 ? 'critical' : 'warning', category: 'Risk', title: exposure.title, detail: `${exposure.expectedScheduleExposureDays.toLocaleString('en-US')} expected days and ${formatCurrency(exposure.expectedCostExposure, project.metadata.currency)} expected cost exposure.`, destination: 'risk' });
    for (const row of risk.histogram.filter((item) => item.overAllocated).slice(0, 12)) exceptions.push({ id: `resource-${row.resourceId}-${row.date}`, severity: 'warning', category: 'Resource', title: 'Resource over-allocation', detail: `${row.resourceId}: ${row.assigned} assigned against ${row.availability} available on ${row.date}.`, destination: 'risk' });
    return { progress, cost, risk, exceptions: exceptions.sort((left, right) => severityRank(left.severity) - severityRank(right.severity) || left.category.localeCompare(right.category)) };
  }, [project, result]);

  if (!result || !analysis) return <section className="surface"><div className="empty-state">A valid schedule calculation is required for the control center.</div></section>;

  const openRisks = project.riskResources.risks.filter((risk) => risk.status !== 'closed').length;
  const overAllocated = analysis.risk.histogram.filter((row) => row.overAllocated).length;

  return (
    <div className="control-overview controls-stack">
      <section className="surface control-command-area" aria-labelledby="control-overview-title">
        <div className="surface-heading phase-toolbar">
          <div><p className="eyebrow">Phase G · integrated project control</p><h2 id="control-overview-title">Control center</h2><p>One operational queue for status, progress, cost, risk, resource, and data-quality exceptions.</p></div>
          <label>Status date<input type="date" value={project.statusDate} onChange={(event) => onReplace({ ...project, statusDate: event.target.value })} /></label>
        </div>
        <div className="metric-grid control-metric-strip">
          <MetricCard label="Overall completion" value={`${analysis.progress.overallPercentComplete}%`} detail={`${analysis.progress.inProgressCount} in progress · ${analysis.progress.outOfSequenceCount} out of sequence`} tone={analysis.progress.outOfSequenceCount > 0 ? 'warning' : 'default'} />
          <MetricCard label="Cost performance" value={analysis.cost.metrics.cpi === null ? 'Undefined' : `CPI ${analysis.cost.metrics.cpi}`} detail={analysis.cost.metrics.spi === null ? 'SPI undefined' : `SPI ${analysis.cost.metrics.spi}`} tone={analysis.cost.metrics.cpi !== null && analysis.cost.metrics.cpi < 0.9 ? 'critical' : 'default'} />
          <MetricCard label="Open risks" value={openRisks} detail={`${formatCurrency(analysis.risk.riskExposure.reduce((sum, item) => sum + item.expectedCostExposure, 0), project.metadata.currency)} expected exposure`} tone={openRisks > 0 ? 'warning' : 'default'} />
          <MetricCard label="Resource conflicts" value={overAllocated} detail={`${analysis.risk.histogram.length} resource-day records`} tone={overAllocated > 0 ? 'warning' : 'default'} />
        </div>
      </section>

      <section className="surface control-module-launcher" aria-labelledby="control-modules-title">
        <div className="surface-heading"><div><p className="eyebrow">Control workspaces</p><h2 id="control-modules-title">Open a specialist module</h2></div></div>
        <div className="control-module-grid">
          <button type="button" onClick={() => onNavigate('progress')}><strong>Progress & baselines</strong><span>Record updates, review variance, out-of-sequence work, and snapshots.</span><small>{analysis.progress.inProgressCount} active updates</small></button>
          <button type="button" onClick={() => onNavigate('boq')}><strong>BOQ & estimate</strong><span>Review quantities, rates, markups, revisions, and allocations.</span><small>{project.boq.items.length} BOQ items</small></button>
          <button type="button" onClick={() => onNavigate('controls')}><strong>Cost & EVM</strong><span>Time-phase budgets, review actual cost, curves, cash flow, and forecasts.</span><small>{analysis.cost.completeness.allocationPercent ?? 0}% allocated</small></button>
          <button type="button" onClick={() => onNavigate('risk')}><strong>Risk & resources</strong><span>Maintain exposure, PERT, productivity, field records, and histograms.</span><small>{openRisks} open risks · {overAllocated} conflicts</small></button>
        </div>
      </section>

      <section className="surface exception-queue" aria-labelledby="exception-queue-title">
        <div className="surface-heading"><div><p className="eyebrow">Prioritized exception queue</p><h2 id="exception-queue-title">Items requiring attention</h2></div><span className="engine-badge">{analysis.exceptions.length} findings</span></div>
        {analysis.exceptions.length === 0 ? <div className="empty-state compact"><strong>No active control exceptions</strong><span>The current schedule, progress, cost, risk, and resource checks did not produce findings.</span></div> : <div className="exception-list">{analysis.exceptions.slice(0, 40).map((item) => <article className={`exception-item ${item.severity}`} key={item.id}><span className="exception-severity">{item.severity}</span><div><small>{item.category}</small><strong>{item.title}</strong><p>{item.detail}</p></div><button className="button button-small" type="button" onClick={() => onNavigate(item.destination)}>Review</button></article>)}</div>}
      </section>
    </div>
  );
}

function severityRank(severity: ControlException['severity']): number { return severity === 'critical' ? 0 : severity === 'warning' ? 1 : 2; }
function formatCurrency(value: number, currency: string): string {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`; }
}
