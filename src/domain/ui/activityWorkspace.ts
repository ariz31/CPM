import type { Activity, CalculatedActivity } from '../schedule/types';

export type ActivityColumnKey =
  | 'select'
  | 'id'
  | 'name'
  | 'wbs'
  | 'calendar'
  | 'type'
  | 'duration'
  | 'earlyStart'
  | 'earlyFinish'
  | 'totalFloat'
  | 'freeFloat'
  | 'progress'
  | 'deadline'
  | 'status';

export interface ActivityColumnDefinition {
  key: ActivityColumnKey;
  label: string;
  width: number;
  minimumWidth: number;
  editable: boolean;
  pinned?: boolean;
}

export const ACTIVITY_COLUMNS: ActivityColumnDefinition[] = [
  { key: 'select', label: 'Select', width: 44, minimumWidth: 44, editable: false, pinned: true },
  { key: 'id', label: 'ID', width: 110, minimumWidth: 88, editable: false, pinned: true },
  { key: 'name', label: 'Activity', width: 260, minimumWidth: 180, editable: true, pinned: true },
  { key: 'wbs', label: 'WBS', width: 108, minimumWidth: 88, editable: true },
  { key: 'calendar', label: 'Calendar', width: 150, minimumWidth: 120, editable: true },
  { key: 'type', label: 'Type', width: 112, minimumWidth: 96, editable: true },
  { key: 'duration', label: 'Duration', width: 104, minimumWidth: 88, editable: true },
  { key: 'earlyStart', label: 'Early start', width: 118, minimumWidth: 106, editable: false },
  { key: 'earlyFinish', label: 'Early finish', width: 118, minimumWidth: 106, editable: false },
  { key: 'totalFloat', label: 'Total float', width: 94, minimumWidth: 82, editable: false },
  { key: 'freeFloat', label: 'Free float', width: 94, minimumWidth: 82, editable: false },
  { key: 'progress', label: 'Progress', width: 100, minimumWidth: 88, editable: false },
  { key: 'deadline', label: 'Deadline', width: 118, minimumWidth: 106, editable: true },
  { key: 'status', label: 'Status', width: 132, minimumWidth: 112, editable: false }
];

export const DEFAULT_ACTIVITY_COLUMN_KEYS: ActivityColumnKey[] = [
  'select', 'id', 'name', 'wbs', 'calendar', 'type', 'duration', 'earlyFinish', 'totalFloat', 'progress', 'status'
];

export type ActivitySortKey = 'id' | 'name' | 'duration' | 'wbs';
export type FillDownField = 'name' | 'duration' | 'wbsId' | 'calendarId' | 'type' | 'deadline';

export function normalizeActivityColumnKeys(value: unknown): ActivityColumnKey[] {
  if (!Array.isArray(value)) return [...DEFAULT_ACTIVITY_COLUMN_KEYS];
  const valid = new Set(ACTIVITY_COLUMNS.map((column) => column.key));
  const normalized = value.filter((item): item is ActivityColumnKey => typeof item === 'string' && valid.has(item as ActivityColumnKey));
  const unique = [...new Set(normalized)];
  for (const required of ['select', 'id', 'name'] as ActivityColumnKey[]) if (!unique.includes(required)) unique.unshift(required);
  return ACTIVITY_COLUMNS.map((column) => column.key).filter((key) => unique.includes(key));
}

export function filterAndSortActivities(
  activities: Activity[],
  query: string,
  sortBy: ActivitySortKey,
  sortDirection: 'asc' | 'desc',
  wbsCodes: Map<string, string>
): Activity[] {
  const normalized = query.trim().toLowerCase();
  const direction = sortDirection === 'asc' ? 1 : -1;
  return activities
    .filter((activity) => !normalized || `${activity.id} ${activity.name} ${activity.code ?? ''} ${wbsCodes.get(activity.wbsId) ?? ''} ${activity.notes ?? ''}`.toLowerCase().includes(normalized))
    .slice()
    .sort((left, right) => {
      if (sortBy === 'duration') return (left.duration - right.duration) * direction;
      const leftValue = sortBy === 'wbs' ? wbsCodes.get(left.wbsId) ?? '' : left[sortBy];
      const rightValue = sortBy === 'wbs' ? wbsCodes.get(right.wbsId) ?? '' : right[sortBy];
      return String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true }) * direction;
    });
}

export function buildActivityGridTemplate(columns: ActivityColumnKey[], widths: Partial<Record<ActivityColumnKey, number>>): string {
  const definitions = new Map(ACTIVITY_COLUMNS.map((column) => [column.key, column]));
  return columns.map((key) => {
    const definition = definitions.get(key)!;
    return `${Math.max(definition.minimumWidth, widths[key] ?? definition.width)}px`;
  }).join(' ');
}

export function parseClipboardUpdates(
  text: string,
  visibleColumns: ActivityColumnKey[],
  startColumn: ActivityColumnKey,
  activities: Activity[],
  startRowIndex: number
): Array<{ activityId: string; changes: Partial<Activity> }> {
  const editableColumns = new Set(ACTIVITY_COLUMNS.filter((column) => column.editable).map((column) => column.key));
  const startColumnIndex = visibleColumns.indexOf(startColumn);
  if (startColumnIndex < 0) return [];
  const rows = text.replace(/\r/g, '').split('\n').filter((row, index, array) => row.length > 0 || index < array.length - 1);
  const updates: Array<{ activityId: string; changes: Partial<Activity> }> = [];
  rows.forEach((row, rowOffset) => {
    const activity = activities[startRowIndex + rowOffset];
    if (!activity) return;
    const changes: Partial<Activity> = {};
    row.split('\t').forEach((raw, columnOffset) => {
      const key = visibleColumns[startColumnIndex + columnOffset];
      if (!key || !editableColumns.has(key)) return;
      assignClipboardValue(changes, key, raw.trim(), activity);
    });
    if (Object.keys(changes).length > 0) updates.push({ activityId: activity.id, changes });
  });
  return updates;
}

export function createFillDownUpdates(
  activities: Activity[],
  selectedIds: Set<string>,
  field: FillDownField
): Array<{ activityId: string; changes: Partial<Activity> }> {
  const selected = activities.filter((activity) => selectedIds.has(activity.id));
  if (selected.length < 2) return [];
  const value = selected[0][field];
  return selected.slice(1).map((activity) => ({ activityId: activity.id, changes: { [field]: value } as Partial<Activity> }));
}

export function activityStatus(calculated?: CalculatedActivity): 'critical' | 'near-critical' | 'available-float' | 'uncalculated' {
  if (!calculated) return 'uncalculated';
  if (calculated.isCritical) return 'critical';
  if (calculated.isNearCritical) return 'near-critical';
  return 'available-float';
}

function assignClipboardValue(changes: Partial<Activity>, key: ActivityColumnKey, raw: string, existing: Activity): void {
  switch (key) {
    case 'name': if (raw) changes.name = raw; break;
    case 'wbs': if (raw) changes.wbsId = raw; break;
    case 'calendar': if (raw) changes.calendarId = raw; break;
    case 'type':
      if (raw === 'task' || raw === 'milestone' || raw === 'summary') {
        changes.type = raw;
        if (raw === 'milestone') changes.duration = 0;
      }
      break;
    case 'duration': {
      const duration = Number(raw);
      if (Number.isFinite(duration) && duration >= 0) changes.duration = existing.type === 'milestone' ? 0 : duration;
      break;
    }
    case 'deadline': changes.deadline = raw || undefined; break;
    default: break;
  }
}
