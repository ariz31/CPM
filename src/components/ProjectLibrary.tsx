import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProjectTemplateDefinition } from '../data/projectTemplates';
import type { ProjectRecord, ProjectStatus } from '../domain/project/types';

interface StorageHealth {
  usage: number;
  quota: number;
  ratio: number;
  persistent: boolean;
}

interface ProjectLibraryProps {
  projects: ProjectRecord[];
  templates: ProjectTemplateDefinition[];
  isLoading: boolean;
  error?: string;
  storageHealth?: StorageHealth;
  quarantineCount: number;
  onOpen: (projectId: string) => void;
  onCreateBlank: () => void;
  onCreateSample: () => void;
  onCreateTemplate: (templateId: ProjectTemplateDefinition['id']) => void;
  onRename: (projectId: string, name: string) => void;
  onDuplicate: (projectId: string) => void;
  onArchive: (projectId: string) => void;
  onTrash: (projectId: string) => void;
  onRestore: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onExport: (projectId: string) => void;
  onImport: (file: File) => void;
}

type DialogAction = { kind: 'rename' | 'delete'; project: ProjectRecord };

export function ProjectLibrary({
  projects,
  templates,
  isLoading,
  error,
  storageHealth,
  quarantineCount,
  onOpen,
  onCreateBlank,
  onCreateSample,
  onCreateTemplate,
  onRename,
  onDuplicate,
  onArchive,
  onTrash,
  onRestore,
  onDelete,
  onExport,
  onImport
}: ProjectLibraryProps) {
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [query, setQuery] = useState('');
  const [templateId, setTemplateId] = useState<ProjectTemplateDefinition['id']>('commercial-building');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [dialogAction, setDialogAction] = useState<DialogAction>();
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects
      .filter((project) => project.status === status && (!normalized || `${project.name} ${project.metadata.description} ${project.metadata.location}`.toLowerCase().includes(normalized)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, query, status]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogAction && !dialog.open) dialog.showModal();
    if (!dialogAction && dialog.open) dialog.close();
  }, [dialogAction]);

  function openRename(project: ProjectRecord): void {
    setRenameValue(project.name);
    setDialogAction({ kind: 'rename', project });
  }

  function closeDialog(): void {
    setDialogAction(undefined);
  }

  return (
    <main className="library-shell modern-library">
      <section className="library-command-panel" aria-labelledby="library-title">
        <div className="library-intro">
          <p className="eyebrow">Local project control</p>
          <h1 id="library-title">Plan, calculate, recover, and exchange complete project files.</h1>
          <p>Open recent work, start from a construction template, or import a checksummed project. Authoritative data stays on this device.</p>
        </div>
        <div className="library-create-actions">
          <button className="button button-primary" type="button" onClick={onCreateBlank}>New project</button>
          <label className="template-picker" htmlFor="project-template">
            <span>Starter template</span>
            <span className="template-picker-row">
              <select id="project-template" value={templateId} onChange={(event) => setTemplateId(event.target.value as ProjectTemplateDefinition['id'])}>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
              <button className="button button-secondary" type="button" onClick={() => onCreateTemplate(templateId)}>Create</button>
            </span>
          </label>
          <div className="secondary-create-actions">
            <button className="button button-quiet" type="button" onClick={onCreateSample}>Duplicate sample</button>
            <button className="button button-quiet" type="button" onClick={() => inputRef.current?.click()}>Import .cpmproj</button>
          </div>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            aria-label="Import portable project file"
            accept=".cpmproj,application/vnd.cpm.project+json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = '';
            }}
          />
        </div>
      </section>

      <section className="library-health" aria-label="Local storage health">
        <div><span>Storage</span><strong>{storageHealth?.quota ? `${formatBytes(storageHealth.usage)} / ${formatBytes(storageHealth.quota)}` : 'Browser-managed'}</strong></div>
        <div><span>Persistence</span><strong>{storageHealth?.persistent ? 'Protected' : 'Browser default'}</strong></div>
        <div><span>Quarantine</span><strong>{quarantineCount === 0 ? 'Clear' : `${quarantineCount} records`}</strong></div>
        <div><span>Projects</span><strong>{projects.filter((project) => project.status === 'active').length} active</strong></div>
      </section>

      <section className="library-section" aria-labelledby="projects-title">
        <div className="section-heading library-toolbar">
          <div><p className="eyebrow">Project library</p><h2 id="projects-title">Projects</h2></div>
          <div className="library-toolbar-actions">
            <label className="search-field"><span className="sr-only">Search projects</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, description, or location" /></label>
            <div className="segmented-control" role="group" aria-label="Project status">
              {(['active', 'archived', 'trashed'] as ProjectStatus[]).map((item) => (
                <button key={item} className={status === item ? 'active' : ''} type="button" onClick={() => setStatus(item)}>{item}</button>
              ))}
            </div>
            <div className="view-toggle" role="group" aria-label="Project view">
              <button type="button" className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')} aria-label="Grid view">Grid</button>
              <button type="button" className={view === 'list' ? 'active' : ''} onClick={() => setView('list')} aria-label="List view">List</button>
            </div>
          </div>
        </div>

        {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
        {storageHealth && storageHealth.ratio > 0.8 ? <div className="notice notice-warning" role="alert">Local storage is above 80% of browser quota. Export important projects and remove unused attachments.</div> : null}
        {isLoading ? <div className="empty-state">Loading local projects…</div> : null}
        {!isLoading && visibleProjects.length === 0 ? <div className="empty-state"><h3>No {status} projects</h3><p>Projects in this status will appear here.</p></div> : null}

        <div className={`project-grid project-${view}`}>
          {visibleProjects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-topline">
                <span className={`status-dot status-${project.status}`} aria-hidden="true" />
                <span>{project.status}</span>
                <span className="project-revision">Revision {project.revision}</span>
              </div>
              <div className="project-card-copy">
                <h3>{project.name}</h3>
                <p>{project.metadata.description || 'No project description has been added.'}</p>
              </div>
              <dl className="project-facts">
                <div><dt>Activities</dt><dd>{project.activities.length}</dd></div>
                <div><dt>Updated</dt><dd>{new Date(project.updatedAt).toLocaleDateString()}</dd></div>
                <div><dt>Location</dt><dd>{project.metadata.location || '—'}</dd></div>
                <div><dt>Status date</dt><dd>{project.statusDate}</dd></div>
              </dl>
              <div className="card-actions">
                {project.status !== 'trashed' ? <button className="button button-card" type="button" onClick={() => onOpen(project.id)}>Open workspace <span aria-hidden="true">→</span></button> : <button className="button button-secondary" type="button" onClick={() => onRestore(project.id)}>Restore project</button>}
                <details className="action-menu">
                  <summary aria-label={`More actions for ${project.name}`}>•••</summary>
                  <div>
                    {project.status === 'active' ? <button type="button" onClick={() => openRename(project)}>Rename</button> : null}
                    {project.status !== 'trashed' ? <button type="button" onClick={() => onDuplicate(project.id)}>Duplicate</button> : null}
                    {project.status !== 'trashed' ? <button type="button" onClick={() => onExport(project.id)}>Export .cpmproj</button> : null}
                    {project.status === 'active' ? <button type="button" onClick={() => onArchive(project.id)}>Archive</button> : null}
                    {project.status === 'archived' ? <button type="button" onClick={() => onRestore(project.id)}>Return to active</button> : null}
                    {project.status !== 'trashed' ? <button type="button" className="danger" onClick={() => onTrash(project.id)}>Move to trash</button> : null}
                    {project.status === 'trashed' ? <button type="button" className="danger" onClick={() => setDialogAction({ kind: 'delete', project })}>Delete permanently</button> : null}
                  </div>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>

      <dialog className="project-action-dialog" ref={dialogRef} onClose={closeDialog} aria-labelledby="project-action-title">
        {dialogAction ? (
          <form method="dialog" onSubmit={(event) => {
            event.preventDefault();
            if (dialogAction.kind === 'rename') {
              const normalized = renameValue.trim();
              if (!normalized) return;
              onRename(dialogAction.project.id, normalized);
            } else {
              onDelete(dialogAction.project.id);
            }
            closeDialog();
          }}>
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">{dialogAction.kind === 'rename' ? 'Project identity' : 'Permanent action'}</p>
                <h2 id="project-action-title">{dialogAction.kind === 'rename' ? 'Rename project' : 'Delete project permanently?'}</h2>
                <p>{dialogAction.kind === 'rename' ? 'Use a clear name that can be recognized in reports and exports.' : `${dialogAction.project.name} and its local recovery history will be removed from this device.`}</p>
              </div>
              <button className="icon-button" type="button" onClick={closeDialog} aria-label="Close dialog">×</button>
            </div>
            {dialogAction.kind === 'rename' ? <label className="dialog-field">Project name<input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} /></label> : <div className="destructive-summary"><strong>This cannot be undone.</strong><span>Export the project first when a portable backup is required.</span></div>}
            <div className="dialog-actions">
              <button className="button button-secondary" type="button" onClick={closeDialog}>Cancel</button>
              <button className={`button ${dialogAction.kind === 'delete' ? 'button-danger' : 'button-primary'}`} type="submit">{dialogAction.kind === 'rename' ? 'Save name' : 'Delete permanently'}</button>
            </div>
          </form>
        ) : null}
      </dialog>
    </main>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB'];
  let amount = value / 1024;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) { amount /= 1024; index += 1; }
  return `${amount.toFixed(1)} ${units[index]}`;
}
