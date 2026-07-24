import type { ScheduleResult } from '../domain/schedule/types';

interface HealthPanelProps {
  result?: ScheduleResult;
  calculationError?: string;
}

export function HealthPanel({ result, calculationError }: HealthPanelProps) {
  const warnings = result?.warnings ?? [];
  const errors = warnings.filter((warning) => warning.severity === 'error').length;
  const warningCount = warnings.filter((warning) => warning.severity === 'warning').length;

  return (
    <section className="surface panel-stack" aria-labelledby="health-title">
      <div className="surface-heading">
        <div>
          <p className="eyebrow">Validation and explainability</p>
          <h2 id="health-title">Schedule health</h2>
        </div>
        <span className={`health-score ${errors > 0 ? 'health-error' : warningCount > 0 ? 'health-warning' : ''}`}>
          {calculationError ? 'Invalid' : errors > 0 ? `${errors} errors` : warningCount > 0 ? `${warningCount} warnings` : 'Healthy'}
        </span>
      </div>
      {calculationError ? <div className="notice notice-error" role="alert">{calculationError}</div> : null}
      {!calculationError && warnings.length === 0 ? <div className="empty-state compact"><strong>No schedule-health findings</strong><span>Logic, calendars, float, and constraints passed the current checks.</span></div> : null}
      <ul className="health-list">
        {warnings.map((warning, index) => (
          <li className={`health-item health-${warning.severity}`} key={`${warning.code}-${warning.activityId ?? warning.relationshipId ?? index}`}>
            <div>
              <strong>{warning.code.replaceAll('_', ' ')}</strong>
              <p>{warning.message}</p>
            </div>
            <span>{warning.activityId ?? warning.relationshipId ?? 'Project'}</span>
          </li>
        ))}
      </ul>
      {result ? (
        <dl className="calculation-record">
          <div><dt>Engine</dt><dd>{result.engineVersion}</dd></div>
          <div><dt>Calculated</dt><dd>{new Date(result.calculatedAt).toLocaleString()}</dd></div>
          <div><dt>Finish</dt><dd>{result.projectFinishDate}</dd></div>
        </dl>
      ) : null}
    </section>
  );
}
