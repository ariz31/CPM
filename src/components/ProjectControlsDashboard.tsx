import { useMemo } from 'react';
import { calculateCostControl } from '../domain/controls/costControl';
import {
  buildProjectControlsSnapshot,
  type ProjectControlsMetricStatus
} from '../domain/controls/projectControlsSnapshot';
import type { ProjectRecord } from '../domain/project/types';
import { analyzeRiskResources } from '../domain/riskResources/riskResources';
import type { ScheduleResult } from '../domain/schedule/types';
import { ScurveChart } from './ScurveChart';
import type { WorkspaceTab } from './WorkspaceNavigation';

interface ProjectControlsDashboardProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  onNavigate: (tab: WorkspaceTab) => void;
}

interface DashboardMetricCardProps {
  label: string;
  value: string;
  detail: string;
  status: ProjectControlsMetricStatus;
  actionLabel: string;
  onOpen: () => void;
}

export function ProjectControlsDashboard({ project, result, onNavigate }: ProjectControlsDashboardProps) {
  const analysis = useMemo(() => {
    if (!result) return undefined;
    const controls = calculateCostControl(project, result);
    const riskResources = analyzeRiskResources(project, result);
    return {
      controls,
      riskResources,
      snapshot: buildProjectControlsSnapshot(project, result, controls, riskResources),
      milestones: result.activities
        .filter((activity) => activity.type === 'milestone')
        .sort((left, right) => left.earlyStartDate.localeCompare(right.earlyStartDate))
    };
  }, [project, result]);

  if (!result || !analysis) {
    return <section className="surface"><div className="empty-state">A valid schedule calculation is required for the project controls dashboard.</div></section>;
  }

  const { controls, riskResources, snapshot, milestones } = analysis;
  const performanceStatus = combineStatus(snapshot.earnedValue.cpiStatus, snapshot.earnedValue.spiStatus);
  const findingsStatus: ProjectControlsMetricStatus = snapshot.findings.critical > 0
    ? 'critical'
    : snapshot.findings.totalOpen > 0 ? 'warning' : 'positive';
  const allocationDetail = snapshot.cost.allocationPercent === null
    ? 'Estimate allocation is not available'
    : `${formatPercent(snapshot.cost.allocationPercent)} of estimate allocated`;

  return (
    <div className="project-controls-dashboard controls-stack">
      <section className="surface project-controls-header" aria-labelledby="project-controls-title">
        <div className="surface-heading project-controls-heading">
          <div>
            <p className="eyebrow">Integrated schedule, cost, performance, and assurance</p>
            <h2 id="project-controls-title">Project controls dashboard</h2>
            <p>One authoritative status-date view for forecast schedule, budget, earned value, risks, and control findings.</p>
          </div>
          <div className="toolbar-group wrap">
            <button className="button button-secondary" type="button" onClick={() => onNavigate('reports')}>Open reports</button>
            <button className="button button-primary" type="button" onClick={() => onNavigate('control-overview')}>Open control center</button>
          </div>
        </div>
        <div className="project-controls-context" role="status" aria-label="Project controls data context">
          <span>Status {formatDate(snapshot.statusDate, false)}</span>
          <span>Revision {snapshot.projectRevision}</span>
          <span>Engine {snapshot.engineVersion}</span>
          <span>Calculated {formatDate(snapshot.generatedAt, true)}</span>
        </div>
      </section>

      <section className="project-controls-summary" aria-label="Project controls summary">
        <DashboardMetricCard
          label="Project duration"
          value={`${snapshot.schedule.forecastDurationDays.toLocaleString('en-US')} days`}
          detail={`Forecast finish ${formatDate(snapshot.schedule.forecastFinish, true)}`}
          status="positive"
          actionLabel="Open schedule"
          onOpen={() => onNavigate('schedule')}
        />
        <DashboardMetricCard
          label="Budget at completion"
          value={formatCurrency(snapshot.cost.bac, snapshot.currency)}
          detail={allocationDetail}
          status={snapshot.cost.bac === null ? 'unavailable' : snapshot.cost.allocationPercent === 100 ? 'positive' : 'warning'}
          actionLabel="Open cost and EVM"
          onOpen={() => onNavigate('controls')}
        />
        <DashboardMetricCard
          label="Performance"
          value={`CPI ${formatRatio(snapshot.earnedValue.cpi)} · SPI ${formatRatio(snapshot.earnedValue.spi)}`}
          detail={performanceDetail(snapshot.earnedValue.cpiStatus, snapshot.earnedValue.spiStatus)}
          status={performanceStatus}
          actionLabel="Review earned value"
          onOpen={() => onNavigate('controls')}
        />
        <DashboardMetricCard
          label="Control findings"
          value={`${snapshot.findings.totalOpen.toLocaleString('en-US')} open`}
          detail={`${snapshot.findings.critical} critical · ${snapshot.findings.warning} watch`}
          status={findingsStatus}
          actionLabel="Review findings"
          onOpen={() => onNavigate('control-overview')}
        />
      </section>

      <div className="project-controls-primary-grid">
        <section className="surface project-controls-schedule" aria-labelledby="project-controls-schedule-title">
          <div className="surface-heading">
            <div><p className="eyebrow">Schedule performance</p><h2 id="project-controls-schedule-title">Forecast and critical path</h2></div>
            <div className="toolbar-group wrap"><button className="button button-small" type="button" onClick={() => onNavigate('network')}>Open network</button><button className="button button-small" type="button" onClick={() => onNavigate('progress')}>Open progress</button></div>
          </div>
          <dl className="project-controls-fact-grid">
            <div><dt>Forecast finish</dt><dd>{formatDate(snapshot.schedule.forecastFinish, true)}</dd></div>
            <div><dt>Forecast duration</dt><dd>{snapshot.schedule.forecastDurationDays} days</dd></div>
            <div><dt>Critical activities</dt><dd>{snapshot.schedule.criticalActivityCount}</dd></div>
            <div><dt>Near-critical activities</dt><dd>{snapshot.schedule.nearCriticalActivityCount}</dd></div>
          </dl>
          <div className="project-controls-critical-list" aria-label="Critical activity preview">
            {result.activities.filter((activity) => activity.isCritical).slice(0, 8).map((activity) => (
              <article key={activity.id}>
                <div><strong>{activity.id}</strong><span>{activity.name}</span></div>
                <time>{formatDate(activity.earlyFinishDate, true)}</time>
              </article>
            ))}
          </div>
        </section>

        <section className="surface project-controls-findings" aria-labelledby="project-controls-findings-title">
          <div className="surface-heading"><div><p className="eyebrow">Controls and exceptions</p><h2 id="project-controls-findings-title">Open findings by source</h2></div><span className={`project-controls-status status-${findingsStatus}`}>{statusLabel(findingsStatus)}</span></div>
          <div className="project-controls-finding-breakdown">
            <FindingRow label="Schedule warnings" value={snapshot.findings.schedule} onOpen={() => onNavigate('logic')} />
            <FindingRow label="Missing budget" value={snapshot.findings.budget} onOpen={() => onNavigate('controls')} />
            <FindingRow label="Missing dates" value={snapshot.findings.dates} onOpen={() => onNavigate('controls')} />
            <FindingRow label="Open risks" value={snapshot.findings.risk} onOpen={() => onNavigate('risk')} />
            <FindingRow label="Resource conflicts" value={snapshot.findings.resources} onOpen={() => onNavigate('risk')} />
            <FindingRow label="Validation issues" value={snapshot.findings.validation} onOpen={() => onNavigate('enterprise')} />
          </div>
          <p className="muted project-controls-footnote">The headline total equals the full breakdown. Critical findings include schedule errors and high-scoring open risks.</p>
        </section>
      </div>

      <section className="surface project-controls-performance" aria-labelledby="project-controls-performance-title">
        <div className="surface-heading">
          <div><p className="eyebrow">Cost and earned value</p><h2 id="project-controls-performance-title">Performance trend</h2></div>
          <button className="button button-small" type="button" onClick={() => onNavigate('controls')}>Open detailed cost controls</button>
        </div>
        <div className="project-controls-evm-strip">
          <EvmValue label="Planned value" value={formatCurrency(snapshot.earnedValue.pv, snapshot.currency)} />
          <EvmValue label="Earned value" value={formatCurrency(snapshot.earnedValue.ev, snapshot.currency)} />
          <EvmValue label="Actual cost" value={formatCurrency(snapshot.earnedValue.ac, snapshot.currency)} />
          <EvmValue label="Allocation variance" value={formatSignedCurrency(snapshot.cost.allocationVariance, snapshot.currency)} />
        </div>
        {controls.curves.length > 0
          ? <ScurveChart curves={controls.curves} currency={snapshot.currency} title="Planned, earned, actual, and forecast value" />
          : <div className="empty-state compact">Cost loading is required before the performance curve can be displayed.</div>}
      </section>

      <div className="project-controls-secondary-grid">
        <section className="surface" aria-labelledby="project-controls-milestones-title">
          <div className="surface-heading"><div><p className="eyebrow">Upcoming commitments</p><h2 id="project-controls-milestones-title">Milestone outlook</h2></div><button className="button button-small" type="button" onClick={() => onNavigate('schedule')}>Open schedule</button></div>
          {milestones.length === 0 ? <div className="empty-state compact">No milestones are available in the current schedule.</div> : (
            <div className="project-controls-milestone-list">
              {milestones.slice(0, 12).map((milestone) => <article key={milestone.id}><div><strong>{milestone.name}</strong><span>{milestone.id}</span></div><time>{formatDate(milestone.earlyStartDate, true)}</time></article>)}
            </div>
          )}
        </section>
        <section className="surface" aria-labelledby="project-controls-risk-title">
          <div className="surface-heading"><div><p className="eyebrow">Risk exposure</p><h2 id="project-controls-risk-title">Priority risks</h2></div><button className="button button-small" type="button" onClick={() => onNavigate('risk')}>Open risk workspace</button></div>
          {riskResources.riskExposure.length === 0 ? <div className="empty-state compact">No open risks are recorded.</div> : (
            <div className="project-controls-risk-list">
              {riskResources.riskExposure.slice(0, 8).map((risk) => <article key={risk.riskId}><div><strong>{risk.title}</strong><span>{risk.riskId} · score {risk.score}</span></div><span>{formatCurrency(risk.expectedCostExposure, snapshot.currency)} · {risk.expectedScheduleExposureDays}d</span></article>)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DashboardMetricCard({ label, value, detail, status, actionLabel, onOpen }: DashboardMetricCardProps) {
  return <article className={`project-controls-metric status-${status}`}><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div><button type="button" onClick={onOpen}>{actionLabel}<span aria-hidden="true">→</span></button></article>;
}

function FindingRow({ label, value, onOpen }: { label: string; value: number; onOpen: () => void }) {
  return <button type="button" onClick={onOpen}><span>{label}</span><strong>{value}</strong></button>;
}

function EvmValue({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function formatCurrency(value: number | null, currency: string): string {
  if (value === null || !Number.isFinite(value)) return 'Not available';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
}

function formatSignedCurrency(value: number | null, currency: string): string {
  if (value === null || !Number.isFinite(value)) return 'Not available';
  const formatted = formatCurrency(Math.abs(value), currency);
  return value > 0 ? `+${formatted}` : value < 0 ? `-${formatted}` : formatted;
}

function formatRatio(value: number | null): string {
  return value === null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
}

function formatDate(value: string, includeTime: boolean): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return value;
  return new Intl.DateTimeFormat('en-US', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(parsed);
}

function combineStatus(left: ProjectControlsMetricStatus, right: ProjectControlsMetricStatus): ProjectControlsMetricStatus {
  const rank: Record<ProjectControlsMetricStatus, number> = { critical: 0, warning: 1, unavailable: 2, positive: 3 };
  return rank[left] <= rank[right] ? left : right;
}

function performanceDetail(cpi: ProjectControlsMetricStatus, spi: ProjectControlsMetricStatus): string {
  if (cpi === 'unavailable' && spi === 'unavailable') return 'Earned-value data is not available';
  return `Cost ${statusLabel(cpi).toLowerCase()} · Schedule ${statusLabel(spi).toLowerCase()}`;
}

function statusLabel(status: ProjectControlsMetricStatus): string {
  if (status === 'positive') return 'On target';
  if (status === 'warning') return 'Watch';
  if (status === 'critical') return 'Critical';
  return 'No data';
}
