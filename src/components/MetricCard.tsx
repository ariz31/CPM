interface MetricCardProps {
  label: string;
  value: string | number;
  detail: string;
  tone?: 'default' | 'critical' | 'warning';
}

export function MetricCard({ label, value, detail, tone = 'default' }: MetricCardProps) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}
