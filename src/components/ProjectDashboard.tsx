import { useMemo, useRef, useState } from 'react';
import { calculateCostControl } from '../domain/controls/costControl';
import { buildDashboardValues, createDefaultDashboard } from '../domain/enterprise/enterprise';
import type { DashboardDefinition, DashboardMetric, DashboardWidget, DashboardWidgetKind } from '../domain/enterprise/types';
import type { ProjectRecord } from '../domain/project/types';
import { analyzeRiskResources } from '../domain/riskResources/riskResources';
import type { ScheduleResult } from '../domain/schedule/types';
import { DataViewFrame } from './DataViewFrame';
import { MetricCard } from './MetricCard';
import { ScurveChart } from './ScurveChart';
import type { WorkspaceTab } from './WorkspaceNavigation';

interface ProjectDashboardProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  onReplace: (project: ProjectRecord) => void;
  onNavigate: (tab: WorkspaceTab) => void;
  onAddActivity: () => void;
  onCreateSnapshot: () => void;
}

interface WidgetCatalogItem {
  id: string;
  title: string;
  kind: DashboardWidgetKind;
  metric?: DashboardMetric;
  size: DashboardWidget['size'];
  description: string;
}

const PROJECT_CONTROL_METRICS = new Set<DashboardMetric>(['schedule-duration', 'bac', 'spi', 'cpi', 'control-findings', 'allocation-completeness']);

const WIDGET_CATALOG: WidgetCatalogItem[] = [
  { id: 'W-PROGRESS', title: 'Overall progress', kind: 'metric', metric: 'weighted-progress', size: 'small', description: 'Weighted project progress.' },
  { id: 'W-CRITICAL', title: 'Critical activities', kind: 'metric', metric: 'critical-activities', size: 'small', description: 'Current zero-float activities.' },
  { id: 'W-NEAR-CRITICAL', title: 'Near-critical activities', kind: 'metric', metric: 'near-critical-activities', size: 'small', description: 'Activities inside the configured threshold.' },
  { id: 'W-RISK', title: 'Risk cost exposure', kind: 'metric', metric: 'risk-cost-exposure', size: 'small', description: 'Expected open risk cost exposure.' },
  { id: 'W-SCURVE', title: 'S-curve', kind: 's-curve', size: 'large', description: 'Planned, earned, actual, and forecast cumulative values.' },
  { id: 'W-FINDINGS', title: 'Priority findings', kind: 'findings', size: 'medium', description: 'Actionable schedule and control findings.' },
  { id: 'W-MILESTONES', title: 'Milestones', kind: 'milestones', size: 'medium', description: 'Key milestones and calculated dates.' },
  { id: 'W-ACTIONS', title: 'Quick actions', kind: 'quick-actions', size: 'large', description: 'Common planning and control actions.' }
];

export function ProjectDashboard({ project, result, onReplace, onNavigate, onAddActivity, onCreateSnapshot }: ProjectDashboardProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const storedDashboard = project.enterprise.dashboards[0];
  const dashboard = useMemo(() => normalizeDashboard(storedDashboard), [storedDashboard]);
  const [draftWidgets, setDraftWidgets] = useState<DashboardWidget[]>(dashboard.widgets);
  const analysis = useMemo(() => {
    if (!result) return undefined;
    const controls = calculateCostControl(project, result);
    const risk = analyzeRiskResources(project, result);
    return { controls, risk, values: buildDashboardValues(project, result, controls, risk) };
  }, [project, result]);
  const valueByMetric = useMemo(() => new Map(analysis?.values.map((value) => [value.metric, value]) ?? []), [analysis]);

  function openConfigurator(): void {
    setDraftWidgets(dashboard.widgets.map((widget) => ({ ...widget, kind: widget.kind ?? 'metric' })));
    dialogRef.current?.showModal();
  }

  function applyDashboard(): void {
    const nextDashboard: DashboardDefinition = { ...dashboard, widgets: draftWidgets };
    const dashboards = project.enterprise.dashboards.length > 0
      ? project.enterprise.dashboards.map((item, index) => index === 0 ? nextDashboard : item)
      : [nextDashboard];
    onReplace({ ...project, enterprise: { ...project.enterprise, dashboards } });
    dialogRef.current?.close();
  }

  function toggleCatalogItem(item: WidgetCatalogItem, checked: boolean): void {
    setDraftWidgets((current) => checked
      ? current.some((widget) => widget.id === item.id) ? current : [...current, { id: item.id, title: item.title, kind: item.kind, metric: item.metric, size: item.size }]
      : current.filter((widget) => widget.id !== item.id));
  }

  function moveWidget(index: number, direction: -1 | 1): void {
    setDraftWidgets((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  const findings = buildFindings(project, result, analysis?.controls.completeness.activitiesWithoutBudget ?? [], analysis?.controls.completeness.activitiesWithoutDates ?? [], analysis?.risk.validationIssues ?? []);
  const milestones = (result?.activities ?? []).filter((activity) => activity.type === 'milestone').sort((left, right) => left.earlyStartDate.localeCompare(right.earlyStartDate));

  return (
    <section className="dashboard-workspace" aria-labelledby="project-dashboard-title">
      <div className="dashboard-command-heading"><div><p className="eyebrow">Project workbench</p><h1 id="project-dashboard-title">Dashboard</h1><p className="muted">Choose the progress, planning, milestone, and action widgets that matter for this project.</p></div><button className="button button-secondary" type="button" onClick={openConfigurator}>Customize dashboard</button></div>
      <section className="project-controls-entry" aria-labelledby="project-controls-entry-title"><div><p className="eyebrow">Dedicated controls workspace</p><h2 id="project-controls-entry-title">Project controls dashboard</h2><p>Review the authoritative duration, budget at completion, CPI, SPI, findings, performance curve, milestones, and risk exposure in one standardized view.</p></div><button className="button button-primary" type="button" onClick={() => onNavigate('project-controls')}>Open project controls</button></section>
      {!result ? <div className="notice" role="status">The dashboard will populate after the schedule calculation completes.</div> : null}
      <div className="dashboard-grid">
        {dashboard.widgets.map((widget) => {
          const kind = widget.kind ?? 'metric';
          if (kind === 'metric' && widget.metric) {
            const value = valueByMetric.get(widget.metric);
            return <div className={`dashboard-widget-host ${widget.size}`} key={widget.id}><MetricCard label={widget.title} value={formatDashboardValue(value?.value, value?.unit, project.metadata.currency)} detail={`${value?.unit ?? 'Unavailable'} · ${value?.completeness ?? 'unavailable'}`} tone={widget.metric === 'cpi' && value?.value !== null && value?.value !== undefined && value.value < 1 ? 'critical' : 'default'} /></div>;
          }
          if (kind === 's-curve') return <div className={`dashboard-widget-host ${widget.size}`} key={widget.id}>{analysis?.controls.curves.length ? <ScurveChart curves={analysis.controls.curves} currency={project.metadata.currency} title={widget.title} /> : <DataViewFrame title={widget.title}><p className="notice">No curve data is available.</p></DataViewFrame>}</div>;
          if (kind === 'findings') return <div className={`dashboard-widget-host ${widget.size}`} key={widget.id}><DataViewFrame title={widget.title} eyebrow="Needs attention" description={`${findings.length} current findings`}>{findings.length > 0 ? <ul className="dashboard-finding-list">{findings.slice(0, 12).map((finding) => <li key={finding}>{finding}</li>)}</ul> : <p className="empty-state compact">No current schedule or control findings.</p>}</DataViewFrame></div>;
          if (kind === 'milestones') return <div className={`dashboard-widget-host ${widget.size}`} key={widget.id}><DataViewFrame title={widget.title} eyebrow="Schedule dates" description={`${milestones.length} milestones`}><div className="dashboard-milestone-list">{milestones.slice(0, 12).map((milestone) => <article key={milestone.id}><div><strong>{milestone.name}</strong><span>{milestone.id}</span></div><time>{milestone.earlyStart.date}</time></article>)}</div></DataViewFrame></div>;
          if (kind === 'quick-actions') return <article className={`dashboard-action-widget ${widget.size}`} key={widget.id}><div><p className="eyebrow">Start work</p><h2>{widget.title}</h2></div><div className="dashboard-quick-actions"><button className="button button-primary" type="button" onClick={onAddActivity}>Add activity</button><button className="button button-secondary" type="button" onClick={() => onNavigate('duration')}>Duration calculator</button><button className="button button-secondary" type="button" onClick={() => onNavigate('dictionary')}>Activity dictionary</button><button className="button button-secondary" type="button" onClick={() => onNavigate('progress')}>Record progress</button><button className="button button-secondary" type="button" onClick={() => onNavigate('project-controls')}>Project controls</button><button className="button button-secondary" type="button" onClick={onCreateSnapshot}>Create snapshot</button></div></article>;
          return null;
        })}
      </div>

      <dialog className="dashboard-config-dialog" ref={dialogRef} aria-labelledby="dashboard-config-title"><form method="dialog" onSubmit={(event) => { event.preventDefault(); applyDashboard(); }}><div className="dialog-heading"><div><p className="eyebrow">Personalize the workbench</p><h2 id="dashboard-config-title">Choose dashboard items</h2><p>Select, order, and size the information shown when this project opens. Detailed project-controls metrics remain in the dedicated dashboard.</p></div><button className="icon-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close dashboard configuration">×</button></div><div className="dashboard-catalog">{WIDGET_CATALOG.map((item) => { const index = draftWidgets.findIndex((widget) => widget.id === item.id); const selected = index >= 0; const widget = selected ? draftWidgets[index] : undefined; return <article className={selected ? 'selected' : ''} key={item.id}><label className="dashboard-catalog-toggle"><input type="checkbox" checked={selected} onChange={(event) => toggleCatalogItem(item, event.target.checked)} /><span><strong>{item.title}</strong><small>{item.description}</small></span></label>{selected && widget ? <div className="dashboard-catalog-controls"><label>Size<select value={widget.size} onChange={(event) => setDraftWidgets((current) => current.map((candidate) => candidate.id === widget.id ? { ...candidate, size: event.target.value as DashboardWidget['size'] } : candidate))}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Full width</option></select></label><button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0} onClick={() => moveWidget(index, -1)}>↑</button><button type="button" aria-label={`Move ${item.title} down`} disabled={index === draftWidgets.length - 1} onClick={() => moveWidget(index, 1)}>↓</button></div> : null}</article>; })}</div><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => setDraftWidgets(normalizeDashboard(createDefaultDashboard()).widgets)}>Reset default</button><button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button><button className="button button-primary" type="submit" disabled={draftWidgets.length === 0}>Apply dashboard</button></div></form></dialog>
    </section>
  );
}

function normalizeDashboard(stored: DashboardDefinition | undefined): DashboardDefinition {
  const fallback = createDefaultDashboard();
  const allowedFallback = fallback.widgets.filter((widget) => !widget.metric || !PROJECT_CONTROL_METRICS.has(widget.metric));
  if (!stored) return { ...fallback, widgets: allowedFallback };

  const legacy = stored.widgets.length > 0 && stored.widgets.every((widget) => widget.kind === undefined);
  const normalized = stored.widgets.map((widget) => ({ ...widget, kind: widget.kind ?? 'metric' as const }));
  const retained = normalized.filter((widget) => !widget.metric || !PROJECT_CONTROL_METRICS.has(widget.metric));
  if (!legacy) return { ...stored, widgets: retained };

  const missingDefault = allowedFallback.filter((widget) => !retained.some((candidate) => candidate.id === widget.id));
  return { ...stored, widgets: [...retained, ...missingDefault] };
}

function buildFindings(project: ProjectRecord, result: ScheduleResult | undefined, withoutBudget: string[], withoutDates: string[], validationIssues: string[]): string[] {
  return [...(result?.warnings.map((warning) => warning.message) ?? []), ...withoutBudget.map((id) => `${id} has no budget allocation.`), ...withoutDates.map((id) => `${id} has no calculated cost-control dates.`), ...validationIssues, ...project.riskResources.risks.filter((risk) => risk.status !== 'closed').map((risk) => `Open risk: ${risk.title}`)];
}

function formatDashboardValue(value: number | null | undefined, unit: string | undefined, currency: string): string {
  if (value === null || value === undefined) return 'Unavailable';
  if (unit === currency) return `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (unit === '%') return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
  if (unit === 'ratio') return value.toLocaleString('en-US', { maximumFractionDigits: 3 });
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
