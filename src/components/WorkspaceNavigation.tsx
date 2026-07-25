export type WorkspaceTab =
  | 'dashboard'
  | 'schedule'
  | 'dictionary'
  | 'duration'
  | 'wbs'
  | 'network'
  | 'logic'
  | 'calendars'
  | 'control-overview'
  | 'progress'
  | 'boq'
  | 'controls'
  | 'risk'
  | 'executive'
  | 'reports'
  | 'enterprise'
  | 'project'
  | 'recovery';

export type SidebarMode = 'expanded' | 'compact' | 'hidden';

interface WorkspaceGroup {
  id: 'overview' | 'plan' | 'control' | 'review' | 'project';
  label: string;
  description: string;
  items: WorkspaceTab[];
}

export const WORKSPACE_GROUPS: WorkspaceGroup[] = [
  { id: 'overview', label: 'Overview', description: 'Project position and actions', items: ['dashboard'] },
  { id: 'plan', label: 'Plan', description: 'Schedule, scope, and logic', items: ['schedule', 'dictionary', 'duration', 'wbs', 'network', 'logic', 'calendars'] },
  { id: 'control', label: 'Control', description: 'Status, cost, and exposure', items: ['control-overview', 'progress', 'boq', 'controls', 'risk'] },
  { id: 'review', label: 'Review', description: 'Decision support and assurance', items: ['executive', 'reports', 'enterprise'] },
  { id: 'project', label: 'Project', description: 'Configuration and recovery', items: ['project', 'recovery'] }
];

export const TAB_LABELS: Record<WorkspaceTab, string> = {
  dashboard: 'Dashboard',
  schedule: 'Activities & Gantt',
  dictionary: 'Activity dictionary',
  duration: 'Duration calculator',
  wbs: 'Work breakdown structure',
  network: 'Network',
  logic: 'Logic',
  calendars: 'Calendars',
  'control-overview': 'Control center',
  progress: 'Progress & baselines',
  boq: 'BOQ & estimate',
  controls: 'Cost & EVM',
  risk: 'Risk & resources',
  executive: 'Executive summary',
  reports: 'Report catalog',
  enterprise: 'Audit & evidence',
  project: 'Project settings',
  recovery: 'Recovery'
};

const TAB_ICONS: Record<WorkspaceTab, string> = {
  dashboard: '⌂', schedule: '▤', dictionary: '▦', duration: '⌗', wbs: '⌁', network: '⌘', logic: '⇄', calendars: '□',
  'control-overview': '◎', progress: '◔', boq: '₱', controls: '∿', risk: '△', executive: '◈', reports: '▥', enterprise: '◇', project: '⚙', recovery: '↺'
};

interface WorkspaceNavigationProps {
  active: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
  sidebarMode: SidebarMode;
  onSidebarModeChange: (mode: SidebarMode) => void;
}

export function WorkspaceNavigation({ active, onChange, sidebarMode, onSidebarModeChange }: WorkspaceNavigationProps) {
  const activeGroup = WORKSPACE_GROUPS.find((group) => group.items.includes(active)) ?? WORKSPACE_GROUPS[0];

  return <>
    {sidebarMode !== 'hidden' ? (
      <aside className={`workspace-sidebar sidebar-${sidebarMode}`} aria-label="Project workspace navigation">
        <div className="workspace-sidebar-heading">
          <div className="workspace-sidebar-title"><span>Workbench</span><strong>{TAB_LABELS[active]}</strong></div>
          <div className="workspace-sidebar-controls">
            <button type="button" onClick={() => onSidebarModeChange(sidebarMode === 'expanded' ? 'compact' : 'expanded')} aria-label={sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'} title={sidebarMode === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}>{sidebarMode === 'expanded' ? '«' : '»'}</button>
            <button type="button" onClick={() => onSidebarModeChange('hidden')} aria-label="Hide sidebar" title="Hide sidebar">×</button>
          </div>
        </div>
        <nav>
          {WORKSPACE_GROUPS.map((group) => (
            <section className="workspace-nav-group" key={group.id} aria-labelledby={`workspace-group-${group.id}`}>
              <div className="workspace-nav-group-label"><strong id={`workspace-group-${group.id}`}>{group.label}</strong><span>{group.description}</span></div>
              {group.items.map((item) => (
                <button key={item} className={active === item ? 'active' : ''} type="button" onClick={() => onChange(item)} aria-label={item} aria-current={active === item ? 'page' : undefined} title={TAB_LABELS[item]}>
                  <span className="workspace-nav-icon" aria-hidden="true">{TAB_ICONS[item]}</span>
                  <span className="workspace-nav-copy"><strong>{TAB_LABELS[item]}</strong><small aria-hidden="true">{item}</small></span>
                </button>
              ))}
            </section>
          ))}
        </nav>
      </aside>
    ) : null}
    <label className="mobile-section-select"><span>Workspace section</span><select value={active} onChange={(event) => onChange(event.target.value as WorkspaceTab)}>{WORKSPACE_GROUPS.flatMap((group) => group.items.map((item) => <option key={item} value={item}>{group.label} — {TAB_LABELS[item]}</option>))}</select></label>
    <nav className="mobile-workspace-nav" aria-label="Primary workspace groups">{WORKSPACE_GROUPS.map((group) => <button key={group.id} className={activeGroup.id === group.id ? 'active' : ''} type="button" onClick={() => onChange(group.items[0])} aria-label={`${group.label} workspace`}><span>{group.label}</span></button>)}</nav>
  </>;
}
