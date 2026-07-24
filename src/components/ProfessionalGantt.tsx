import { useMemo, useState } from 'react';
import { dateToOrdinal } from '../domain/calendar/calendar';
import type { ProjectRecord } from '../domain/project/types';
import type { CalculatedActivity, ScheduleResult } from '../domain/schedule/types';

interface ProfessionalGanttProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  selectedIds: Set<string>;
  onSelect: (activityId: string) => void;
}

const ROW_HEIGHT = 34;
const LABEL_WIDTH = 260;

export function ProfessionalGantt({ project, result, selectedIds, onSelect }: ProfessionalGanttProps) {
  const [pixelsPerDay, setPixelsPerDay] = useState(28);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showFloat, setShowFloat] = useState(true);
  const activeBaseline = project.baselines.find((baseline) => baseline.id === project.activeBaselineId);
  const baselineById = useMemo(() => new Map(activeBaseline?.activities.map((activity) => [activity.activityId, activity]) ?? []), [activeBaseline]);
  const rows = useMemo(() => [...(result?.activities ?? [])].sort((left, right) => left.earlyStartOffsetDays - right.earlyStartOffsetDays || left.id.localeCompare(right.id)), [result]);
  const startOrdinal = useMemo(() => {
    const dates = rows.map((activity) => dateToOrdinal(activity.earlyStart.date));
    if (activeBaseline) dates.push(...activeBaseline.activities.map((activity) => dateToOrdinal(activity.plannedStart.slice(0, 10))));
    return dates.length > 0 ? Math.min(...dates) : dateToOrdinal(project.metadata.startDate);
  }, [activeBaseline, project.metadata.startDate, rows]);
  const finishOrdinal = useMemo(() => {
    const dates = rows.map((activity) => dateToOrdinal(activity.lateFinish.date));
    if (activeBaseline) dates.push(...activeBaseline.activities.map((activity) => dateToOrdinal(activity.plannedFinish.slice(0, 10))));
    return dates.length > 0 ? Math.max(...dates) : startOrdinal + 1;
  }, [activeBaseline, rows, startOrdinal]);
  const timelineDays = Math.max(1, finishOrdinal - startOrdinal + 2);
  const width = LABEL_WIDTH + timelineDays * pixelsPerDay + 40;
  const height = 46 + rows.length * ROW_HEIGHT;
  const statusX = LABEL_WIDTH + (dateToOrdinal(project.statusDate) - startOrdinal) * pixelsPerDay;

  return (
    <section className="surface phase-surface" aria-labelledby="gantt-title">
      <div className="surface-heading phase-toolbar">
        <div><p className="eyebrow">Synchronized schedule visualization</p><h2 id="gantt-title">Professional Gantt</h2></div>
        <div className="toolbar-group wrap">
          <label>Zoom <input type="range" min={16} max={60} value={pixelsPerDay} onChange={(event) => setPixelsPerDay(Number(event.target.value))} /></label>
          <label><input type="checkbox" checked={showBaseline} onChange={(event) => setShowBaseline(event.target.checked)} /> Baseline</label>
          <label><input type="checkbox" checked={showFloat} onChange={(event) => setShowFloat(event.target.checked)} /> Float</label>
        </div>
      </div>
      {!result ? <div className="empty-state">A valid schedule calculation is required.</div> : (
        <div className="gantt-scroll" tabIndex={0} aria-label="Scrollable Gantt chart">
          <svg width={width} height={height} role="img" aria-labelledby="gantt-title gantt-description">
            <desc id="gantt-description">Calendar-day Gantt with planned bars, baseline bars, progress, float, milestones, deadlines, and status date.</desc>
            <rect width={width} height={height} className="gantt-background" />
            {Array.from({ length: timelineDays }, (_, day) => {
              const x = LABEL_WIDTH + day * pixelsPerDay;
              return <g key={day}><line x1={x} y1={28} x2={x} y2={height} className="gantt-grid-line" />{day % Math.max(1, Math.round(84 / pixelsPerDay)) === 0 ? <text x={x + 3} y={20} className="gantt-axis-label">D+{day}</text> : null}</g>;
            })}
            <line x1={statusX} y1={28} x2={statusX} y2={height} className="gantt-status-line" />
            <text x={statusX + 4} y={42} className="gantt-status-label">Status {project.statusDate}</text>
            {rows.map((activity, index) => (
              <GanttRow
                key={activity.id}
                activity={activity}
                baseline={baselineById.get(activity.id)}
                progressPercent={project.progress[activity.id]?.percentComplete ?? 0}
                selected={selectedIds.has(activity.id)}
                startOrdinal={startOrdinal}
                pixelsPerDay={pixelsPerDay}
                y={46 + index * ROW_HEIGHT}
                showBaseline={showBaseline}
                showFloat={showFloat}
                onSelect={() => onSelect(activity.id)}
              />
            ))}
          </svg>
        </div>
      )}
      <details className="accessible-fallback"><summary>Accessible Gantt data table</summary><table><thead><tr><th>Activity</th><th>Early start</th><th>Early finish</th><th>Late finish</th><th>Float</th><th>Baseline finish</th></tr></thead><tbody>{rows.map((activity) => <tr key={activity.id}><td>{activity.id} — {activity.name}</td><td>{activity.earlyStartDate}</td><td>{activity.earlyFinishDate}</td><td>{activity.lateFinishDate}</td><td>{activity.totalFloat}</td><td>{baselineById.get(activity.id)?.plannedFinish ?? '—'}</td></tr>)}</tbody></table></details>
    </section>
  );
}

interface GanttRowProps {
  activity: CalculatedActivity;
  baseline?: { plannedStart: string; plannedFinish: string };
  progressPercent: number;
  selected: boolean;
  startOrdinal: number;
  pixelsPerDay: number;
  y: number;
  showBaseline: boolean;
  showFloat: boolean;
  onSelect: () => void;
}

function GanttRow({ activity, baseline, progressPercent, selected, startOrdinal, pixelsPerDay, y, showBaseline, showFloat, onSelect }: GanttRowProps) {
  const start = LABEL_WIDTH + (dateToOrdinal(activity.earlyStart.date) - startOrdinal) * pixelsPerDay;
  const finish = LABEL_WIDTH + (dateToOrdinal(activity.earlyFinish.date) - startOrdinal + 1) * pixelsPerDay;
  const lateFinish = LABEL_WIDTH + (dateToOrdinal(activity.lateFinish.date) - startOrdinal + 1) * pixelsPerDay;
  const barWidth = Math.max(4, finish - start);
  const baselineStart = baseline ? LABEL_WIDTH + (dateToOrdinal(baseline.plannedStart.slice(0, 10)) - startOrdinal) * pixelsPerDay : 0;
  const baselineFinish = baseline ? LABEL_WIDTH + (dateToOrdinal(baseline.plannedFinish.slice(0, 10)) - startOrdinal + 1) * pixelsPerDay : 0;
  const deadlineX = activity.deadline ? LABEL_WIDTH + (dateToOrdinal(activity.deadline) - startOrdinal) * pixelsPerDay : undefined;
  return (
    <g className={selected ? 'gantt-row selected' : 'gantt-row'} onClick={onSelect} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(); }} aria-label={`Select ${activity.name}`}>
      <rect x={0} y={y} width={LABEL_WIDTH} height={ROW_HEIGHT} className="gantt-label-cell" />
      <text x={10} y={y + 22} className="gantt-row-label">{activity.id} · {activity.name}</text>
      <line x1={LABEL_WIDTH} y1={y + ROW_HEIGHT} x2={lateFinish + 20} y2={y + ROW_HEIGHT} className="gantt-row-line" />
      {showBaseline && baseline ? <rect x={baselineStart} y={y + 4} width={Math.max(3, baselineFinish - baselineStart)} height={6} rx={3} className="gantt-baseline-bar" /> : null}
      {activity.type === 'milestone' ? <polygon points={`${start},${y + 17} ${start + 8},${y + 9} ${start + 16},${y + 17} ${start + 8},${y + 25}`} className={activity.isCritical ? 'gantt-milestone critical' : 'gantt-milestone'} /> : <><rect x={start} y={y + 12} width={barWidth} height={14} rx={4} className={activity.isCritical ? 'gantt-bar critical' : activity.isNearCritical ? 'gantt-bar near-critical' : 'gantt-bar'} /><rect x={start} y={y + 12} width={barWidth * Math.max(0, Math.min(100, progressPercent)) / 100} height={14} rx={4} className="gantt-progress-bar" /></>}
      {showFloat && lateFinish > finish ? <line x1={finish} y1={y + 19} x2={lateFinish} y2={y + 19} className="gantt-float-line" /> : null}
      {deadlineX !== undefined ? <path d={`M ${deadlineX} ${y + 5} v 22`} className="gantt-deadline" /> : null}
    </g>
  );
}
