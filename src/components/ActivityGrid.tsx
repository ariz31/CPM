import { useMemo, useRef, useState } from 'react';
import type { WorkCalendar } from '../domain/calendar/types';
import type { WbsNode } from '../domain/project/types';
import type { ActivityProgress } from '../domain/progress/types';
import type { Activity, CalculatedActivity } from '../domain/schedule/types';
import {
  ACTIVITY_COLUMNS,
  DEFAULT_ACTIVITY_COLUMN_KEYS,
  activityStatus,
  buildActivityGridTemplate,
  filterAndSortActivities,
  parseClipboardUpdates,
  type ActivityColumnKey,
  type ActivitySortKey
} from '../domain/ui/activityWorkspace';
import { NumericInput } from './NumericInput';

interface ActivityGridProps {
  activities: Activity[];
  calculatedActivities: CalculatedActivity[];
  wbs: WbsNode[];
  calendars: WorkCalendar[];
  progress?: Record<string, ActivityProgress>;
  selectedIds: Set<string>;
  query: string;
  sortBy: ActivitySortKey;
  sortDirection: 'asc' | 'desc';
  visibleColumns?: ActivityColumnKey[];
  columnWidths?: Partial<Record<ActivityColumnKey, number>>;
  onColumnResize?: (key: ActivityColumnKey, width: number) => void;
  onToggle: (activityId: string) => void;
  onUpdate: (activityId: string, changes: Partial<Activity>) => void;
}

const ROW_HEIGHT = 46;
const VIEWPORT_HEIGHT = 540;
const OVERSCAN = 7;

export function ActivityGrid({
  activities,
  calculatedActivities,
  wbs,
  calendars,
  progress = {},
  selectedIds,
  query,
  sortBy,
  sortDirection,
  visibleColumns = DEFAULT_ACTIVITY_COLUMN_KEYS,
  columnWidths = {},
  onColumnResize,
  onToggle,
  onUpdate
}: ActivityGridProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [dirtyCells, setDirtyCells] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const calculatedById = useMemo(() => new Map(calculatedActivities.map((activity) => [activity.id, activity])), [calculatedActivities]);
  const wbsCodes = useMemo(() => new Map(wbs.map((node) => [node.id, node.code])), [wbs]);
  const filtered = useMemo(() => filterAndSortActivities(activities, query, sortBy, sortDirection, wbsCodes), [activities, query, sortBy, sortDirection, wbsCodes]);
  const gridTemplateColumns = buildActivityGridTemplate(visibleColumns, columnWidths);
  const definitions = useMemo(() => new Map(ACTIVITY_COLUMNS.map((column) => [column.key, column])), []);
  const pinnedOffsets = useMemo(() => {
    let offset = 0;
    const offsets = new Map<ActivityColumnKey, number>();
    for (const key of visibleColumns) {
      const definition = definitions.get(key)!;
      if (!definition.pinned) continue;
      offsets.set(key, offset);
      offset += Math.max(definition.minimumWidth, columnWidths[key] ?? definition.width);
    }
    return offsets;
  }, [columnWidths, definitions, visibleColumns]);

  const firstIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const visibleRows = filtered.slice(firstIndex, firstIndex + visibleCount);
  const topSpacer = firstIndex * ROW_HEIGHT;
  const bottomSpacer = Math.max(0, (filtered.length - firstIndex - visibleRows.length) * ROW_HEIGHT);

  function markDirty(activityId: string, key: ActivityColumnKey): void {
    const token = `${activityId}:${key}`;
    setDirtyCells((current) => new Set(current).add(token));
    window.setTimeout(() => setDirtyCells((current) => {
      const next = new Set(current);
      next.delete(token);
      return next;
    }), 1600);
  }

  function updateCell(activityId: string, key: ActivityColumnKey, changes: Partial<Activity>): void {
    markDirty(activityId, key);
    onUpdate(activityId, changes);
  }

  function focusCell(rowIndex: number, columnIndex: number): void {
    const row = Math.max(0, Math.min(filtered.length - 1, rowIndex));
    const column = Math.max(0, Math.min(visibleColumns.length - 1, columnIndex));
    const rowTop = row * ROW_HEIGHT;
    const container = scrollRef.current;
    if (container && (rowTop < container.scrollTop || rowTop + ROW_HEIGHT > container.scrollTop + container.clientHeight)) {
      container.scrollTop = Math.max(0, rowTop - ROW_HEIGHT * 2);
    }
    window.requestAnimationFrame(() => {
      const target = scrollRef.current?.querySelector<HTMLElement>(`[data-grid-row="${row}"][data-grid-column="${column}"] input, [data-grid-row="${row}"][data-grid-column="${column}"] select, [data-grid-row="${row}"][data-grid-column="${column}"] button, [data-grid-row="${row}"][data-grid-column="${column}"][tabindex]`);
      target?.focus();
    });
  }

  function handleGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-grid-row][data-grid-column]');
    if (!cell) return;
    const rowIndex = Number(cell.dataset.gridRow);
    const columnIndex = Number(cell.dataset.gridColumn);
    let nextRow = rowIndex;
    let nextColumn = columnIndex;
    if (event.key === 'ArrowDown' || event.key === 'Enter') nextRow += 1;
    else if (event.key === 'ArrowUp') nextRow -= 1;
    else if (event.key === 'ArrowRight' && !(event.target instanceof HTMLInputElement && event.target.type === 'text')) nextColumn += 1;
    else if (event.key === 'ArrowLeft' && !(event.target instanceof HTMLInputElement && event.target.type === 'text')) nextColumn -= 1;
    else if (event.key === 'Home') nextColumn = 0;
    else if (event.key === 'End') nextColumn = visibleColumns.length - 1;
    else return;
    event.preventDefault();
    focusCell(nextRow, nextColumn);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLElement>, rowIndex: number, key: ActivityColumnKey): void {
    const text = event.clipboardData.getData('text/plain');
    if (!text) return;
    const updates = parseClipboardUpdates(text, visibleColumns, key, filtered, rowIndex).map((update) => {
      const changes = { ...update.changes };
      if (changes.wbsId) changes.wbsId = wbs.find((node) => node.id === changes.wbsId || node.code === changes.wbsId)?.id ?? changes.wbsId;
      if (changes.calendarId) changes.calendarId = calendars.find((calendar) => calendar.id === changes.calendarId || calendar.name === changes.calendarId)?.id ?? changes.calendarId;
      return { ...update, changes };
    });
    if (updates.length === 0) return;
    event.preventDefault();
    for (const update of updates) {
      for (const changedKey of Object.keys(update.changes)) markDirty(update.activityId, changedKeyToColumn(changedKey));
      onUpdate(update.activityId, update.changes);
    }
  }

  function beginResize(event: React.PointerEvent<HTMLButtonElement>, key: ActivityColumnKey): void {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const definition = definitions.get(key)!;
    const startX = event.clientX;
    const startWidth = columnWidths[key] ?? definition.width;
    const move = (moveEvent: PointerEvent) => onColumnResize?.(key, Math.max(definition.minimumWidth, startWidth + moveEvent.clientX - startX));
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
  }

  return (
    <div className="activity-grid professional-activity-grid">
      <div
        ref={scrollRef}
        className="activity-grid-scroll"
        role="grid"
        aria-label="Activity schedule spreadsheet"
        aria-rowcount={filtered.length + 1}
        aria-colcount={visibleColumns.length}
        style={{ height: VIEWPORT_HEIGHT, '--activity-grid-template': gridTemplateColumns } as React.CSSProperties}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        onKeyDown={handleGridKeyDown}
        tabIndex={0}
      >
        <div className="activity-grid-header" role="row" style={{ gridTemplateColumns }}>
          {visibleColumns.map((key, columnIndex) => {
            const definition = definitions.get(key)!;
            return <span
              role="columnheader"
              aria-colindex={columnIndex + 1}
              aria-label={definition.label}
              className={definition.pinned ? 'activity-grid-pinned activity-grid-header-pinned' : undefined}
              style={definition.pinned ? { left: pinnedOffsets.get(key) } : undefined}
              key={key}
            >
              <span>{definition.label}</span>
              {key !== 'select' ? <button className="column-resize-handle" type="button" onPointerDown={(resizeEvent) => beginResize(resizeEvent, key)} aria-label={`Resize ${definition.label} column`} /> : null}
            </span>;
          })}
        </div>
        <div role="presentation" style={{ height: topSpacer }} aria-hidden="true" />
        {visibleRows.map((activity, visibleIndex) => {
          const calculated = calculatedById.get(activity.id);
          const absoluteIndex = firstIndex + visibleIndex;
          const status = activityStatus(calculated);
          return (
            <div
              className={`activity-grid-row ${calculated?.isCritical ? 'critical-row' : ''} ${selectedIds.has(activity.id) ? 'selected-row' : ''}`}
              role="row"
              aria-rowindex={absoluteIndex + 2}
              key={activity.id}
              style={{ height: ROW_HEIGHT, gridTemplateColumns }}
            >
              {visibleColumns.map((key, columnIndex) => {
                const definition = definitions.get(key)!;
                const dirty = dirtyCells.has(`${activity.id}:${key}`);
                return <span
                  role="gridcell"
                  aria-colindex={columnIndex + 1}
                  className={`${definition.pinned ? 'activity-grid-pinned' : ''} ${dirty ? 'dirty-cell' : ''} ${!definition.editable ? 'calculated-cell' : ''}`}
                  style={definition.pinned ? { left: pinnedOffsets.get(key) } : undefined}
                  data-grid-row={absoluteIndex}
                  data-grid-column={columnIndex}
                  data-grid-cell={key}
                  key={key}
                  onPaste={(pasteEvent) => handlePaste(pasteEvent, absoluteIndex, key)}
                >
                  {renderCell(key, activity, calculated, status, progress[activity.id]?.percentComplete ?? 0, selectedIds, wbs, calendars, onToggle, updateCell)}
                </span>;
              })}
            </div>
          );
        })}
        <div role="presentation" style={{ height: bottomSpacer }} aria-hidden="true" />
      </div>
      <p className="grid-summary" role="status">Showing {filtered.length} of {activities.length} activities · {visibleColumns.length} columns</p>
    </div>
  );
}

function renderCell(
  key: ActivityColumnKey,
  activity: Activity,
  calculated: CalculatedActivity | undefined,
  status: ReturnType<typeof activityStatus>,
  progressPercent: number,
  selectedIds: Set<string>,
  wbs: WbsNode[],
  calendars: WorkCalendar[],
  onToggle: (activityId: string) => void,
  update: (activityId: string, key: ActivityColumnKey, changes: Partial<Activity>) => void
): React.ReactNode {
  switch (key) {
    case 'select': return <input type="checkbox" checked={selectedIds.has(activity.id)} onChange={() => onToggle(activity.id)} aria-label={`Select ${activity.name}`} />;
    case 'id': return <input className="grid-input activity-id-input" value={activity.id} readOnly title="Activity IDs are stable after creation" aria-label={`Stable activity ID for ${activity.name}`} />;
    case 'name': return <input className="grid-input" value={activity.name} onChange={(event) => update(activity.id, key, { name: event.target.value })} aria-label={`Activity name for ${activity.id}`} />;
    case 'wbs': return <select className="grid-input" value={activity.wbsId} onChange={(event) => update(activity.id, key, { wbsId: event.target.value })} aria-label={`WBS for ${activity.id}`}>{wbs.map((node) => <option key={node.id} value={node.id}>{node.code} — {node.name}</option>)}</select>;
    case 'calendar': return <select className="grid-input" value={activity.calendarId} onChange={(event) => update(activity.id, key, { calendarId: event.target.value })} aria-label={`Calendar for ${activity.id}`}>{calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}</select>;
    case 'type': return <select className="grid-input" value={activity.type} onChange={(event) => update(activity.id, key, { type: event.target.value as Activity['type'] })} aria-label={`Type for ${activity.id}`}><option value="task">Task</option><option value="milestone">Milestone</option><option value="summary">Summary</option></select>;
    case 'duration': return <NumericInput className="grid-input duration-input" value={activity.duration} min={0} step={0.25} allowBlank={false} disabled={activity.type === 'milestone'} onValueChange={(value) => { if (value !== undefined) update(activity.id, key, { duration: value }); }} aria-label={`Duration for ${activity.id}`} calculatorLabel={`duration for ${activity.id}`} />;
    case 'earlyStart': return calculated?.earlyStartDate ?? '—';
    case 'earlyFinish': return calculated?.earlyFinishDate ?? '—';
    case 'totalFloat': return calculated?.totalFloat ?? '—';
    case 'freeFloat': return calculated?.freeFloat ?? '—';
    case 'progress': return <span className="grid-progress"><span style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} /><strong>{progressPercent}%</strong></span>;
    case 'deadline': return <input className="grid-input" type="date" value={activity.deadline ?? ''} onChange={(event) => update(activity.id, key, { deadline: event.target.value || undefined })} aria-label={`Deadline for ${activity.id}`} />;
    case 'status': return <span className={`pill ${status === 'critical' ? 'pill-critical' : status === 'near-critical' ? 'pill-warning' : status === 'uncalculated' ? 'pill-neutral' : ''}`}>{status === 'critical' ? 'Critical' : status === 'near-critical' ? 'Near critical' : status === 'uncalculated' ? 'Uncalculated' : 'Available float'}</span>;
    default: return '—';
  }
}

function changedKeyToColumn(key: string): ActivityColumnKey {
  if (key === 'wbsId') return 'wbs';
  if (key === 'calendarId') return 'calendar';
  return ACTIVITY_COLUMNS.some((column) => column.key === key) ? key as ActivityColumnKey : 'name';
}
