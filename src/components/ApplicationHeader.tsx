import { AppearancePanel } from './AppearancePanel';

interface ApplicationHeaderProps {
  isOnline: boolean;
  projectName?: string;
  onHome?: () => void;
}

export function ApplicationHeader({ isOnline, projectName, onHome }: ApplicationHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-brand">
        <button className="brand-mark" type="button" onClick={onHome} disabled={!onHome} aria-label={onHome ? 'Return to project library' : 'CPM project library'}>
          <span aria-hidden="true">CP</span>
        </button>
        <div>
          <strong>CPM</strong>
          <span>{projectName ?? 'Construction control workbench'}</span>
        </div>
      </div>
      <div className="app-header-tools">
        <div className={`connectivity-status ${isOnline ? 'online' : 'offline'}`} role="status">
          <span aria-hidden="true" />
          <span>{isOnline ? 'Local data ready' : 'Offline mode'}</span>
        </div>
        <AppearancePanel />
      </div>
    </header>
  );
}
