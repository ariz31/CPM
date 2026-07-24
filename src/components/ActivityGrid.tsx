import { useMemo, useState } from 'react';
import type { WorkCalendar } from '../domain/calendar/types';
import type { WbsNode } from '../domain/project/types';
import type { Activity, CalculatedActivity } from '../domain/schedule/types';

interface ActivityGridProps {
  activities: Activity[];
  calculatedActivities: CalculatedActivity[];
  wbs: WbsNode[];
  calendars: WorkCalendar[];
  selectedIds: Set<string>;
  query: string;
  sortBy: 'id' | 'name' | 'duration' | 'wbs';
  sortDirection: 'asc' | 'desc';
  onToggle: (activityId: string) => void;
  onUpdate: (activityId: string, changes: Partial<Activity>) => void;
}

const ROW_HEIGHT = 48;
const VIEWPORT_HEIGHT = 480;
const OVERSCAN = 5;

export function ActivityGrid({
  activities,
  calculatedActivities,
  wbs,
  calendars,
  selectedIds,
  query,
  sortBy,
  sortDirection,
  onToggle,
  onUpdate
}: ActivityGridProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const calculatedById = useMemo(
    () => new Map(calculatedActivities.map((activity) => [activity.id, activity])),
    [calculatedActivities]
  );
  const wbsById = useMemo(() => new Map(wbs.map((node) => [node.id, node])), [wbs]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const rows = activities.filter((activity) => {
      if (!normalized) return true;
      const wbsCode = wbsById.get(activity.wbsId)?.code ?? '';
      return `${activity.id} ${activity.name} ${wbsCode} ${activity.code ?? ''}`.toLowerCase().includes(normalized);
    });
    const direction = sortDirection === 'asc' ? 1 : -1;
    return rows.sort((left, right) => {
      if (sortBy === 'duration') return (left.duration - right.duration) * direction;
      const leftValue = sortBy === 'wbs' ? wbsById.get(left.wbsId)?.code ?? '' : left[sortBy];
      const rightValue = sortBy === 'wbs' ? wbsById.get(right.wbsId)?.code ?? '' : right[sortBy];
      return String(leftValue).localeCompare(String(rightValue)) * direction;
    });
  }, [activities, query, sortBy, sortDirection, wbsById]);

  const firstIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const visibleRows = filtered.slice(firstIndex, firstIndex + visibleCount);
  const topSpacer = firstIndex * ROW_HEIGHT;
  const bottomSpacer = Math.max(0, (filtered.length - firstIndex - visibleRows.length) * ROW_HEIGHT);

  return (
    <div
      className="activity-grid"
      role="grid"
      aria-label="Activity schedule"
      aria-rowcount={filtered.length + 1}
      aria-colcount={10}
    >
      <div className="activity-grid-header" role="row">
        <span role="columnheader" aria-label="Select" />
        <span role="columnheader">ID</span>
        <span role="columnheader">Activity</span>
        <span role="columnheader">WBS</span>
        <span role="columnheader">Calendar</span>
        <span role="columnheader">Type</span>
        <span role="columnheader">Duration</span>
        <span role="columnheader">Early finish</span>
        <span role="columnheader">Float</span>
        <span role="columnheader">Status</span>
      </div>
      <div
        className="activity-grid-scroll"
        style={{ height: VIEWPORT_HEIGHT }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        tabIndex={0}
      >
        <div style={{ height: topSpacer }} aria-hidden="true" />
        {visibleRows.map((activity, visibleIndex) => {
          const calculated = calculatedById.get(activity.id);
          const rowIndex = firstIndex + visibleIndex + 2;
          return (
            <div
              className={`activity-grid-row ${calculated?.isCritical ? 'critical-row' : ''} ${selectedIds.has(activity.id) ? 'selected-row' : ''}`}
              role="row"
              aria-rowindex={rowIndex}
              key={activity.id}
              style={{ height: ROW_HEIGHT }}
            >
              <span role="gridcell">
                <input
                  type="checkbox"
                  checked={selectedIds.has(activity.id)}
                  onChange={() => onToggle(activity.id)}
                  aria-label={`Select ${activity.name}`}
                />
              </span>
              <span role="gridcell">
                <input
                  className="grid-input activity-id-input"
                  value={activity.id}
                  readOnly
                  title="Activity IDs are stable after creation"
                  aria-label={`Stable activity ID for ${activity.name}`}
                />
              </span>
              <span role="gridcell">
                <input
                  className="grid-input"
                  value={activity.name}
                  onChange={(event) => onUpdate(activity.id, { name: event.target.value })}
                  aria-label={`Activity name for ${activity.id}`}
                />
              </span>
              <span role="gridcell">
                <select
                  className="grid-input"
                  value={activity.wbsId}
                  onChange={(event) => onUpdate(activity.id, { wbsId: event.target.value })}
                  aria-label={`WBS for ${activity.id}`}
                >
                  {wbs.map((node) => <option key={node.id} value={node.id}>{node.code}</option>)}
                </select>
              </span>
              <span role="gridcell">
                <select
                  className="grid-input"
                  value={activity.calendarId}
                  onChange={(event) => onUpdate(activity.id, { calendarId: event.target.value })}
                  aria-label={`Calendar for ${activity.id}`}
                >
                  {calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}
                </select>
              </span>
              <span role="gridcell">
                <select
                  className="grid-input"
                  value={activity.type}
                  onChange={(event) => onUpdate(activity.id, { type: event.target.value as Activity['type'] })}
                  aria-label={`Type for ${activity.id}`}
                >
                  <option value="task">Task</option>
                  <option value="milestone">Milestone</option>
                  <option value="summary">Summary</option>
                </select>
              </span>
              <span role="gridcell">
                <input
                  className="grid-input duration-input"
                  type="number"
                  min={0}
                  step={0.25}
                  value={activity.duration}
                  disabled={activity.type === 'milestone'}
                  onChange={(event) => onUpdate(activity.id, { duration: Number(event.target.value) })}
                  aria-label={`Duration for ${activity.id}`}
                />
              </span>
              <span role="gridcell" className="calculated-cell">{calculated?.earlyFinishDate ?? '—'}</span>
              <span role="gridcell" className="calculated-cell">{calculated?.totalFloat ?? '—'}</span>
              <span role="gridcell">
                <span className={`pill ${calculated?.isCritical ? 'pill-critical' : calculated?.isNearCritical ? 'pill-warning' : ''}`}>
                  {calculated?.isCritical ? 'Critical' : calculated?.isNearCritical ? 'Near critical' : 'Available float'}
                </span>
              </span>
            </div>
          );
        })}
        <div style={{ height: bottomSpacer }} aria-hidden="true" />
      </div>
      <p className="grid-summary" role="status">Showing {filtered.length} of {activities.length} activities</p>
    </div>
  );
}
