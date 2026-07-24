import { createActivity } from '../domain/project/project';
import type { ProjectRecord } from '../domain/project/types';
import type { Activity } from '../domain/schedule/types';

export interface CsvImportPreview {
  rows: Activity[];
  errors: string[];
  warnings: string[];
}

export function previewActivityCsv(project: ProjectRecord, text: string): CsvImportPreview {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ['CSV file is empty.'], warnings: [] };
  const headers = parseCsvLine(lines[0]).map((item) => item.trim().toLowerCase());
  const required = ['id', 'name', 'duration'];
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const field of required) if (!headers.includes(field)) errors.push(`Missing required column: ${field}`);
  if (errors.length > 0) return { rows: [], errors, warnings };

  const existingIds = new Set(project.activities.map((item) => item.id));
  const importIds = new Set<string>();
  const rootWbs = project.wbs[0];
  const rows: Activity[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = parseCsvLine(lines[index]);
    const record = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? '']));
    const lineNumber = index + 1;
    const id = record.id.trim();
    const name = record.name.trim();
    const duration = Number(record.duration);
    if (!id) errors.push(`Line ${lineNumber}: activity ID is required.`);
    if (!name) errors.push(`Line ${lineNumber}: activity name is required.`);
    if (!Number.isFinite(duration) || duration < 0) errors.push(`Line ${lineNumber}: duration must be zero or greater.`);
    if (existingIds.has(id) || importIds.has(id)) errors.push(`Line ${lineNumber}: duplicate activity ID ${id}.`);
    if (errors.some((error) => error.startsWith(`Line ${lineNumber}:`))) continue;

    importIds.add(id);
    const wbs = project.wbs.find((item) => item.code === record.wbs) ?? rootWbs;
    if (record.wbs && wbs === rootWbs && rootWbs.code !== record.wbs) warnings.push(`Line ${lineNumber}: WBS ${record.wbs} was not found; root WBS used.`);
    const calendar = project.calendars.find((item) => item.id === record.calendarid) ?? project.calendars.find((item) => item.id === project.settings.defaultCalendarId)!;
    rows.push({
      ...createActivity({ id, name, duration, type: record.type === 'milestone' ? 'milestone' : 'task', wbsId: wbs.id, calendarId: calendar.id }),
      code: record.code || undefined,
      notes: record.notes || undefined,
      audit: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'csv' }
    });
  }

  return { rows, errors, warnings };
}

export function applyActivityCsv(project: ProjectRecord, preview: CsvImportPreview): ProjectRecord {
  if (preview.errors.length > 0) throw new Error('CSV import contains validation errors.');
  return {
    ...project,
    activities: [...project.activities, ...preview.rows],
    revision: project.revision + 1,
    updatedAt: new Date().toISOString()
  };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}
