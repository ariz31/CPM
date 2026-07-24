import { useMemo, useState } from 'react';
import type { ProjectRecord } from '../domain/project/types';
import { createScheduleReport, scheduleReportToCsv, type ScheduleReportKind } from '../domain/reporting/scheduleReports';
import type { ScheduleResult } from '../domain/schedule/types';
import { downloadTextFile, printScheduleReport } from '../infrastructure/reportExport';

interface ScheduleReportsPanelProps { project: ProjectRecord; result?: ScheduleResult; }

export function ScheduleReportsPanel({ project, result }: ScheduleReportsPanelProps) {
  const [kind, setKind] = useState<ScheduleReportKind>('critical-path');
  const [lookAheadDays, setLookAheadDays] = useState(21);
  const report = useMemo(() => result ? createScheduleReport(kind, project, result, { lookAheadDays }) : undefined, [kind, lookAheadDays, project, result]);
  return (
    <section className="surface phase-surface" aria-labelledby="reports-title">
      <div className="surface-heading phase-toolbar"><div><p className="eyebrow">Immutable revision provenance</p><h2 id="reports-title">Schedule reports</h2></div><div className="toolbar-group wrap"><label>Report<select value={kind} onChange={(event) => setKind(event.target.value as ScheduleReportKind)}><option value="critical-path">Critical path</option><option value="float">Float</option><option value="logic">Logic</option><option value="milestones">Milestones</option><option value="look-ahead">Look-ahead</option></select></label>{kind === 'look-ahead' ? <label>Days<input type="number" min={1} max={365} value={lookAheadDays} onChange={(event) => setLookAheadDays(Number(event.target.value))} /></label> : null}<button className="button button-secondary" type="button" disabled={!report} onClick={() => report && downloadTextFile(scheduleReportToCsv(report), `${kind}-r${project.revision}.csv`, 'text/csv;charset=utf-8')}>Download CSV</button><button className="button button-primary" type="button" disabled={!report} onClick={() => report && printScheduleReport(report)}>Print / PDF</button></div></div>
      {!report ? <div className="empty-state">A valid schedule calculation is required.</div> : <><div className="report-provenance" role="status"><span>Revision {report.provenance.projectRevision}</span><span>Status {report.provenance.statusDate}</span><span>Engine {report.provenance.engineVersion}</span><span>{report.rows.length} rows</span></div><div className="report-table-scroll"><table className="report-table"><thead><tr>{report.columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{report.rows.map((row, index) => <tr key={`${report.id}-${index}`}>{report.columns.map((column) => <td key={column.key}>{String(row[column.key] ?? '')}</td>)}</tr>)}</tbody></table></div></>}
    </section>
  );
}
