import { useState } from 'react';
import { createStandardCalendar } from '../domain/calendar/calendar';
import type { WorkCalendar } from '../domain/calendar/types';

interface CalendarPanelProps {
  calendars: WorkCalendar[];
  defaultCalendarId: string;
  onAdd: (calendar: WorkCalendar) => void;
  onUpdate: (calendarId: string, changes: Partial<WorkCalendar>) => void;
}

export function CalendarPanel({ calendars, defaultCalendarId, onAdd, onUpdate }: CalendarPanelProps) {
  const [selectedId, setSelectedId] = useState(defaultCalendarId);
  const selected = calendars.find((calendar) => calendar.id === selectedId) ?? calendars[0];
  if (!selected) return null;

  return (
    <section className="surface panel-stack" aria-labelledby="calendar-panel-title">
      <div className="surface-heading">
        <div>
          <p className="eyebrow">Working-time rules</p>
          <h2 id="calendar-panel-title">Calendars</h2>
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            const id = `CAL-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
            const calendar = createStandardCalendar(id, `Calendar ${calendars.length + 1}`, selected.timezone);
            onAdd(calendar);
            setSelectedId(id);
          }}
        >
          Add calendar
        </button>
      </div>
      <div className="form-grid">
        <label>
          Calendar
          <select value={selected.id} onChange={(event) => setSelectedId(event.target.value)}>
            {calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}
          </select>
        </label>
        <label>
          Name
          <input value={selected.name} onChange={(event) => onUpdate(selected.id, { name: event.target.value })} />
        </label>
        <label>
          Timezone
          <input value={selected.timezone} onChange={(event) => onUpdate(selected.id, { timezone: event.target.value })} />
        </label>
        <label>
          Standard minutes/day
          <input
            type="number"
            min={1}
            value={selected.standardMinutesPerDay}
            onChange={(event) => onUpdate(selected.id, { standardMinutesPerDay: Number(event.target.value) })}
          />
        </label>
        <label className="field-span-2">
          Holidays (YYYY-MM-DD, comma separated)
          <input
            value={selected.holidays.join(', ')}
            onChange={(event) => onUpdate(selected.id, {
              holidays: event.target.value.split(',').map((item) => item.trim()).filter(Boolean)
            })}
          />
        </label>
      </div>
      <div className="weekday-grid" aria-label="Weekly work pattern">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name, day) => {
          const working = (selected.week[day] ?? []).length > 0;
          return (
            <label className="weekday-card" key={name}>
              <input
                type="checkbox"
                checked={working}
                onChange={(event) => onUpdate(selected.id, {
                  week: {
                    ...selected.week,
                    [day]: event.target.checked
                      ? [{ startMinute: 480, endMinute: 720 }, { startMinute: 780, endMinute: 1020 }]
                      : []
                  }
                })}
              />
              <span>{name}</span>
              <small>{working ? '08:00–12:00 / 13:00–17:00' : 'Non-working'}</small>
            </label>
          );
        })}
      </div>
    </section>
  );
}
