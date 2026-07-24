import { useMemo, useState } from 'react';
import type { CurvePoint } from '../domain/controls/types';
import { DataViewFrame } from './DataViewFrame';

interface ScurveChartProps {
  curves: CurvePoint[];
  currency: string;
  title?: string;
  compact?: boolean;
}

type SeriesKey = 'plannedEarly' | 'actual' | 'earned' | 'forecast';
const SERIES: Array<{ key: SeriesKey; label: string }> = [
  { key: 'plannedEarly', label: 'Planned' },
  { key: 'earned', label: 'Earned' },
  { key: 'actual', label: 'Actual' },
  { key: 'forecast', label: 'Forecast' }
];
const WIDTH = 900;
const HEIGHT = 360;
const PADDING = { top: 28, right: 26, bottom: 58, left: 82 };

export function ScurveChart({ curves, currency, title = 'S-curve', compact = false }: ScurveChartProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(Math.max(0, curves.length - 1));
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({ plannedEarly: true, actual: true, earned: true, forecast: true });
  const maximum = useMemo(() => Math.max(1, ...curves.flatMap((item) => SERIES.map((series) => item[series.key]))), [curves]);

  if (curves.length === 0) return <p className="notice">No curve data is available.</p>;

  const plotWidth = (WIDTH - PADDING.left - PADDING.right) * zoom;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const x = (index: number) => PADDING.left + (curves.length === 1 ? 0 : index / (curves.length - 1) * plotWidth);
  const y = (value: number) => PADDING.top + plotHeight - value / maximum * plotHeight;
  const safeSelectedIndex = Math.min(selectedIndex, curves.length - 1);
  const selected = curves[safeSelectedIndex];
  const ticks = Array.from({ length: 5 }, (_, index) => maximum * index / 4);
  const labelEvery = Math.max(1, Math.ceil(curves.length / 8));

  const chart = <>
    <div className="curve-series-controls" aria-label="S-curve series">{SERIES.map((series) => <label key={series.key}><input type="checkbox" checked={visible[series.key]} onChange={(event) => setVisible((current) => ({ ...current, [series.key]: event.target.checked }))} /><span className={`curve-key ${series.key}`} aria-hidden="true" />{series.label}</label>)}</div>
    <div className="curve-chart-scroll" tabIndex={0} aria-label="Scrollable S-curve chart">
      <svg className="curve-chart improved" width={PADDING.left + plotWidth + PADDING.right} height={HEIGHT} role="img" aria-label="Cumulative planned, actual, earned, and forecast curves">
        <rect width={PADDING.left + plotWidth + PADDING.right} height={HEIGHT} className="curve-background" />
        {ticks.map((tick) => <g key={tick}><line x1={PADDING.left} x2={PADDING.left + plotWidth} y1={y(tick)} y2={y(tick)} className="curve-grid-line" /><text x={PADDING.left - 10} y={y(tick) + 4} textAnchor="end" className="curve-axis-label">{formatCompact(tick)}</text></g>)}
        {curves.map((point, index) => index % labelEvery === 0 || index === curves.length - 1 ? <text key={point.period} x={x(index)} y={HEIGHT - 20} textAnchor="middle" className="curve-axis-label">{point.period}</text> : null)}
        {SERIES.map((series) => visible[series.key] ? <polyline key={series.key} className={`curve ${series.key === 'plannedEarly' ? 'planned' : series.key}`} points={curves.map((item, index) => `${x(index)},${y(item[series.key])}`).join(' ')} /> : null)}
        <line x1={x(safeSelectedIndex)} x2={x(safeSelectedIndex)} y1={PADDING.top} y2={PADDING.top + plotHeight} className="curve-selection-line" />
        {curves.map((point, index) => <rect key={`${point.period}-target`} x={x(index) - Math.max(7, plotWidth / Math.max(curves.length, 1) / 2)} y={PADDING.top} width={Math.max(14, plotWidth / Math.max(curves.length, 1))} height={plotHeight} fill="transparent" tabIndex={0} role="button" aria-label={`Select S-curve period ${point.period}`} onClick={() => setSelectedIndex(index)} onFocus={() => setSelectedIndex(index)} onKeyDown={(event) => { if (event.key === 'ArrowRight') setSelectedIndex((current) => Math.min(curves.length - 1, current + 1)); if (event.key === 'ArrowLeft') setSelectedIndex((current) => Math.max(0, current - 1)); }} />)}
      </svg>
    </div>
    <div className="curve-period-details" aria-live="polite"><strong>{selected.period}</strong>{SERIES.map((series) => <span key={series.key}>{series.label}: {currency} {selected[series.key].toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>)}</div>
  </>;

  if (compact) return <div className="curve-wrap compact-dashboard-curve">{chart}</div>;
  return <DataViewFrame title={title} eyebrow="Cumulative project controls" description="Inspect planned, earned, actual, and forecast values. Use Focus for a full-phone or desktop view." zoom={{ value: zoom, min: 0.7, max: 2.25, onChange: setZoom, onFit: () => setZoom(1), onReset: () => { setZoom(1); setSelectedIndex(Math.max(0, curves.length - 1)); } }} accessibleAlternative={<details className="accessible-fallback"><summary>Accessible S-curve data table</summary><div className="report-table-scroll"><table className="report-table"><thead><tr><th>Period</th><th>Planned</th><th>Earned</th><th>Actual</th><th>Forecast</th></tr></thead><tbody>{curves.map((point) => <tr key={point.period}><td>{point.period}</td><td>{point.plannedEarly}</td><td>{point.earned}</td><td>{point.actual}</td><td>{point.forecast}</td></tr>)}</tbody></table></div></details>}><div className="curve-wrap">{chart}</div></DataViewFrame>;
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: value >= 1000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}
