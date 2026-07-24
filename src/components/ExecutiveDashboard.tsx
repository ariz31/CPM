import { useMemo } from 'react';
import { calculateCostControl } from '../domain/controls/costControl';
import type { ProjectRecord } from '../domain/project/types';
import { buildExecutiveSummary, type ExecutiveMetric } from '../domain/reporting/executiveSummary';
import { analyzeRiskResources } from '../domain/riskResources/riskResources';
import type { ScheduleResult } from '../domain/schedule/types';

interface ExecutiveDashboardProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  onNavigate: (tab: 'reports' | 'enterprise' | 'progress' | 'controls' | 'risk') => void;
}

export function ExecutiveDashboard({ project, result, onNavigate }: ExecutiveDashboardProps) {
  const summary = useMemo(() => {
    if (!result) return undefined;
    return buildExecutiveSummary(project, result, calculateCostControl(project, result), analyzeRiskResources(project, result));
  }, [project, result]);

  if (!summary) return <section className="surface"><div className="empty-state">A valid schedule calculation is required for the executive dashboard.</div></section>;
  const criticalExceptions = summary.exceptions.filter((item) => item.severity === 'critical').length;
  const warningExceptions = summary.exceptions.filter((item) => item.severity === 'warning').length;

  return (
    <div className="executive-workspace controls-stack">
      <section className="surface executive-header" aria-labelledby="executive-dashboard-title">
        <div className="surface-heading phase-toolbar"><div><p className="eyebrow">Phase H · evidence-backed review</p><h2 id="executive-dashboard-title">Executive project summary</h2><p>Compact decision support with definitions, status-date context, source disclosure, and completeness for every metric.</p></div><div className="toolbar-group wrap"><button className="button button-secondary" type="button" onClick={() => onNavigate('reports')}>Open report catalog</button><button className="button button-primary" type="button" onClick={() => onNavigate('enterprise')}>Freeze evidence snapshot</button></div></div>
        <div className="executive-provenance" role="status"><span>Revision {summary.projectRevision}</span><span>Status {summary.statusDate}</span><span>Engine {summary.engineVersion}</span><span>Completeness {summary.completenessScore}%</span><span>{criticalExceptions} critical · {warningExceptions} warnings</span></div>
      </section>

      <section className="executive-metric-grid" aria-label="Executive key performance indicators">
        {summary.metrics.map((metric) => <article className={`executive-metric metric-${metric.status}`} key={metric.id}>
          <span>{metric.label}</span>
          <strong>{formatMetric(metric, project.metadata.currency)}</strong>
          <small>{metric.completeness} data</small>
          <details><summary>Definition and source</summary><dl><dt>Definition</dt><dd>{metric.definition}</dd><dt>Calculation</dt><dd>{metric.calculation}</dd><dt>Source</dt><dd>{metric.source}</dd><dt>Status date</dt><dd>{summary.statusDate}</dd></dl></details>
        </article>)}
      </section>

      <div className="executive-two-column">
        <section className="surface executive-curve" aria-labelledby="executive-curve-title">
          <div className="surface-heading"><div><p className="eyebrow">Purposeful control chart</p><h2 id="executive-curve-title">Planned, earned, and actual value</h2></div><button className="button button-small" type="button" onClick={() => onNavigate('controls')}>Open cost control</button></div>
          <ExecutiveCurve points={summary.curve} />
        </section>
        <section className="surface executive-exception-summary" aria-labelledby="executive-exceptions-title">
          <div className="surface-heading"><div><p className="eyebrow">Management attention</p><h2 id="executive-exceptions-title">Top exceptions</h2></div></div>
          {summary.exceptions.length === 0 ? <div className="empty-state compact">No active exceptions.</div> : <div className="executive-exception-list">{summary.exceptions.slice(0, 10).map((item) => <article className={item.severity} key={item.id}><span>{item.category}</span><strong>{item.title}</strong><p>{item.detail}</p><button type="button" onClick={() => onNavigate(item.category === 'risk' || item.category === 'resource' ? 'risk' : item.category === 'cost' ? 'controls' : 'progress')}>Review source</button></article>)}</div>}
        </section>
      </div>

      <section className="surface milestone-review" aria-labelledby="milestone-review-title">
        <div className="surface-heading"><div><p className="eyebrow">Upcoming commitments</p><h2 id="milestone-review-title">Milestone outlook</h2></div></div>
        {summary.milestones.length === 0 ? <div className="empty-state compact">No milestones are available in the current schedule.</div> : <div className="report-table-scroll"><table className="report-table"><thead><tr><th>Milestone</th><th>Forecast</th><th>State</th><th>Baseline variance</th></tr></thead><tbody>{summary.milestones.map((milestone) => <tr key={milestone.activityId}><td><strong>{milestone.activityId}</strong><span>{milestone.name}</span></td><td>{milestone.forecastDate}</td><td><span className={`pill ${milestone.state === 'late' ? 'pill-critical' : milestone.state === 'upcoming' ? 'pill-warning' : ''}`}>{milestone.state}</span></td><td>{milestone.varianceDays === undefined ? 'No active baseline' : `${milestone.varianceDays > 0 ? '+' : ''}${milestone.varianceDays}d`}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

function ExecutiveCurve({ points }: { points: Array<{ period: string; planned: number; earned: number; actual: number }> }) {
  if (points.length === 0) return <div className="empty-state compact">Cost loading is required before the control curve can be displayed.</div>;
  const width = 920;
  const height = 280;
  const padding = { left: 68, right: 24, top: 24, bottom: 48 };
  const maximum = Math.max(1, ...points.flatMap((point) => [point.planned, point.earned, point.actual]));
  const x = (index: number) => padding.left + index / Math.max(1, points.length - 1) * (width - padding.left - padding.right);
  const y = (value: number) => height - padding.bottom - value / maximum * (height - padding.top - padding.bottom);
  const polyline = (key: 'planned' | 'earned' | 'actual') => points.map((point, index) => `${x(index)},${y(point[key])}`).join(' ');
  return <>
    <div className="executive-chart-scroll" tabIndex={0} aria-label="Scrollable planned earned and actual value chart">
      <svg width={width} height={height} role="img" aria-labelledby="executive-curve-svg-title executive-curve-svg-desc">
        <title id="executive-curve-svg-title">Planned, earned, and actual value curve</title><desc id="executive-curve-svg-desc">A three-series line chart. An accessible data table follows the chart.</desc>
        <rect width={width} height={height} className="executive-chart-background" />
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <g key={ratio}><line x1={padding.left} x2={width - padding.right} y1={y(maximum * ratio)} y2={y(maximum * ratio)} className="executive-chart-grid" /><text x={8} y={y(maximum * ratio) + 4} className="executive-chart-label">{Math.round(maximum * ratio).toLocaleString('en-US')}</text></g>)}
        <polyline points={polyline('planned')} className="executive-chart-line planned" />
        <polyline points={polyline('earned')} className="executive-chart-line earned" />
        <polyline points={polyline('actual')} className="executive-chart-line actual" />
        {points.map((point, index) => index % Math.max(1, Math.ceil(points.length / 8)) === 0 ? <text key={point.period} x={x(index)} y={height - 16} textAnchor="middle" className="executive-chart-label">{point.period}</text> : null)}
      </svg>
    </div>
    <div className="chart-legend"><span className="planned">Planned</span><span className="earned">Earned</span><span className="actual">Actual</span></div>
    <details className="accessible-fallback"><summary>Accessible curve data</summary><table><thead><tr><th>Period</th><th>Planned</th><th>Earned</th><th>Actual</th></tr></thead><tbody>{points.map((point) => <tr key={point.period}><td>{point.period}</td><td>{point.planned}</td><td>{point.earned}</td><td>{point.actual}</td></tr>)}</tbody></table></details>
  </>;
}

function formatMetric(metric: ExecutiveMetric, currency: string): string {
  if (metric.value === null) return 'Unavailable';
  if (typeof metric.value === 'string') return metric.value;
  if (metric.unit === currency) {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(metric.value); }
    catch { return `${currency} ${metric.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`; }
  }
  const value = metric.value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return metric.unit === '%' ? `${value}%` : metric.unit ? `${metric.unit} ${value}` : value;
}
