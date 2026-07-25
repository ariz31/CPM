import { useEffect, useMemo, useRef, useState } from 'react';
import { PHILIPPINE_ACTIVITY_CATEGORIES, PHILIPPINE_ACTIVITY_DICTIONARY } from '../data/philippineActivityDictionary';
import {
  calculateActivityDuration,
  getActivityMethodVariants,
  matchesActivityDictionaryEntry,
  type ActivityExecutionMode,
  type ActivityMethodVariant,
  type DurationRounding
} from '../domain/productivity/activityDictionary';
import type { ProjectRecord } from '../domain/project/types';
import type { Activity } from '../domain/schedule/types';
import { DataViewFrame } from './DataViewFrame';
import { NumericInput } from './NumericInput';

interface ActivityDictionaryWorkspaceProps {
  project: ProjectRecord;
  mode: 'dictionary' | 'calculator';
  initialCode?: string;
  onChooseForCalculator: (code: string) => void;
  onAddActivity: (activity: Partial<Activity>) => void;
  onAddActivities: (activities: Partial<Activity>[]) => void;
  onUpdateActivity: (activityId: string, changes: Partial<Activity>) => void;
}

const BULK_EFFICIENCY = 0.85;
const BULK_CONTINGENCY = 10;

export function ActivityDictionaryWorkspace({ project, mode, initialCode, onChooseForCalculator, onAddActivity, onAddActivities, onUpdateActivity }: ActivityDictionaryWorkspaceProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [methodFilter, setMethodFilter] = useState<'all' | ActivityExecutionMode>('all');
  const [selectedCode, setSelectedCode] = useState(initialCode ?? PHILIPPINE_ACTIVITY_DICTIONARY[0].code);
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
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
  const [bulkWbsId, setBulkWbsId] = useState(project.wbs[0]?.id ?? '');
  const [bulkCalendarId, setBulkCalendarId] = useState(project.settings.defaultCalendarId);
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number | undefined>>({});
  const [bulkMethods, setBulkMethods] = useState<Record<string, string>>({});
  const bulkDialogRef = useRef<HTMLDialogElement | null>(null);

  const selectedEntry = useMemo(() => PHILIPPINE_ACTIVITY_DICTIONARY.find((item) => item.code === selectedCode) ?? PHILIPPINE_ACTIVITY_DICTIONARY[0], [selectedCode]);
  const methodVariants = useMemo(() => getActivityMethodVariants(selectedEntry), [selectedEntry]);
  const selectedMethod = methodVariants.find((method) => method.id === selectedMethodId) ?? methodVariants[0];

  useEffect(() => {
    if (!initialCode) return;
    const next = PHILIPPINE_ACTIVITY_DICTIONARY.find((item) => item.code === initialCode);
    if (!next) return;
    const method = getActivityMethodVariants(next)[0];
    setSelectedCode(next.code);
    setSelectedMethodId(method.id);
    setProductivityRate(method.typicalRate);
  }, [initialCode]);

  useEffect(() => {
    const method = methodVariants[0];
    setSelectedMethodId(method.id);
    setProductivityRate(method.typicalRate);
  }, [methodVariants]);

  const filteredEntries = useMemo(() => PHILIPPINE_ACTIVITY_DICTIONARY.filter((item) => {
    const methodMatch = methodFilter === 'all' || getActivityMethodVariants(item).some((method) => method.executionMode === methodFilter);
    return (category === 'all' || item.category === category) && methodMatch && matchesActivityDictionaryEntry(item, query);
  }), [category, methodFilter, query]);
  const selectedEntries = useMemo(() => PHILIPPINE_ACTIVITY_DICTIONARY.filter((item) => selectedCodes.has(item.code)), [selectedCodes]);

  const calculationState = useMemo(() => {
    const missing = [[quantity, 'quantity'], [productivityRate, 'productivity rate'], [crewCount, 'parallel crews'], [shiftHours, 'shift hours'], [efficiencyFactor, 'efficiency factor'], [contingencyPercent, 'contingency']].filter(([value]) => value === undefined).map(([, label]) => label as string);
    if (missing.length) return { result: undefined, message: `Enter ${missing.join(', ')} to calculate the duration.`, tone: 'incomplete' as const };
    try { return { result: calculateActivityDuration({ quantity: quantity!, productivityRate: productivityRate!, crewCount: crewCount!, shiftHours: shiftHours!, efficiencyFactor: efficiencyFactor!, contingencyPercent: contingencyPercent!, rounding }), message: undefined, tone: 'ready' as const }; }
    catch (error) { return { result: undefined, message: error instanceof Error ? error.message : 'Unable to calculate duration.', tone: 'error' as const }; }
  }, [quantity, productivityRate, crewCount, shiftHours, efficiencyFactor, contingencyPercent, rounding]);

  function selectEntry(code: string): void {
    const next = PHILIPPINE_ACTIVITY_DICTIONARY.find((item) => item.code === code); if (!next) return;
    const method = getActivityMethodVariants(next)[0]; setSelectedCode(code); setSelectedMethodId(method.id); setProductivityRate(method.typicalRate);
  }
  function selectMethod(methodId: string): void { const method = methodVariants.find((item) => item.id === methodId); if (!method) return; setSelectedMethodId(method.id); setProductivityRate(method.typicalRate); }
  function toggleDictionarySelection(code: string): void { setSelectedCode(code); setSelectedCodes((current) => { const next = new Set(current); if (next.has(code)) next.delete(code); else next.add(code); return next; }); }
  function setAllFiltered(checked: boolean): void { setSelectedCodes((current) => { const next = new Set(current); for (const entry of filteredEntries) checked ? next.add(entry.code) : next.delete(entry.code); return next; }); }
  function openBulkAdd(): void { const quantities: Record<string, number | undefined> = {}; const methods: Record<string, string> = {}; for (const entry of selectedEntries) { quantities[entry.code] = bulkQuantities[entry.code]; methods[entry.code] = bulkMethods[entry.code] ?? getActivityMethodVariants(entry)[0].id; } setBulkQuantities(quantities); setBulkMethods(methods); bulkDialogRef.current?.showModal(); }

  const bulkPreview = useMemo(() => selectedEntries.map((entry) => {
    const variants = getActivityMethodVariants(entry);
    const method = variants.find((item) => item.id === bulkMethods[entry.code]) ?? variants[0];
    const selectedQuantity = bulkQuantities[entry.code];
    if (selectedQuantity === undefined || selectedQuantity <= 0) return { entry, method, result: undefined };
    return { entry, method, result: calculateActivityDuration({ quantity: selectedQuantity, productivityRate: method.typicalRate, crewCount: 1, shiftHours: 8, efficiencyFactor: BULK_EFFICIENCY, contingencyPercent: BULK_CONTINGENCY, rounding: 'half-day' }) };
  }), [bulkMethods, bulkQuantities, selectedEntries]);
  const canBulkAdd = bulkPreview.length > 0 && bulkPreview.every((item) => item.result) && Boolean(bulkWbsId && bulkCalendarId);

  function commitBulkAdd(): void {
    if (!canBulkAdd) return;
    onAddActivities(bulkPreview.map(({ entry, method, result }) => ({ name: entry.activity, duration: result!.duration, code: entry.code, wbsId: bulkWbsId, calendarId: bulkCalendarId, customFields: productivityFieldsFor(entry.code, entry.unit, bulkQuantities[entry.code]!, method, method.typicalRate, 1, 8, BULK_EFFICIENCY, BULK_CONTINGENCY, 'half-day') })));
    setSelectedCodes(new Set()); bulkDialogRef.current?.close();
  }
  function productivityFields(): Record<string, string | number | boolean | null> { return productivityFieldsFor(selectedEntry.code, selectedEntry.unit, quantity!, selectedMethod, productivityRate!, crewCount!, shiftHours!, efficiencyFactor!, contingencyPercent!, rounding); }
  function addActivity(): void { if (!calculationState.result) return; onAddActivity({ name: selectedEntry.activity, duration: calculationState.result.duration, code: selectedEntry.code, wbsId: newWbsId, calendarId: newCalendarId, customFields: productivityFields() }); }
  function updateActivity(): void { if (!calculationState.result || !targetActivityId) return; const existing = project.activities.find((item) => item.id === targetActivityId); if (!existing) return; onUpdateActivity(targetActivityId, { name: selectedEntry.activity, duration: calculationState.result.duration, code: selectedEntry.code, customFields: { ...existing.customFields, ...productivityFields() } }); }

  if (mode === 'dictionary') {
    const allFilteredSelected = filteredEntries.length > 0 && filteredEntries.every((entry) => selectedCodes.has(entry.code));
    return <section className="surface activity-dictionary-surface" aria-labelledby="activity-dictionary-heading">
      <div className="surface-heading dictionary-heading"><div><p className="eyebrow">Philippine construction planning library</p><h2 id="activity-dictionary-heading">Activity dictionary</h2><p className="muted dictionary-intro">Browse 244 baseline activities from permits and soil investigation through handover. Select, compare, and bulk-add activities. Excavation includes manual, mixed, and equipment methods.</p></div><span className="count-badge">{filteredEntries.length} shown</span></div>
      <div className="dictionary-notice" role="note">Rates are indicative output per crew-day. Verify site access, weather, safety, specification, crew skill, equipment, haul distance, and actual records.</div>
      <div className="dictionary-toolbar improved"><label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, activity, trade, crew, equipment…" /></label><label>Work category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{PHILIPPINE_ACTIVITY_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Execution method<select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value as typeof methodFilter)}><option value="all">All methods</option><option value="manual">Manual</option><option value="mixed">Mixed</option><option value="equipment">Equipment</option></select></label></div>
      {selectedCodes.size > 0 ? <div className="dictionary-selection-bar" role="status"><strong>{selectedCodes.size} selected</strong><span>{selectedEntries.map((entry) => entry.code).join(', ')}</span><button className="button button-primary" type="button" onClick={openBulkAdd}>Prepare selected</button><button className="button button-secondary" type="button" onClick={() => setSelectedCodes(new Set())}>Clear</button></div> : null}
      <div className="dictionary-master-detail">
        <DataViewFrame title="Activity library" eyebrow="Multiple selection" description={`${filteredEntries.length} filtered activities`} className="dictionary-list-frame"><div className="dictionary-table-wrap"><table className="dictionary-table selectable"><thead><tr><th><input type="checkbox" aria-label="Select all filtered dictionary activities" checked={allFilteredSelected} onChange={(event) => setAllFiltered(event.target.checked)} /></th><th>Code</th><th>Category</th><th>Activity</th><th>Unit</th><th>Typical</th><th>Methods</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{filteredEntries.map((item) => { const variants = getActivityMethodVariants(item); return <tr key={item.code} className={selectedCode === item.code ? 'dictionary-current-row' : ''} onClick={() => setSelectedCode(item.code)}><td><input type="checkbox" aria-label={`Select ${item.activity}`} checked={selectedCodes.has(item.code)} onClick={(event) => event.stopPropagation()} onChange={() => toggleDictionarySelection(item.code)} /></td><td><span className="activity-id">{item.code}</span></td><td>{item.category}</td><td><strong>{item.activity}</strong></td><td>{item.unit}</td><td>{item.typicalRate.toLocaleString('en-US')} / crew-day</td><td><span className="dictionary-method-chips">{variants.map((variant) => <small key={variant.id}>{variant.executionMode}</small>)}</span></td><td><button className="button button-small" type="button" onClick={(event) => { event.stopPropagation(); onChooseForCalculator(item.code); }}>Calculate</button></td></tr>; })}</tbody></table>{filteredEntries.length === 0 ? <div className="empty-state compact">No dictionary activity matches the current filters.</div> : null}</div><div className="dictionary-mobile-cards">{filteredEntries.map((item) => <article key={item.code} className={selectedCode === item.code ? 'selected' : ''}><label><input type="checkbox" checked={selectedCodes.has(item.code)} onChange={() => toggleDictionarySelection(item.code)} /><span>Select</span></label><button type="button" className="dictionary-card-main" onClick={() => setSelectedCode(item.code)}><span className="activity-id">{item.code}</span><strong>{item.activity}</strong><small>{item.category} · {item.unit}</small><span>{item.typicalRate.toLocaleString('en-US')} {item.unit}/crew-day</span><span>{getActivityMethodVariants(item).map((variant) => variant.executionMode).join(' · ')}</span></button><button className="button button-small" type="button" onClick={() => onChooseForCalculator(item.code)}>Calculate</button></article>)}</div></DataViewFrame>
        <aside className="surface dictionary-detail-panel" aria-label="Selected dictionary activity"><div className="surface-heading"><div><p className="eyebrow">Selected activity</p><h2>{selectedEntry.activity}</h2><span className="activity-reference-id">{selectedEntry.code}</span></div></div><dl><dt>Category</dt><dd>{selectedEntry.category}</dd><dt>Unit</dt><dd>{selectedEntry.unit}</dd><dt>Baseline range</dt><dd>{selectedEntry.lowRate.toLocaleString('en-US')}–{selectedEntry.highRate.toLocaleString('en-US')} / crew-day</dd></dl><h3>Available methods</h3><div className="dictionary-method-list">{getActivityMethodVariants(selectedEntry).map((method) => <article key={method.id}><span className={`method-mode ${method.executionMode}`}>{method.executionMode}</span><strong>{method.name}</strong><span>{method.typicalRate.toLocaleString('en-US')} {selectedEntry.unit}/crew-day</span><small>{method.crew}</small><small>{method.equipment}</small></article>)}</div><p className="muted">{selectedEntry.assumptions}</p><button className="button button-primary" type="button" onClick={() => onChooseForCalculator(selectedEntry.code)}>Calculate duration</button></aside>
      </div>
      <dialog className="project-action-dialog dictionary-bulk-dialog" ref={bulkDialogRef} aria-labelledby="dictionary-bulk-title"><form method="dialog" onSubmit={(event) => { event.preventDefault(); commitBulkAdd(); }}><div className="dialog-heading"><div><p className="eyebrow">Atomic schedule addition</p><h2 id="dictionary-bulk-title">Add selected activities</h2><p>Choose common placement, quantities, and an execution method for each selected activity.</p></div><button className="icon-button" type="button" onClick={() => bulkDialogRef.current?.close()} aria-label="Close bulk activity dialog">×</button></div><div className="dictionary-bulk-common"><label>WBS<select value={bulkWbsId} onChange={(event) => setBulkWbsId(event.target.value)}>{project.wbs.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label><label>Calendar<select value={bulkCalendarId} onChange={(event) => setBulkCalendarId(event.target.value)}>{project.calendars.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><div className="dictionary-bulk-list">{bulkPreview.map(({ entry, method, result }) => <article key={entry.code}><div><strong>{entry.code} — {entry.activity}</strong><small>{entry.unit}</small></div><label>Method<select value={method.id} onChange={(event) => setBulkMethods((current) => ({ ...current, [entry.code]: event.target.value }))}>{getActivityMethodVariants(entry).map((variant) => <option key={variant.id} value={variant.id}>{variant.name} · {variant.typicalRate.toLocaleString('en-US')} {entry.unit}/day</option>)}</select></label><label>Quantity<NumericInput value={bulkQuantities[entry.code]} min={0.01} step="any" commitOnChange calculatorLabel={`${entry.activity} quantity`} aria-label={`${entry.activity} quantity`} onValueChange={(value) => setBulkQuantities((current) => ({ ...current, [entry.code]: value }))} /></label><div className="bulk-duration"><span>Duration</span><strong>{result ? `${result.duration} days` : 'Enter quantity'}</strong></div></article>)}</div><p className="muted">Bulk calculations use one crew, an eight-hour shift, 85% efficiency, 10% contingency, and half-day rounding. The complete basis is stored with each activity.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => bulkDialogRef.current?.close()}>Cancel</button><button className="button button-primary" type="submit" disabled={!canBulkAdd}>Add {selectedEntries.length} activities</button></div></form></dialog>
    </section>;
  }

  const assignableActivities = project.activities.filter((item) => item.type === 'task' && item.id !== 'START' && item.id !== 'FINISH');
  const comparisonRows = methodVariants.map((method) => ({ method, result: quantity && quantity > 0 ? calculateActivityDuration({ quantity, productivityRate: method.typicalRate, crewCount: crewCount ?? 1, shiftHours: shiftHours ?? 8, efficiencyFactor: efficiencyFactor ?? 0.85, contingencyPercent: contingencyPercent ?? 10, rounding }) : undefined }));
  return <div className="duration-workspace">
    <section className="surface" aria-labelledby="duration-calculator-heading"><div className="surface-heading"><div><p className="eyebrow">Quantity ÷ effective production</p><h2 id="duration-calculator-heading">Productivity-based duration calculator</h2></div><span className="engine-badge">{selectedEntry.code}</span></div><div className="form-grid three-columns duration-form"><label className="field-span-3">Dictionary activity<select value={selectedCode} onChange={(event) => selectEntry(event.target.value)}>{PHILIPPINE_ACTIVITY_CATEGORIES.map((group) => <optgroup key={group} label={group}>{PHILIPPINE_ACTIVITY_DICTIONARY.filter((item) => item.category === group).map((item) => <option key={item.code} value={item.code}>{item.code} — {item.activity}</option>)}</optgroup>)}</select></label><label className="field-span-3">Work method and production scale<select value={selectedMethod.id} onChange={(event) => selectMethod(event.target.value)}>{methodVariants.map((method) => <option key={method.id} value={method.id}>{method.name} — {method.executionMode} — {method.typicalRate.toLocaleString('en-US')} {selectedEntry.unit}/crew-day</option>)}</select></label><label>Quantity ({selectedEntry.unit})<NumericInput value={quantity} min={0.01} step="any" onValueChange={setQuantity} calculatorLabel={`quantity in ${selectedEntry.unit}`} placeholder="Enter quantity or formula" /></label><label>Productivity rate ({selectedEntry.unit}/crew-day)<NumericInput value={productivityRate} min={0.01} step="any" onValueChange={setProductivityRate} calculatorLabel="productivity rate" /></label><label>Parallel crews<NumericInput value={crewCount} min={0.1} step={0.1} onValueChange={setCrewCount} calculatorLabel="parallel crews" /></label><label>Shift hours<NumericInput value={shiftHours} min={1} max={24} step={0.5} onValueChange={setShiftHours} calculatorLabel="shift hours" /></label><label>Efficiency factor<NumericInput value={efficiencyFactor} min={0.1} max={2} step={0.05} onValueChange={setEfficiencyFactor} calculatorLabel="efficiency factor" /></label><label>Contingency (%)<NumericInput value={contingencyPercent} min={0} step={1} onValueChange={setContingencyPercent} calculatorLabel="contingency percentage" /></label><label>Schedule rounding<select value={rounding} onChange={(event) => setRounding(event.target.value as DurationRounding)}><option value="none">Two decimal places</option><option value="half-day">Round up to half-day</option><option value="whole-day">Round up to whole day</option></select></label></div><div className="dictionary-entry-summary"><div><span>Execution mode</span><strong>{selectedMethod.executionMode}</strong></div><div><span>Baseline range</span><strong>{selectedMethod.lowRate.toLocaleString('en-US')}–{selectedMethod.highRate.toLocaleString('en-US')} {selectedEntry.unit}/crew-day</strong></div><div><span>Crew</span><strong>{selectedMethod.crew}</strong></div><div><span>Equipment</span><strong>{selectedMethod.equipment}</strong></div><div className="field-span-3"><span>Assumption</span><strong>{selectedMethod.assumptions}</strong></div></div></section>
    <section className="surface duration-result-panel" aria-live="polite"><div className="surface-heading"><div><p className="eyebrow">Calculated result</p><h2>Recommended schedule duration</h2></div></div>{calculationState.result ? <><div className="duration-metrics"><div><span>Effective output</span><strong>{calculationState.result.effectiveDailyOutput.toLocaleString('en-US')} {selectedEntry.unit}/day</strong></div><div><span>Raw duration</span><strong>{calculationState.result.rawDuration.toLocaleString('en-US')} days</strong></div><div><span>With contingency</span><strong>{calculationState.result.adjustedDuration.toLocaleString('en-US')} days</strong></div><div className="duration-primary"><span>Schedule duration</span><strong>{calculationState.result.duration.toLocaleString('en-US')} days</strong></div></div><p className="formula-line">Duration = quantity ÷ [rate × crews × (shift hours ÷ 8) × efficiency], then contingency and rounding are applied.</p></> : <div className={`notice ${calculationState.tone === 'error' ? 'notice-error' : ''}`} role={calculationState.tone === 'error' ? 'alert' : 'status'}>{calculationState.message}</div>}</section>
    {methodVariants.length > 1 ? <DataViewFrame title="Method comparison" eyebrow="Manual, mixed, and equipment options" description="The same quantity and project factors are applied to every method."><div className="method-comparison-table"><div className="method-comparison-header"><span>Method</span><span>Output</span><span>Duration</span><span>Crew and equipment</span></div>{comparisonRows.map(({ method, result }) => <button key={method.id} type="button" className={method.id === selectedMethod.id ? 'selected' : ''} onClick={() => selectMethod(method.id)}><span><strong>{method.name}</strong><small>{method.executionMode}</small></span><span>{method.typicalRate.toLocaleString('en-US')} {selectedEntry.unit}/crew-day</span><span>{result ? `${result.duration} days` : 'Enter quantity'}</span><span>{method.crew}<small>{method.equipment}</small></span></button>)}</div></DataViewFrame> : null}
    <section className="workspace-grid duration-actions-grid"><div className="surface"><div className="surface-heading"><div><p className="eyebrow">Existing schedule</p><h2>Apply to an activity</h2></div></div><div className="form-stack"><label>Target activity<select value={targetActivityId} onChange={(event) => setTargetActivityId(event.target.value)}><option value="">Choose an activity…</option>{assignableActivities.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.name}</option>)}</select></label><button className="button button-primary" type="button" disabled={!calculationState.result || !targetActivityId} onClick={updateActivity}>Update activity and productivity basis</button></div></div><div className="surface"><div className="surface-heading"><div><p className="eyebrow">New schedule activity</p><h2>Add calculated activity</h2></div></div><div className="form-stack"><label>WBS<select value={newWbsId} onChange={(event) => setNewWbsId(event.target.value)}>{project.wbs.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label><label>Calendar<select value={newCalendarId} onChange={(event) => setNewCalendarId(event.target.value)}>{project.calendars.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button className="button button-primary" type="button" disabled={!calculationState.result || !newWbsId || !newCalendarId} onClick={addActivity}>Add activity with calculated duration</button></div></div></section>
  </div>;
}

function productivityFieldsFor(dictionaryCode: string, unit: string, plannedQuantity: number, method: ActivityMethodVariant, productivityRate: number, crewCount: number, shiftHours: number, efficiencyFactor: number, contingencyPercent: number, rounding: DurationRounding): Record<string, string | number | boolean | null> {
  return { productivityDictionaryCode: dictionaryCode, productivityMethodVariantId: method.id, productivityExecutionMode: method.executionMode, plannedQuantity, productivityUnit: unit, productivityRatePerCrewDay: productivityRate, plannedCrewCount: crewCount, plannedShiftHours: shiftHours, productivityEfficiencyFactor: efficiencyFactor, productivityContingencyPercent: contingencyPercent, durationRounding: rounding, productivityCrewBasis: method.crew, productivityEquipmentBasis: method.equipment, productivityBasis: method.assumptions };
}
