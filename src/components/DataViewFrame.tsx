import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DataViewZoom {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onFit?: () => void;
  onReset?: () => void;
}

interface DataViewFrameProps {
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
  controls?: ReactNode;
  children: ReactNode;
  zoom?: DataViewZoom;
  accessibleAlternative?: ReactNode;
}

export function DataViewFrame({ title, eyebrow, description, className, controls, children, zoom, accessibleAlternative }: DataViewFrameProps) {
  const [focused, setFocused] = useState(false);
  const focusButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!focused) return;
    document.body.classList.add('data-view-focus-active');
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setFocused(false);
      window.requestAnimationFrame(() => focusButtonRef.current?.focus());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('data-view-focus-active');
    };
  }, [focused]);

  const step = zoom?.step ?? 0.15;
  function closeFocus(): void {
    setFocused(false);
    window.requestAnimationFrame(() => focusButtonRef.current?.focus());
  }

  return (
    <section className={`surface data-view-frame ${focused ? 'data-view-focused' : ''} ${className ?? ''}`.trim()} aria-label={title}>
      <div className="surface-heading data-view-heading">
        <div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2>{title}</h2>{description ? <p className="muted data-view-description">{description}</p> : null}</div>
        <div className="data-view-toolbar" aria-label={`${title} controls`}>
          {controls}
          {zoom ? <><button className="button button-small" type="button" aria-label={`Zoom out ${title}`} disabled={zoom.value <= zoom.min} onClick={() => zoom.onChange(Math.max(zoom.min, Number((zoom.value - step).toFixed(2))))}>−</button><output className="data-view-zoom-value" aria-label={`${title} zoom level`}>{Math.round(zoom.value * 100)}%</output><button className="button button-small" type="button" aria-label={`Zoom in ${title}`} disabled={zoom.value >= zoom.max} onClick={() => zoom.onChange(Math.min(zoom.max, Number((zoom.value + step).toFixed(2))))}>+</button>{zoom.onFit ? <button className="button button-small" type="button" onClick={zoom.onFit}>Fit</button> : null}{zoom.onReset ? <button className="button button-small" type="button" onClick={zoom.onReset}>Reset</button> : null}</> : null}
          <button ref={focusButtonRef} className="button button-small data-view-focus-toggle" type="button" aria-label={focused ? `Exit focused view for ${title}` : `Focus ${title}`} aria-pressed={focused} onClick={() => focused ? closeFocus() : setFocused(true)}><span aria-hidden="true">{focused ? '↙' : '⛶'}</span><span>{focused ? 'Exit' : 'Focus'}</span></button>
        </div>
      </div>
      <div className="data-view-content">{children}</div>
      {accessibleAlternative}
    </section>
  );
}
