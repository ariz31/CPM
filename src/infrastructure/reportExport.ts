import type { ScheduleReport } from '../domain/reporting/scheduleReports';

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function printScheduleReport(report: ScheduleReport): void {
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) throw new Error('The print window was blocked by the browser.');
  const header = report.columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const rows = report.rows.map((row) => `<tr>${report.columns.map((column) => `<td>${escapeHtml(String(row[column.key] ?? ''))}</td>`).join('')}</tr>`).join('');
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title><style>
    @page{size:A4 landscape;margin:12mm} body{font:11px system-ui;margin:0;color:#111} h1{font-size:20px;margin:0 0 4px} .meta{font-size:10px;margin-bottom:12px} table{border-collapse:collapse;width:100%;table-layout:fixed} th,td{border:1px solid #bbb;padding:5px;vertical-align:top;overflow-wrap:anywhere} th{background:#eee} thead{display:table-header-group} tr{break-inside:avoid} footer{position:fixed;bottom:0;font-size:9px}
  </style></head><body><h1>${escapeHtml(report.title)}</h1><div class="meta">${escapeHtml(report.provenance.projectName)} · revision ${report.provenance.projectRevision} · status ${escapeHtml(report.provenance.statusDate)} · engine ${escapeHtml(report.provenance.engineVersion)} · generated ${escapeHtml(report.provenance.generatedAt)}</div><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table><footer>Project ${escapeHtml(report.provenance.projectId)} · report ${escapeHtml(report.id)}</footer><script>window.addEventListener('load',()=>window.print())</script></body></html>`);
  popup.document.close();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character] ?? character);
}
