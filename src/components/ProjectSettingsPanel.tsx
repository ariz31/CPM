import type { ProjectRecord } from '../domain/project/types';
import { NumericInput } from './NumericInput';

interface ProjectSettingsPanelProps {
  project: ProjectRecord;
  onChange: (changes: Partial<ProjectRecord>) => void;
}

export function ProjectSettingsPanel({ project, onChange }: ProjectSettingsPanelProps) {
  function updateMetadata(changes: Partial<ProjectRecord['metadata']>): void {
    onChange({ metadata: { ...project.metadata, ...changes } });
  }

  function updateSettings(changes: Partial<ProjectRecord['settings']>): void {
    onChange({ settings: { ...project.settings, ...changes } });
  }

  return (
    <section className="surface panel-stack" aria-labelledby="project-settings-title">
      <div className="surface-heading">
        <div><p className="eyebrow">Project administration</p><h2 id="project-settings-title">Metadata and settings</h2></div>
      </div>
      <div className="form-grid three-columns">
        <label>Project name<input value={project.name} onChange={(event) => onChange({ name: event.target.value })} /></label>
        <label>Start date<input type="date" value={project.metadata.startDate} onChange={(event) => updateMetadata({ startDate: event.target.value })} /></label>
        <label>Location<input value={project.metadata.location} onChange={(event) => updateMetadata({ location: event.target.value })} /></label>
        <label>Owner<input value={project.metadata.owner} onChange={(event) => updateMetadata({ owner: event.target.value })} /></label>
        <label>Contractor<input value={project.metadata.contractor} onChange={(event) => updateMetadata({ contractor: event.target.value })} /></label>
        <label>Consultant<input value={project.metadata.consultant} onChange={(event) => updateMetadata({ consultant: event.target.value })} /></label>
        <label>Contract number<input value={project.metadata.contractNumber} onChange={(event) => updateMetadata({ contractNumber: event.target.value })} /></label>
        <label>Timezone<input value={project.metadata.timezone} onChange={(event) => updateMetadata({ timezone: event.target.value })} /></label>
        <label>Currency<input value={project.metadata.currency} onChange={(event) => updateMetadata({ currency: event.target.value.toUpperCase() })} /></label>
        <label>Unit system<select value={project.metadata.unitSystem} onChange={(event) => updateMetadata({ unitSystem: event.target.value as 'metric' | 'imperial' })}><option value="metric">Metric</option><option value="imperial">Imperial</option></select></label>
        <label>Critical threshold (days)<NumericInput value={project.settings.criticalFloatThresholdDays} calculatorLabel="critical float threshold" onValueChange={(criticalFloatThresholdDays) => { if (criticalFloatThresholdDays !== undefined) updateSettings({ criticalFloatThresholdDays }); }} /></label>
        <label>Near-critical threshold (days)<NumericInput value={project.settings.nearCriticalFloatThresholdDays} min={0} calculatorLabel="near-critical float threshold" onValueChange={(nearCriticalFloatThresholdDays) => { if (nearCriticalFloatThresholdDays !== undefined) updateSettings({ nearCriticalFloatThresholdDays }); }} /></label>
        <label className="field-span-3">Description<textarea rows={5} value={project.metadata.description} onChange={(event) => updateMetadata({ description: event.target.value })} /></label>
      </div>
    </section>
  );
}
