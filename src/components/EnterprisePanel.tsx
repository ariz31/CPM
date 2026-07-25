import { useMemo, useRef, useState } from 'react';
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
import { ReleaseQualificationPanel } from './ReleaseQualificationPanel';

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
  const [overridePath, setOverridePath] = useState('settings.nearCriticalFloatThresholdDays');
  const [overrideReason, setOverrideReason] = useState('');
  const overrideDialogRef = useRef<HTMLDialogElement | null>(null);
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

  function openOverrideDialog(): void {
    setOverridePath('settings.nearCriticalFloatThresholdDays');
    setOverrideReason('');
    overrideDialogRef.current?.showModal();
  }

  function commitOverride(): void {
    const path = overridePath.trim();
    const reason = overrideReason.trim();
    if (!path || !reason) return;
    const override = createManualOverride(path, null, null, reason, 'Local user');
    onReplace({ ...project, enterprise: { ...project.enterprise, overrides: [...project.enterprise.overrides, override] } });
    overrideDialogRef.current?.close();
  }

  function downloadSupportBundle(): void {
    const bundle = buildSupportBundle(project, journal, '1.0.0-rc.3');
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.name.replace(/[^a-z0-9-_]+/gi, '-')}-support-bundle.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="controls-stack">
      <ReleaseQualificationPanel />
      <section className="surface dashboard-enterprise-handoff">
        <div className="surface-heading"><div><p className="eyebrow">Centralized workbench</p><h2>Dashboard configuration moved to Overview</h2></div><span className="engine-badge">Revision {project.revision}</span></div>
        <p>The live dashboard, duration, budget, findings, S-curve, milestones, and quick actions are configured from the project Dashboard. Audit & evidence remains the home of immutable reports, formula explanations, audit evidence, overrides, and release qualification.</p>
      </section>

      <div className="workspace-grid">
        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Immutable input revision</p><h2>Report builder</h2></div></div>
          <div className="inline-form"><select aria-label="Enterprise report type" value={reportKind} onChange={(event) => setReportKind(event.target.value as EnterpriseReportKind)}>{reportKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select><button className="button button-primary" type="button" disabled={!result} onClick={freezeReport}>Freeze report snapshot</button></div>
          <div className="snapshot-list">{project.enterprise.reportSnapshots.slice().reverse().map((snapshot) => <article key={snapshot.id}><strong>{snapshot.name}</strong><span>{snapshot.kind} · revision {snapshot.projectRevision} · {snapshot.statusDate}</span><code>{snapshot.inputHash}</code><small>{snapshot.rows.length} rows · {snapshot.createdAt}</small></article>)}</div>
          {project.enterprise.reportSnapshots.length === 0 ? <p className="empty-state">No immutable report snapshots yet.</p> : null}
        </section>

        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Calculation transparency</p><h2>Formula inspector</h2></div></div>
          <select aria-label="Formula metric" value={formulaMetric} onChange={(event) => setFormulaMetric(event.target.value)}><option>PV</option><option>EV</option><option>AC</option><option>SPI</option><option>CPI</option><option>EAC</option><option>PERT</option></select>
          <article className="formula-card"><strong>{explanation.metric}</strong><code>{explanation.formula}</code><p>{explanation.description}</p><dl><dt>Undefined when</dt><dd>{explanation.undefinedWhen}</dd></dl>{explanation.assumptions.map((assumption) => <small key={assumption}>• {assumption}</small>)}</article>
        </section>
      </div>

      <div className="workspace-grid">
        <section className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Authoritative history</p><h2>Audit and overrides</h2></div><button className="button button-secondary" type="button" onClick={openOverrideDialog}>Record override</button></div>
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

      <dialog className="project-action-dialog" ref={overrideDialogRef} aria-labelledby="override-dialog-title">
        <form method="dialog" onSubmit={(event) => { event.preventDefault(); commitOverride(); }}>
          <div className="dialog-heading"><div><p className="eyebrow">Audit-controlled change</p><h2 id="override-dialog-title">Record manual override</h2><p>The override is appended to the authoritative audit history with the stated reason.</p></div><button className="icon-button" type="button" onClick={() => overrideDialogRef.current?.close()} aria-label="Close dialog">×</button></div>
          <label className="dialog-field">Field path<input autoFocus value={overridePath} onChange={(event) => setOverridePath(event.target.value)} /></label>
          <label className="dialog-field">Reason<textarea rows={4} value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} /></label>
          <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => overrideDialogRef.current?.close()}>Cancel</button><button className="button button-primary" type="submit" disabled={!overridePath.trim() || !overrideReason.trim()}>Record override</button></div>
        </form>
      </dialog>
    </div>
  );
}
