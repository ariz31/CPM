import { useMemo, useState } from 'react';
import { calculateCostControl } from '../domain/controls/costControl';
import {
  addReportSnapshot,
  buildDashboardValues,
  buildReportRows,
  buildSupportBundle,
  createManualOverride,
  createReportSnapshot,
  explainFormula,
  summarizeAudit
} from '../domain/enterprise/enterprise';
import type { EnterpriseReportKind } from '../domain/enterprise/types';
import type { JournalEntry, ProjectRecord } from '../domain/project/types';
import { analyzeRiskResources } from '../domain/riskResources/riskResources';
import type { ScheduleResult } from '../domain/schedule/types';

interface EnterprisePanelProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  journal: JournalEntry[];
  onReplace: (project: ProjectRecord) => void;
}

const reportKinds: EnterpriseReportKind[] = ['executive', 'update', 'critical-path', 'look-ahead', 'boq', 'cash-flow', 'evm', 'productivity', 'resource', 'risk', 'change', 'audit'];

export function EnterprisePanel({ project, result, journal, onReplace }: EnterprisePanelProps) {
  const [reportKind, setReportKind] = useState<EnterpriseReportKind>('executive');
  const [formulaMetric, setFormulaMetric] = useState('CPI');
  const analysis = useMemo(() => {
    if (!result) return undefined;
    const controls = calculateCostControl(project, result);
    const risk = analyzeRiskResources(project, result);
    return { controls, risk, dashboard: buildDashboardValues(project, result, controls, risk) };
  }, [project, result]);
  const audit = useMemo(() => summarizeAudit(journal, project.enterprise.overrides), [journal, project.enterprise.overrides]);
  const explanation = explainFormula(formulaMetric);

  function freezeReport(): void {
    if (!result || !analysis) return;
    const rows = buildReportRows(reportKind, project, result, analysis.controls, analysis.risk, journal);
    const snapshot = createReportSnapshot(project, reportKind, rows, result.engineVersion, `${reportKind} · revision ${project.revision}`);
    onReplace(addReportSnapshot(project, snapshot));
  }

  function addOverride(): void {
    const path = window.prompt('Field path to override', 'settings.nearCriticalFloatThresholdDays');
    if (!path) return;
    const reason = window.prompt('Reason for override');
    if (!reason) return;
    const override = createManualOverride(path, null, null, reason, 'Local user');
    onReplace({ ...project, enterprise: { ...project.enterprise, overrides: [...project.enterprise.overrides, override] } });
  }

  function downloadSupportBundle(): void {
    const bundle = buildSupportBundle(project, journal, '0.9.0');
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.name.replace(/[^a-z0-9-_]+/gi, '-')}-support-bundle.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="controls-stack">
      <section className="surface">
        <div className="surface-heading"><div><p className="eyebrow">Phase 9 · configurable dashboard</p><h2>Enterprise project controls</h2></div><span className="engine-badge">Revision {project.revision}</span></div>
        <div className="enterprise-dashboard">
          {project.enterprise.dashboards[0]?.widgets.map((widget) => {
            const value = analysis?.dashboard.find((item) => item.metric === widget.metric);
            return <article className={`dashboard-widget ${widget.size}`} key={widget.id}><span>{widget.title}</span><strong>{value?.value === null || value?.value === undefined ? 'Unavailable' : value.value.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong><small>{value?.unit ?? ''} · {value?.completeness ?? 'unavailable'}</small></article>;
          })}
        </div>
      </section>

      <div className="workspace-grid">
        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Immutable input revision</p><h2>Report builder</h2></div></div>
          <div className="inline-form"><select value={reportKind} onChange={(event) => setReportKind(event.target.value as EnterpriseReportKind)}>{reportKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select><button className="button button-primary" type="button" disabled={!result} onClick={freezeReport}>Freeze report snapshot</button></div>
          <div className="snapshot-list">{project.enterprise.reportSnapshots.slice().reverse().map((snapshot) => <article key={snapshot.id}><strong>{snapshot.name}</strong><span>{snapshot.kind} · revision {snapshot.projectRevision} · {snapshot.statusDate}</span><code>{snapshot.inputHash}</code><small>{snapshot.rows.length} rows · {snapshot.createdAt}</small></article>)}</div>
          {project.enterprise.reportSnapshots.length === 0 ? <p className="empty-state">No immutable report snapshots yet.</p> : null}
        </section>

        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Calculation transparency</p><h2>Formula inspector</h2></div></div>
          <select value={formulaMetric} onChange={(event) => setFormulaMetric(event.target.value)}><option>PV</option><option>EV</option><option>AC</option><option>SPI</option><option>CPI</option><option>EAC</option><option>PERT</option></select>
          <article className="formula-card"><strong>{explanation.metric}</strong><code>{explanation.formula}</code><p>{explanation.description}</p><dl><dt>Undefined when</dt><dd>{explanation.undefinedWhen}</dd></dl>{explanation.assumptions.map((assumption) => <small key={assumption}>• {assumption}</small>)}</article>
        </section>
      </div>

      <div className="workspace-grid">
        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Authoritative history</p><h2>Audit and overrides</h2></div><button className="button button-secondary" type="button" onClick={addOverride}>Record override</button></div>
          <div className="analysis-summary"><strong>{audit.mappedCount} mapped commands</strong><span>{audit.unmappedCommandTypes.length} unmapped classes</span><span>{audit.overrideCount} manual overrides</span></div>
          {audit.unmappedCommandTypes.map((type) => <p className="notice notice-error" key={type}>Unmapped command class: {type}</p>)}
          <div className="compact-table">{audit.rows.slice(0, 30).map((row) => <div className="compact-row wide" key={row.commandId}><span>{row.createdAt.slice(0, 19)}</span><strong>{row.commandType}</strong><span>{row.summary}</span><span>{row.mapped ? 'Mapped' : 'Unmapped'}</span></div>)}</div>
        </section>

        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Privacy-safe diagnostics</p><h2>Support bundle</h2></div><button className="button button-primary" type="button" onClick={downloadSupportBundle}>Download redacted bundle</button></div>
          <p>The bundle includes schema, revision, counts, mapped audit metadata, and the latest 500 diagnostics. Owner, contractor, consultant, location, email, token, secret, password, and authorization fields are redacted.</p>
          <div className="diagnostic-list">{project.enterprise.diagnostics.slice(-10).reverse().map((event) => <article className={`diagnostic ${event.severity}`} key={event.id}><strong>{event.code}</strong><span>{event.message}</span><small>{event.occurredAt}</small></article>)}</div>
          {project.enterprise.diagnostics.length === 0 ? <p className="empty-state">No diagnostic events recorded.</p> : null}
        </section>
      </div>
    </div>
  );
}
