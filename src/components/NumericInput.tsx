import { useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { evaluateNumericExpression, formatNumericResult } from '../domain/number/numericExpression';

type NativeNumericProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step'>;

export interface NumericInputProps extends NativeNumericProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  allowBlank?: boolean;
  calculator?: boolean;
  calculatorLabel?: string;
  commitOnChange?: boolean;
}

const STANDARD_KEYS = [
  { label: 'Clear', display: 'C', action: 'clear', className: 'utility' },
  { label: 'Change sign', display: '±', action: 'sign', className: 'utility' },
  { label: 'Percent', display: '%', value: '%', className: 'utility' },
  { label: 'Divide', display: '÷', value: '÷', className: 'operator' },
  { label: '7', display: '7', value: '7' }, { label: '8', display: '8', value: '8' }, { label: '9', display: '9', value: '9' }, { label: 'Multiply', display: '×', value: '×', className: 'operator' },
  { label: '4', display: '4', value: '4' }, { label: '5', display: '5', value: '5' }, { label: '6', display: '6', value: '6' }, { label: 'Subtract', display: '−', value: '−', className: 'operator' },
  { label: '1', display: '1', value: '1' }, { label: '2', display: '2', value: '2' }, { label: '3', display: '3', value: '3' }, { label: 'Add', display: '+', value: '+', className: 'operator' },
  { label: '0', display: '0', value: '0', className: 'zero' }, { label: 'Decimal point', display: '.', value: '.' }, { label: 'Equals', display: '=', action: 'equals', className: 'equals' }
] as const;

export function NumericInput({ value, onValueChange, min, max, step: _step, allowBlank = true, calculator = true, calculatorLabel, commitOnChange = false, disabled, className, onBlur, onFocus, onKeyDown, 'aria-describedby': ariaDescribedBy, ...inputProps }: NumericInputProps) {
  const [draft, setDraft] = useState(value === undefined ? '' : formatNumericResult(value));
  const [error, setError] = useState<string>();
  const [calculatorExpression, setCalculatorExpression] = useState('');
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const calculatorInputRef = useRef<HTMLInputElement | null>(null);
  const focusedRef = useRef(false);
  const lastCommittedRef = useRef<number | undefined>(value);
  const errorId = useId();
  const accessibleLabel = calculatorLabel ?? inputProps['aria-label']?.toString() ?? 'numeric value';

  useEffect(() => {
    if (focusedRef.current || Object.is(value, lastCommittedRef.current)) return;
    setDraft(value === undefined ? '' : formatNumericResult(value));
    lastCommittedRef.current = value;
    setError(undefined);
  }, [value]);

  const calculatorPreview = useMemo(() => {
    try {
      const result = evaluateNumericExpression(calculatorExpression);
      const validationError = validateBounds(result, min, max);
      return validationError ? { result: undefined, error: validationError } : { result, error: undefined };
    } catch (previewError) {
      return { result: undefined, error: calculatorExpression.trim() ? previewError instanceof Error ? previewError.message : 'Invalid calculation.' : undefined };
    }
  }, [calculatorExpression, min, max]);

  function notifyValidDraft(nextDraft: string): void {
    if (!commitOnChange) return;
    const trimmed = nextDraft.trim();
    if (!trimmed) {
      if (allowBlank && lastCommittedRef.current !== undefined) {
        lastCommittedRef.current = undefined;
        onValueChange(undefined);
      }
      return;
    }
    try {
      const nextValue = evaluateNumericExpression(trimmed);
      if (validateBounds(nextValue, min, max) || Object.is(nextValue, lastCommittedRef.current)) return;
      lastCommittedRef.current = nextValue;
      onValueChange(nextValue);
    } catch {
      // Partial expressions remain editable and are validated on commit.
    }
  }

  function commitDraft(): boolean {
    const trimmed = draft.trim();
    if (!trimmed) {
      if (!allowBlank) { setError('A value is required.'); return false; }
      lastCommittedRef.current = undefined; setError(undefined); onValueChange(undefined); return true;
    }
    try {
      const nextValue = evaluateNumericExpression(trimmed);
      const validationError = validateBounds(nextValue, min, max);
      if (validationError) { setError(validationError); return false; }
      const formatted = formatNumericResult(nextValue);
      setDraft(formatted); setError(undefined); lastCommittedRef.current = nextValue; onValueChange(nextValue); return true;
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'Enter a valid number or calculation.'); return false;
    }
  }

  function resetDraft(): void { setDraft(value === undefined ? '' : formatNumericResult(value)); lastCommittedRef.current = value; setError(undefined); }
  function openCalculator(): void { setCalculatorExpression(draft); dialogRef.current?.showModal(); window.requestAnimationFrame(() => calculatorInputRef.current?.focus()); }
  function useCalculatorResult(): void { if (calculatorPreview.result === undefined) return; const formatted = formatNumericResult(calculatorPreview.result); setDraft(formatted); setError(undefined); lastCommittedRef.current = calculatorPreview.result; onValueChange(calculatorPreview.result); dialogRef.current?.close(); }
  function appendCalculatorValue(next: string): void { setCalculatorExpression((current) => `${current}${next}`); }
  function changeSign(): void { setCalculatorExpression((current) => { const trimmed = current.trim(); if (!trimmed) return '-'; try { return formatNumericResult(-evaluateNumericExpression(trimmed)); } catch { return `-(${trimmed})`; } }); }
  function evaluateInCalculator(): void { if (calculatorPreview.result !== undefined) setCalculatorExpression(formatNumericResult(calculatorPreview.result)); }

  const calculatorDialog = typeof document === 'undefined' ? null : createPortal(
    <dialog className="calculator-dialog" ref={dialogRef} aria-label={`Calculator for ${accessibleLabel}`}>
      <div className="calculator-dialog-content">
        <div className="dialog-heading calculator-heading"><div><p className="eyebrow">Inline arithmetic</p><h2>Calculator</h2><p>A familiar calculator layout with direct expression entry and advanced engineering operators.</p></div><button className="icon-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close calculator">×</button></div>
        <div className="calculator-display"><label className="calculator-expression-label">Expression<input ref={calculatorInputRef} value={calculatorExpression} onChange={(event) => setCalculatorExpression(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && calculatorPreview.result !== undefined) { event.preventDefault(); evaluateInCalculator(); } }} placeholder="Example: 12 × 3.5" aria-describedby={`${errorId}-calculator-result`} /></label><div className="calculator-result" id={`${errorId}-calculator-result`} aria-live="polite">{calculatorPreview.result !== undefined ? <><span>Result</span><strong>{formatNumericResult(calculatorPreview.result)}</strong></> : <span>{calculatorPreview.error ?? 'Enter a calculation.'}</span>}</div></div>
        <div className="calculator-keypad" aria-label="Calculator keypad">{STANDARD_KEYS.map((key) => <button key={key.label} className={'className' in key ? key.className : ''} type="button" aria-label={key.label} onClick={() => { if ('action' in key && key.action === 'clear') setCalculatorExpression(''); else if ('action' in key && key.action === 'sign') changeSign(); else if ('action' in key && key.action === 'equals') evaluateInCalculator(); else if ('value' in key) appendCalculatorValue(key.value); }}>{key.display}</button>)}</div>
        <details className="calculator-advanced"><summary>Advanced operators</summary><div><button type="button" onClick={() => appendCalculatorValue('(')}>(</button><button type="button" onClick={() => appendCalculatorValue(')')}>)</button><button type="button" onClick={() => appendCalculatorValue('^')} aria-label="Power">xʸ</button><button type="button" onClick={() => setCalculatorExpression((current) => current.slice(0, -1))} aria-label="Backspace">⌫</button></div></details>
        <div className="dialog-actions calculator-actions"><button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button><button className="button button-primary" type="button" disabled={calculatorPreview.result === undefined} onClick={useCalculatorResult}>Use result</button></div>
      </div>
    </dialog>, document.body
  );

  return <><span className={`numeric-field ${className ?? ''}`.trim()}><span className="numeric-input-control"><input {...inputProps} className="numeric-input" type="text" inputMode={inputProps.inputMode ?? 'decimal'} autoComplete={inputProps.autoComplete ?? 'off'} spellCheck={false} disabled={disabled} value={draft} aria-invalid={error ? true : undefined} aria-describedby={[ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined} onChange={(event) => { const nextDraft = event.target.value; setDraft(nextDraft); setError(undefined); notifyValidDraft(nextDraft); }} onFocus={(event) => { focusedRef.current = true; onFocus?.(event); }} onBlur={(event) => { focusedRef.current = false; commitDraft(); onBlur?.(event); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commitDraft(); } else if (event.key === 'Escape') { event.preventDefault(); resetDraft(); } onKeyDown?.(event); }} />{calculator && !disabled ? <button className="numeric-calculator-trigger" type="button" aria-label={`Open calculator for ${accessibleLabel}`} title="Open calculator" onClick={openCalculator}><span aria-hidden="true">⌗</span></button> : null}</span>{error ? <span className="numeric-field-error" id={errorId} role="alert">{error}</span> : null}</span>{calculatorDialog}</>;
}

function validateBounds(value: number, min?: number, max?: number): string | undefined {
  if (min !== undefined && value < min) return `Value must be at least ${formatNumericResult(min)}.`;
  if (max !== undefined && value > max) return `Value must not exceed ${formatNumericResult(max)}.`;
  return undefined;
}
