import { useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes } from 'react';
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
}

const KEYPAD = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '%', '+', '(', ')', '^'] as const;

export function NumericInput({
  value,
  onValueChange,
  min,
  max,
  step: _step,
  allowBlank = true,
  calculator = true,
  calculatorLabel,
  disabled,
  className,
  onBlur,
  onFocus,
  onKeyDown,
  'aria-describedby': ariaDescribedBy,
  ...inputProps
}: NumericInputProps) {
  const [draft, setDraft] = useState(value === undefined ? '' : formatNumericResult(value));
  const [error, setError] = useState<string>();
  const [calculatorExpression, setCalculatorExpression] = useState('');
  const dialogRef = useRef<HTMLDialogElement | null>(null);
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
      return {
        result: undefined,
        error: calculatorExpression.trim() ? previewError instanceof Error ? previewError.message : 'Invalid calculation.' : undefined
      };
    }
  }, [calculatorExpression, min, max]);

  function commitDraft(): boolean {
    const trimmed = draft.trim();
    if (!trimmed) {
      if (!allowBlank) {
        setError('A value is required.');
        return false;
      }
      lastCommittedRef.current = undefined;
      setError(undefined);
      onValueChange(undefined);
      return true;
    }

    try {
      const nextValue = evaluateNumericExpression(trimmed);
      const validationError = validateBounds(nextValue, min, max);
      if (validationError) {
        setError(validationError);
        return false;
      }
      const formatted = formatNumericResult(nextValue);
      setDraft(formatted);
      setError(undefined);
      lastCommittedRef.current = nextValue;
      onValueChange(nextValue);
      return true;
    } catch (commitError) {
      setError(commitError instanceof Error ? commitError.message : 'Enter a valid number or calculation.');
      return false;
    }
  }

  function resetDraft(): void {
    setDraft(value === undefined ? '' : formatNumericResult(value));
    lastCommittedRef.current = value;
    setError(undefined);
  }

  function openCalculator(): void {
    setCalculatorExpression(draft);
    dialogRef.current?.showModal();
  }

  function useCalculatorResult(): void {
    if (calculatorPreview.result === undefined) return;
    const formatted = formatNumericResult(calculatorPreview.result);
    setDraft(formatted);
    setError(undefined);
    lastCommittedRef.current = calculatorPreview.result;
    onValueChange(calculatorPreview.result);
    dialogRef.current?.close();
  }

  return (
    <span className={`numeric-field ${className ?? ''}`.trim()}>
      <span className="numeric-input-control">
        <input
          {...inputProps}
          className="numeric-input"
          type="text"
          inputMode={inputProps.inputMode ?? 'decimal'}
          autoComplete={inputProps.autoComplete ?? 'off'}
          spellCheck={false}
          disabled={disabled}
          value={draft}
          aria-invalid={error ? true : undefined}
          aria-describedby={[ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(' ') || undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(undefined);
          }}
          onFocus={(event) => {
            focusedRef.current = true;
            onFocus?.(event);
          }}
          onBlur={(event) => {
            focusedRef.current = false;
            commitDraft();
            onBlur?.(event);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitDraft();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              resetDraft();
            }
            onKeyDown?.(event);
          }}
        />
        {calculator && !disabled ? (
          <button
            className="numeric-calculator-trigger"
            type="button"
            aria-label={`Open calculator for ${accessibleLabel}`}
            title="Open calculator"
            onClick={openCalculator}
          >
            <span aria-hidden="true">⌗</span>
          </button>
        ) : null}
      </span>
      {error ? <span className="numeric-field-error" id={errorId} role="alert">{error}</span> : null}

      <dialog className="calculator-dialog" ref={dialogRef} aria-label={`Calculator for ${accessibleLabel}`}>
        <div className="calculator-dialog-content">
          <div className="dialog-heading calculator-heading">
            <div>
              <p className="eyebrow">Inline arithmetic</p>
              <h2>Calculator</h2>
              <p>Use +, −, ×, ÷, parentheses, powers, or percentages. You may also type an expression directly in the field.</p>
            </div>
            <button className="icon-button" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close calculator">×</button>
          </div>

          <label className="calculator-expression-label">
            Expression
            <input
              autoFocus
              value={calculatorExpression}
              onChange={(event) => setCalculatorExpression(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && calculatorPreview.result !== undefined) {
                  event.preventDefault();
                  useCalculatorResult();
                }
              }}
              placeholder="Example: 12 × 3.5"
              aria-describedby={`${errorId}-calculator-result`}
            />
          </label>

          <div className="calculator-result" id={`${errorId}-calculator-result`} aria-live="polite">
            {calculatorPreview.result !== undefined
              ? <><span>Result</span><strong>{formatNumericResult(calculatorPreview.result)}</strong></>
              : <span>{calculatorPreview.error ?? 'Enter a calculation.'}</span>}
          </div>

          <div className="calculator-keypad" aria-label="Calculator keypad">
            {KEYPAD.map((key) => (
              <button key={key} type="button" onClick={() => setCalculatorExpression((current) => `${current}${key}`)}>{key}</button>
            ))}
            <button type="button" onClick={() => setCalculatorExpression((current) => current.slice(0, -1))} aria-label="Backspace">⌫</button>
            <button type="button" onClick={() => setCalculatorExpression('')}>Clear</button>
          </div>

          <div className="dialog-actions">
            <button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button className="button button-primary" type="button" disabled={calculatorPreview.result === undefined} onClick={useCalculatorResult}>Use result</button>
          </div>
        </div>
      </dialog>
    </span>
  );
}

function validateBounds(value: number, min?: number, max?: number): string | undefined {
  if (min !== undefined && value < min) return `Value must be at least ${formatNumericResult(min)}.`;
  if (max !== undefined && value > max) return `Value must not exceed ${formatNumericResult(max)}.`;
  return undefined;
}
