import { useEffect, useMemo, useState } from 'react';
import { PHILIPPINE_ACTIVITY_CATEGORIES, PHILIPPINE_ACTIVITY_DICTIONARY } from '../data/philippineActivityDictionary';
import {
  calculateActivityDuration,
  matchesActivityDictionaryEntry,
  type DurationRounding
} from '../domain/productivity/activityDictionary';
import type { ProjectRecord } from '../domain/project/types';
import type { Activity } from '../domain/schedule/types';
import { NumericInput } from './NumericInput';

interface ActivityDictionaryWorkspaceProps {
  project: ProjectRecord;
  mode: 'dictionary' | 'calculator';
  initialCode?: string;
  onChooseForCalculator: (code: string) => void;
  onAddActivity: (activity: Partial<Activity>) => void;
  onUpdateActivity: (activityId: string, changes: Partial<Activity>) => void;
}

export function ActivityDictionaryWorkspace({
  project,
  mode,
  initialCode,
  onChooseForCalculator,
  onAddActivity,
  onUpdateActivity
}: ActivityDictionaryWorkspaceProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedCode, setSelectedCode] = useState(initialCode ?? PHILIPPINE_ACTIVITY_DICTIONARY[0].code);
  const [quantity, setQuantity] = useState<number>();
  const [productivityRate, setProductivityRate] = useState<number | undefined>(PHILIPPINE_ACTIVITY_DICTIONARY[0].typicalRate);
  const [crewCount, setCrewCount] = useState<number | undefined>(1);
  const [shiftHours, setShiftHours] = useState<number | undefined>(8);
  const [efficiencyFactor, setEfficiencyFactor] = useState<number | undefined>(0.85);
  const [contingencyPercent, setContingencyPercent] = useState<number | undefined>(10);
  const [rounding, setRounding] = useState<DurationRounding>('half-day');
  const [targetActivityId, setTargetActivityId] = useState('');
  const [newWbsId, setNewWbsId] = useState(project.wbs[0]?.id ?? '');
  const [newCalendarId, setNewCalendarId] = useState(project.settings.defaultCalendarId);

  const selectedEntry = useMemo(
    () => PHILIPPINE_ACTIVITY_DICTIONARY.find((item) => item.code === selectedCode) ?? PHILIPPINE_ACTIVITY_DICTIONARY[0],
    [selectedCode]
  );

  useEffect(() => {
    if (!initialCode) return;
    const next = PHILIPPINE_ACTIVITY_DICTIONARY.find((item) => item.code === initialCode);
    if (!next) return;
    setSelectedCode(next.code);
    setProductivityRate(next.typicalRate);
  }, [initialCode]);

  const filteredEntries = useMemo(
    () => PHILIPPINE_ACTIVITY_DICTIONARY.filter((item) =>
      (category === 'all' || item.category === category) && matchesActivityDictionaryEntry(item, query)
    ),
    [category, query]
  );

  const calculationState = useMemo(() => {
    const missing = [
      [quantity, 'quantity'],
      [productivityRate, 'productivity rate'],
      [crewCount, 'parallel crews'],
      [shiftHours, 'shift hours'],
      [efficiencyFactor, 'efficiency factor'],
      [contingencyPercent, 'contingency']
    ].filter(([value]) => value === undefined).map(([, label]) => label as string);

    if (missing.length > 0) {
      return {
        result: undefined,
        message: `Enter ${missing.join(', ')} to calculate the duration.`,
        tone: 'incomplete' as const
      };
    }

    try {
      return {
        result: calculateActivityDuration({
          quantity: quantity!,
          productivityRate: productivityRate!,
          crewCount: crewCount!,
          shiftHours: shiftHours!,
          efficiencyFactor: efficiencyFactor!,
          contingencyPercent: contingencyPercent!,
          rounding
        }),
        message: undefined,
        tone: 'ready' as const
      };
    } catch (error) {
      return {
        result: undefined,
        message: error instanceof Error ? error.message : 'Unable to calculate duration.',
        tone: 'error' as const
      };
    }
  }, [quantity, productivityRate, crewCount, shiftHours, efficiencyFactor, contingencyPercent, rounding]);

  function selectEntry(code: string): void {
    const next = PHILIPPINE_ACTIVITY_DICTIONARY.find((item) => item.code === code);
    if (!next) return;
    setSelectedCode(code);
    setProductivityRate(next.typicalRate);
  }

  function productivityFields(): Record<string, string | number | boolean | null> {
    return {
      productivityDictionaryCode: selectedEntry.code,
      plannedQuantity: quantity!,
      productivityUnit: selectedEntry.unit,
      productivityRatePerCrewDay: productivityRate!,
      plannedCrewCount: crewCount!,
      plannedShiftHours: shiftHours!,
      productivityEfficiencyFactor: efficiencyFactor!,
      productivityContingencyPercent: contingencyPercent!,
      durationRounding: rounding,
      productivityBasis: 'Philippine activity dictionary baseline; verify against project-specific actuals'
    };
  }

  function addActivity(): void {
    if (!calculationState.result) return;
    onAddActivity({
      name: selectedEntry.activity,
      duration: calculationState.result.duration,
      code: selectedEntry.code,
      wbsId: newWbsId,
      calendarId: newCalendarId,
      customFields: productivityFields()
    });
  }

  function updateActivity(): void {
    if (!calculationState.result || !targetActivityId) return;
    const existing = project.activities.find((item) => item.id === targetActivityId);
    if (!existing) return;
    onUpdateActivity(targetActivityId, {
      name: selectedEntry.activity,
      duration: calculationState.result.duration,
      code: selectedEntry.code,
      customFields: { ...existing.customFields, ...productivityFields() }
    });
  }

  if (mode === 'dictionary') {
    return (
      <section className="surface activity-dictionary-surface" aria-labelledby="activity-dictionary-heading">
        <div className="surface-heading dictionary-heading">
          <div>
            <p className="eyebrow">Philippine construction planning library</p>
            <h2 id="activity-dictionary-heading">Activity dictionary</h2>
            <p className="muted dictionary-intro">
              {PHILIPPINE_ACTIVITY_DICTIONARY.length} baseline activities from permits and soil investigation through construction, commissioning, and handover.
            </p>
          </div>
          <span className="count-badge">{filteredEntries.length} shown</span>
        </div>

        <div className="dictionary-notice" role="note">
          Rates are indicative installed output per crew-day at an eight-hour shift. Calibrate them for project location, weather, access, specification, crew skill, equipment, and actual field records before contractual use.
        </div>

        <div className="dictionary-toolbar">
          <label>
            Search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Code, activity, trade, crew, equipment…"
            />
          </label>
          <label>
            Work category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {PHILIPPINE_ACTIVITY_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <div className="dictionary-table-wrap">
          <table className="dictionary-table">
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Category</th>
                <th scope="col">Activity</th>
                <th scope="col">Unit</th>
                <th scope="col">Typical</th>
                <th scope="col">Range</th>
                <th scope="col">Crew</th>
                <th scope="col">Equipment</th>
                <th scope="col">Planning assumption</th>
                <th scope="col"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((item) => (
                <tr key={item.code}>
                  <td><span className="activity-id">{item.code}</span></td>
                  <td>{item.category}</td>
                  <td><strong>{item.activity}</strong></td>
                  <td>{item.unit}</td>
                  <td>{item.typicalRate.toLocaleString('en-US')} / crew-day</td>
                  <td>{item.lowRate.toLocaleString('en-US')}–{item.highRate.toLocaleString('en-US')}</td>
                  <td>{item.crew}</td>
                  <td>{item.equipment}</td>
                  <td>{item.assumptions}</td>
                  <td>
                    <button className="button button-small" type="button" onClick={() => onChooseForCalculator(item.code)}>
                      Calculate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEntries.length === 0 ? <div className="empty-state compact">No dictionary activity matches the current filters.</div> : null}
        </div>
      </section>
    );
  }

  const assignableActivities = project.activities.filter((item) => item.type === 'task' && item.id !== 'START' && item.id !== 'FINISH');

  return (
    <div className="duration-workspace">
      <section className="surface" aria-labelledby="duration-calculator-heading">
        <div className="surface-heading">
          <div>
            <p className="eyebrow">Quantity ÷ effective production</p>
            <h2 id="duration-calculator-heading">Productivity-based duration calculator</h2>
          </div>
          <span className="engine-badge">{selectedEntry.code}</span>
        </div>

        <div className="form-grid three-columns duration-form">
          <label className="field-span-3">
            Dictionary activity
            <select value={selectedCode} onChange={(event) => selectEntry(event.target.value)}>
              {PHILIPPINE_ACTIVITY_CATEGORIES.map((group) => (
                <optgroup key={group} label={group}>
                  {PHILIPPINE_ACTIVITY_DICTIONARY.filter((item) => item.category === group).map((item) => (
                    <option key={item.code} value={item.code}>{item.code} — {item.activity}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            Quantity ({selectedEntry.unit})
            <NumericInput value={quantity} min={0.01} step="any" onValueChange={setQuantity} calculatorLabel={`quantity in ${selectedEntry.unit}`} placeholder="Enter quantity or formula" />
          </label>
          <label>
            Productivity rate ({selectedEntry.unit}/crew-day)
            <NumericInput value={productivityRate} min={0.01} step="any" onValueChange={setProductivityRate} calculatorLabel="productivity rate" />
          </label>
          <label>
            Parallel crews
            <NumericInput value={crewCount} min={0.1} step={0.1} onValueChange={setCrewCount} calculatorLabel="parallel crews" />
          </label>
          <label>
            Shift hours
            <NumericInput value={shiftHours} min={1} max={24} step={0.5} onValueChange={setShiftHours} calculatorLabel="shift hours" />
          </label>
          <label>
            Efficiency factor
            <NumericInput value={efficiencyFactor} min={0.1} max={2} step={0.05} onValueChange={setEfficiencyFactor} calculatorLabel="efficiency factor" />
          </label>
          <label>
            Contingency (%)
            <NumericInput value={contingencyPercent} min={0} step={1} onValueChange={setContingencyPercent} calculatorLabel="contingency percentage" />
          </label>
          <label>
            Schedule rounding
            <select value={rounding} onChange={(event) => setRounding(event.target.value as DurationRounding)}>
              <option value="none">Two decimal places</option>
              <option value="half-day">Round up to half-day</option>
              <option value="whole-day">Round up to whole day</option>
            </select>
          </label>
        </div>

        <div className="dictionary-entry-summary">
          <div><span>Baseline range</span><strong>{selectedEntry.lowRate.toLocaleString('en-US')}–{selectedEntry.highRate.toLocaleString('en-US')} {selectedEntry.unit}/crew-day</strong></div>
          <div><span>Typical crew</span><strong>{selectedEntry.crew}</strong></div>
          <div><span>Typical equipment</span><strong>{selectedEntry.equipment}</strong></div>
          <div><span>Assumption</span><strong>{selectedEntry.assumptions}</strong></div>
        </div>
      </section>

      <section className="surface duration-result-panel" aria-live="polite">
        <div className="surface-heading">
          <div><p className="eyebrow">Calculated result</p><h2>Recommended schedule duration</h2></div>
        </div>
        {calculationState.result ? (
          <>
            <div className="duration-metrics">
              <div><span>Effective output</span><strong>{calculationState.result.effectiveDailyOutput.toLocaleString('en-US')} {selectedEntry.unit}/day</strong></div>
              <div><span>Raw duration</span><strong>{calculationState.result.rawDuration.toLocaleString('en-US')} days</strong></div>
              <div><span>With contingency</span><strong>{calculationState.result.adjustedDuration.toLocaleString('en-US')} days</strong></div>
              <div className="duration-primary"><span>Schedule duration</span><strong>{calculationState.result.duration.toLocaleString('en-US')} days</strong></div>
            </div>
            <p className="formula-line">
              Duration = quantity ÷ [rate × crews × (shift hours ÷ 8) × efficiency], then contingency and selected rounding are applied.
            </p>
          </>
        ) : <div className={`notice ${calculationState.tone === 'error' ? 'notice-error' : ''}`} role={calculationState.tone === 'error' ? 'alert' : 'status'}>{calculationState.message}</div>}
      </section>

      <section className="workspace-grid duration-actions-grid">
        <div className="surface">
          <div className="surface-heading"><div><p className="eyebrow">Existing schedule</p><h2>Apply to an activity</h2></div></div>
          <div className="form-stack">
            <label>
              Target activity
              <select value={targetActivityId} onChange={(event) => setTargetActivityId(event.target.value)}>
                <option value="">Choose an activity…</option>
                {assignableActivities.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.name}</option>)}
              </select>
            </label>
            <button className="button button-primary" type="button" disabled={!calculationState.result || !targetActivityId} onClick={updateActivity}>
              Update activity name, code, duration, and productivity basis
            </button>
          </div>
        </div>

        <div className="surface">
          <div className="surface-heading"><div><p className="eyebrow">New schedule activity</p><h2>Add calculated activity</h2></div></div>
          <div className="form-stack">
            <label>
              WBS
              <select value={newWbsId} onChange={(event) => setNewWbsId(event.target.value)}>
                {project.wbs.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
              </select>
            </label>
            <label>
              Calendar
              <select value={newCalendarId} onChange={(event) => setNewCalendarId(event.target.value)}>
                {project.calendars.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <button className="button button-primary" type="button" disabled={!calculationState.result || !newWbsId || !newCalendarId} onClick={addActivity}>
              Add activity with calculated duration
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
