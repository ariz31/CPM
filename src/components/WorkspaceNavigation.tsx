export type WorkspaceTab =
  | 'schedule'
  | 'network'
  | 'logic'
  | 'calendars'
  | 'progress'
  | 'boq'
  | 'controls'
  | 'risk'
  | 'reports'
  | 'enterprise'
  | 'project'
  | 'recovery';

interface WorkspaceGroup {
  id: 'plan' | 'control' | 'review' | 'project';
  label: string;
  description: string;
  items: WorkspaceTab[];
}

export const WORKSPACE_GROUPS: WorkspaceGroup[] = [
  { id: 'plan', label: 'Plan', description: 'Schedule structure and logic', items: ['schedule', 'network', 'logic', 'calendars'] },
  { id: 'control', label: 'Control', description: 'Progress, cost, and exposure', items: ['progress', 'boq', 'controls', 'risk'] },
  { id: 'review', label: 'Review', description: 'Reports and assurance', items: ['reports', 'enterprise'] },
  { id: 'project', label: 'Project', description: 'Configuration and recovery', items: ['project', 'recovery'] }
];

const TAB_LABELS: Record<WorkspaceTab, string> = {
  schedule: 'Activities & Gantt',
  network: 'Network',
  logic: 'Logic',
  calendars: 'Calendars & WBS',
  progress: 'Progress & baselines',
  boq: 'BOQ & estimate',
  controls: 'Cost & EVM',
  risk: 'Risk & resources',
  reports: 'Reports',
  enterprise: 'Enterprise',
  project: 'Project settings',
  recovery: 'Recovery'
};

export function WorkspaceNavigation({ active, onChange }: { active: WorkspaceTab; onChange: (tab: WorkspaceTab) => void }) {
  const activeGroup = WORKSPACE_GROUPS.find((group) => group.items.includes(active)) ?? WORKSPACE_GROUPS[0];

  return (
    <>
      <aside className="workspace-sidebar" aria-label="Project workspace navigation">
        <div className="workspace-sidebar-heading">
          <span>Workbench</span>
          <strong>{TAB_LABELS[active]}</strong>
        </div>
        <nav>
          {WORKSPACE_GROUPS.map((group) => (
            <section className="workspace-nav-group" key={group.id} aria-labelledby={`workspace-group-${group.id}`}>
              <div className="workspace-nav-group-label">
                <strong id={`workspace-group-${group.id}`}>{group.label}</strong>
                <span>{group.description}</span>
              </div>
              {group.items.map((item) => (
                <button key={item} className={active === item ? 'active' : ''} type="button" onClick={() => onChange(item)} aria-label={item} aria-current={active === item ? 'page' : undefined}>
                  <span>{item}</span>
                  <small aria-hidden="true">{TAB_LABELS[item]}</small>
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>

      <label className="mobile-section-select">
        <span>Workspace section</span>
        <select value={active} onChange={(event) => onChange(event.target.value as WorkspaceTab)}>
          {WORKSPACE_GROUPS.flatMap((group) => group.items.map((item) => <option key={item} value={item}>{group.label} — {TAB_LABELS[item]}</option>))}
        </select>
      </label>

      <nav className="mobile-workspace-nav" aria-label="Primary workspace groups">
        {WORKSPACE_GROUPS.map((group) => (
          <button key={group.id} className={activeGroup.id === group.id ? 'active' : ''} type="button" onClick={() => onChange(group.items[0])} aria-label={`${group.label} workspace`}>
            <span>{group.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
