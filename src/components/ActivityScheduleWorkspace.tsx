import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectRecord, SavedView } from '../domain/project/types';
import type { Activity, ScheduleResult } from '../domain/schedule/types';
import {
  ACTIVITY_COLUMNS,
  DEFAULT_ACTIVITY_COLUMN_KEYS,
  createFillDownUpdates,
  normalizeActivityColumnKeys,
  type ActivityColumnKey,
  type ActivitySortKey,
  type FillDownField
} from '../domain/ui/activityWorkspace';
import { ActivityGrid } from './ActivityGrid';
import { ActivityInspector } from './ActivityInspector';
import { ProfessionalGantt } from './ProfessionalGantt';

interface ActivityScheduleWorkspaceProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  selectedIds: Set<string>;
  selectedActivity?: Activity;
  query: string;
  sortBy: ActivitySortKey;
  sortDirection: 'asc' | 'desc';
  onQueryChange: (query: string) => void;
  onSortByChange: (sortBy: ActivitySortKey) => void;
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
  onToggle: (activityId: string) => void;
  onSelectOnly: (activityId: string) => void;
  onUpdate: (activityId: string, changes: Partial<Activity>) => void;
  onReplace: (project: ProjectRecord) => void;
}

type WorkspaceMode = 'split' | 'table' | 'gantt';

export function ActivityScheduleWorkspace({
  project,
  result,
  selectedIds,
  selectedActivity,
  query,
  sortBy,
  sortDirection,
  onQueryChange,
  onSortByChange,
  onSortDirectionChange,
  onToggle,
  onSelectOnly,
  onUpdate,
  onReplace
}: ActivityScheduleWorkspaceProps) {
  const storagePrefix = `cpm.activity-workspace.${project.id}`;
  const [mode, setMode] = useState<WorkspaceMode>(() => readStorage(`${storagePrefix}.mode`, 'split'));
  const [visibleColumns, setVisibleColumns] = useState<ActivityColumnKey[]>(() => normalizeActivityColumnKeys(readJsonStorage(`${storagePrefix}.columns`)));
  const [columnWidths, setColumnWidths] = useState<Partial<Record<ActivityColumnKey, number>>>(() => readJsonStorage(`${storagePrefix}.widths`) ?? {});
  const [splitPercent, setSplitPercent] = useState(() => Number(readStorage(`${storagePrefix}.split`, '52')) || 52);
  const [inspectorWidth, setInspectorWidth] = useState(() => Number(readStorage(`${storagePrefix}.inspector`, '330')) || 330);
  const [inspectorOpen, setInspectorOpen] = useState(() => readStorage(`${storagePrefix}.inspector-open`, 'true') !== 'false');
  const [fillField, setFillField] = useState<FillDownField>('duration');
  const [viewName, setViewName] = useState('');
  const [mobileEditId, setMobileEditId] = useState<string>();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const viewDialogRef = useRef<HTMLDialogElement | null>(null);
  const mobileDialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => { writeStorage(`${storagePrefix}.mode`, mode); }, [mode, storagePrefix]);
  useEffect(() => { writeStorage(`${storagePrefix}.columns`, JSON.stringify(visibleColumns)); }, [storagePrefix, visibleColumns]);
  useEffect(() => { writeStorage(`${storagePrefix}.widths`, JSON.stringify(columnWidths)); }, [columnWidths, storagePrefix]);
  useEffect(() => { writeStorage(`${storagePrefix}.split`, String(splitPercent)); }, [splitPercent, storagePrefix]);
  useEffect(() => { writeStorage(`${storagePrefix}.inspector`, String(inspectorWidth)); }, [inspectorWidth, storagePrefix]);
  useEffect(() => { writeStorage(`${storagePrefix}.inspector-open`, String(inspectorOpen)); }, [inspectorOpen, storagePrefix]);
  useEffect(() => {
    if (!mobileEditId) return;
    const dialog = mobileDialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [mobileEditId]);

  const mobileActivity = useMemo(() => project.activities.find((activity) => activity.id === mobileEditId), [mobileEditId, project.activities]);
  const calculatedById = useMemo(() => new Map(result?.activities.map((activity) => [activity.id, activity]) ?? []), [result]);
  const wbsById = useMemo(() => new Map(project.wbs.map((node) => [node.id, node])), [project.wbs]);

  function toggleColumn(key: ActivityColumnKey): void {
    if (key === 'select' || key === 'id' || key === 'name') return;
    setVisibleColumns((current) => normalizeActivityColumnKeys(current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  function saveView(): void {
    const name = viewName.trim();
    if (!name) return;
    const nextView: SavedView = { id: crypto.randomUUID(), name, query, sortBy, sortDirection };
    onReplace({ ...project, savedViews: [...project.savedViews.filter((view) => view.name.toLowerCase() !== name.toLowerCase()), nextView] });
    setViewName('');
    viewDialogRef.current?.close();
  }

  function applySavedView(viewId: string): void {
    const view = project.savedViews.find((item) => item.id === viewId);
    if (!view) return;
    onQueryChange(view.query);
    onSortByChange(view.sortBy);
    onSortDirectionChange(view.sortDirection);
  }

  function deleteSavedView(viewId: string): void {
    onReplace({ ...project, savedViews: project.savedViews.filter((view) => view.id !== viewId) });
  }

  function fillDown(): void {
    for (const update of createFillDownUpdates(project.activities, selectedIds, fillField)) onUpdate(update.activityId, update.changes);
  }

  function beginSplitResize(event: React.PointerEvent<HTMLButtonElement>): void {
    event.preventDefault();
    const container = workspaceRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    const move = (moveEvent: PointerEvent) => setSplitPercent(Math.max(28, Math.min(72, (moveEvent.clientX - bounds.left) / bounds.width * 100)));
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
  }

  function beginInspectorResize(event: React.PointerEvent<HTMLButtonElement>): void {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = inspectorWidth;
    const move = (moveEvent: PointerEvent) => setInspectorWidth(Math.max(280, Math.min(520, startWidth + startX - moveEvent.clientX)));
    const finish = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
  }

  return (
    <section className="professional-schedule-surface" aria-labelledby="activity-workspace-title">
      <div className="schedule-workspace-commandbar">
        <div>
          <p className="eyebrow">Phase F · professional schedule workspace</p>
          <h2 id="activity-workspace-title">Activity grid and synchronized Gantt</h2>
        </div>
        <div className="toolbar-group wrap schedule-view-controls">
          <div className="segmented-control" aria-label="Schedule workspace mode">
            {(['split', 'table', 'gantt'] as WorkspaceMode[]).map((item) => <button key={item} type="button" className={mode === item ? 'active' : ''} onClick={() => setMode(item)} aria-pressed={mode === item}>{item === 'split' ? 'Split' : item === 'table' ? 'Table' : 'Gantt'}</button>)}
          </div>
          <label>Saved view<select aria-label="Saved activity view" defaultValue="" onChange={(event) => { applySavedView(event.target.value); event.currentTarget.value = ''; }}><option value="">Choose view…</option>{project.savedViews.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}</select></label>
          <button className="button button-small" type="button" onClick={() => viewDialogRef.current?.showModal()}>Save view</button>
          <button className="button button-small" type="button" onClick={() => setInspectorOpen((current) => !current)} aria-pressed={inspectorOpen}>{inspectorOpen ? 'Hide inspector' : 'Show inspector'}</button>
        </div>
      </div>

      <div className="activity-workspace-tools">
        <label className="activity-search">Search<input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="ID, name, WBS, code, or notes" /></label>
        <label>Sort<select value={sortBy} onChange={(event) => onSortByChange(event.target.value as ActivitySortKey)}><option value="id">ID</option><option value="name">Name</option><option value="duration">Duration</option><option value="wbs">WBS</option></select></label>
        <button className="button button-small" type="button" onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}>{sortDirection === 'asc' ? 'Ascending' : 'Descending'}</button>
        <details className="column-manager">
          <summary>Columns ({visibleColumns.length})</summary>
          <div className="column-manager-popover">
            {ACTIVITY_COLUMNS.map((column) => <label key={column.key}><input type="checkbox" checked={visibleColumns.includes(column.key)} disabled={column.key === 'select' || column.key === 'id' || column.key === 'name'} onChange={() => toggleColumn(column.key)} />{column.label}</label>)}
            <button className="button button-small" type="button" onClick={() => { setVisibleColumns([...DEFAULT_ACTIVITY_COLUMN_KEYS]); setColumnWidths({}); }}>Reset columns</button>
          </div>
        </details>
        <label>Fill field<select value={fillField} onChange={(event) => setFillField(event.target.value as FillDownField)}><option value="duration">Duration</option><option value="name">Name</option><option value="wbsId">WBS</option><option value="calendarId">Calendar</option><option value="type">Type</option><option value="deadline">Deadline</option></select></label>
        <button className="button button-secondary" type="button" disabled={selectedIds.size < 2} onClick={fillDown}>Fill down {selectedIds.size > 1 ? selectedIds.size - 1 : ''}</button>
      </div>

      <div
        ref={workspaceRef}
        className={`professional-schedule-workspace mode-${mode} ${inspectorOpen ? 'inspector-open' : ''}`}
        style={{ '--schedule-split': `${splitPercent}%`, '--schedule-inspector-width': `${inspectorWidth}px` } as React.CSSProperties}
      >
        <div className="schedule-table-pane">
          <ActivityGrid
            activities={project.activities}
            calculatedActivities={result?.activities ?? []}
            wbs={project.wbs}
            calendars={project.calendars}
            progress={project.progress}
            selectedIds={selectedIds}
            query={query}
            sortBy={sortBy}
            sortDirection={sortDirection}
            visibleColumns={visibleColumns}
            columnWidths={columnWidths}
            onColumnResize={(key, width) => setColumnWidths((current) => ({ ...current, [key]: Math.round(width) }))}
            onToggle={onToggle}
            onUpdate={onUpdate}
          />
        </div>
        {mode === 'split' ? <button className="schedule-split-divider" type="button" aria-label="Resize activity table and Gantt" onPointerDown={beginSplitResize}><span /></button> : null}
        <div className="schedule-gantt-pane"><ProfessionalGantt project={project} result={result} selectedIds={selectedIds} onSelect={onSelectOnly} /></div>
        {inspectorOpen ? <div className="schedule-inspector-pane"><button className="inspector-resize-handle" type="button" aria-label="Resize activity inspector" onPointerDown={beginInspectorResize} /><ActivityInspector activity={selectedActivity} onUpdate={onUpdate} /></div> : null}
      </div>

      <div className="mobile-activity-list" aria-label="Mobile activity list">
        {project.activities.map((activity) => {
          const calculated = calculatedById.get(activity.id);
          const percent = project.progress[activity.id]?.percentComplete ?? 0;
          return <article className={calculated?.isCritical ? 'mobile-activity-card critical' : 'mobile-activity-card'} key={activity.id}>
            <button type="button" onClick={() => { onSelectOnly(activity.id); setMobileEditId(activity.id); }}>
              <span><strong>{activity.id}</strong><small>{wbsById.get(activity.wbsId)?.code ?? 'No WBS'}</small></span>
              <b>{activity.name}</b>
              <dl><div><dt>Finish</dt><dd>{calculated?.earlyFinishDate ?? '—'}</dd></div><div><dt>Duration</dt><dd>{activity.duration}d</dd></div><div><dt>Float</dt><dd>{calculated?.totalFloat ?? '—'}</dd></div><div><dt>Progress</dt><dd>{percent}%</dd></div></dl>
              <span className={`pill ${calculated?.isCritical ? 'pill-critical' : calculated?.isNearCritical ? 'pill-warning' : ''}`}>{calculated?.isCritical ? 'Critical' : calculated?.isNearCritical ? 'Near critical' : 'Available float'}</span>
            </button>
          </article>;
        })}
      </div>

      {project.savedViews.length > 0 ? <div className="saved-view-strip" aria-label="Saved activity views">{project.savedViews.map((view) => <span key={view.id}><button type="button" onClick={() => applySavedView(view.id)}>{view.name}</button><button type="button" aria-label={`Delete saved view ${view.name}`} onClick={() => deleteSavedView(view.id)}>×</button></span>)}</div> : null}

      <dialog className="project-action-dialog" ref={viewDialogRef} aria-labelledby="save-view-title">
        <form method="dialog" onSubmit={(event) => { event.preventDefault(); saveView(); }}>
          <div className="dialog-heading"><div><p className="eyebrow">Reusable activity view</p><h2 id="save-view-title">Save current filter and sort</h2><p>The view is stored with the project. Personal column widths and visibility remain device-local.</p></div><button className="icon-button" type="button" onClick={() => viewDialogRef.current?.close()} aria-label="Close dialog">×</button></div>
          <label className="dialog-field">View name<input autoFocus value={viewName} onChange={(event) => setViewName(event.target.value)} /></label>
          <div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => viewDialogRef.current?.close()}>Cancel</button><button className="button button-primary" type="submit">Save view</button></div>
        </form>
      </dialog>

      <dialog className="mobile-activity-editor" ref={mobileDialogRef} aria-labelledby="mobile-activity-editor-title" onClose={() => setMobileEditId(undefined)}>
        <div className="mobile-sheet-header"><div><p className="eyebrow">Activity editor</p><h2 id="mobile-activity-editor-title">{mobileActivity?.id ?? 'Activity'}</h2></div><button className="icon-button" type="button" onClick={() => mobileDialogRef.current?.close()} aria-label="Close activity editor">×</button></div>
        {mobileActivity ? <><div className="mobile-activity-core-fields"><label>Name<input value={mobileActivity.name} onChange={(event) => onUpdate(mobileActivity.id, { name: event.target.value })} /></label><label>Duration<input type="number" min={0} step={0.25} value={mobileActivity.duration} onChange={(event) => onUpdate(mobileActivity.id, { duration: Number(event.target.value) })} /></label><label>WBS<select value={mobileActivity.wbsId} onChange={(event) => onUpdate(mobileActivity.id, { wbsId: event.target.value })}>{project.wbs.map((node) => <option key={node.id} value={node.id}>{node.code} — {node.name}</option>)}</select></label></div><ActivityInspector activity={mobileActivity} onUpdate={onUpdate} /></> : null}
        <div className="mobile-sheet-actions"><button className="button button-primary" type="button" onClick={() => mobileDialogRef.current?.close()}>Done</button></div>
      </dialog>
    </section>
  );
}

function readStorage(key: string, fallback: string): any {
  try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function readJsonStorage<T>(key: string): T | undefined {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : undefined;
  } catch { return undefined; }
}

function writeStorage(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* Device storage may be unavailable; workspace remains usable in memory. */ }
}
