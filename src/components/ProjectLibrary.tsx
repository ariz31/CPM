import { useMemo, useRef, useState } from 'react';
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => project.status === status && (!normalized || `${project.name} ${project.metadata.description} ${project.metadata.location}`.toLowerCase().includes(normalized)));
  }, [projects, query, status]);

  return (
    <main className="library-shell">
      <section className="hero-panel" aria-labelledby="library-title">
        <div>
          <p className="eyebrow">Offline construction controls</p>
          <h1 id="library-title">Plan, calculate, recover, and exchange complete project files.</h1>
          <p className="hero-copy">Create a blank project, start from an offline construction template, or import a checksummed portable project file.</p>
        </div>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={onCreateBlank}>New project</button>
          <div className="template-picker">
            <label htmlFor="project-template">Starter template</label>
            <select id="project-template" value={templateId} onChange={(event) => setTemplateId(event.target.value as ProjectTemplateDefinition['id'])}>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
            <button className="button button-secondary" type="button" onClick={() => onCreateTemplate(templateId)}>Use template</button>
          </div>
          <button className="button button-secondary" type="button" onClick={onCreateSample}>Duplicate sample</button>
          <button className="button button-secondary" type="button" onClick={() => inputRef.current?.click()}>Import .cpmproj</button>
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
        <div><span>Persistent storage</span><strong>{storageHealth?.persistent ? 'Granted' : 'Not granted'}</strong></div>
        <div><span>Quarantined records</span><strong>{quarantineCount}</strong></div>
        <div><span>Data location</span><strong>On this device</strong></div>
      </section>

      <section className="library-section" aria-labelledby="projects-title">
        <div className="section-heading library-toolbar">
          <div><p className="eyebrow">Local workspace</p><h2 id="projects-title">Projects</h2></div>
          <div className="toolbar-group">
            <label className="search-field"><span className="sr-only">Search projects</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" /></label>
            <div className="segmented-control" role="group" aria-label="Project status">
              {(['active', 'archived', 'trashed'] as ProjectStatus[]).map((item) => (
                <button key={item} className={status === item ? 'active' : ''} type="button" onClick={() => setStatus(item)}>{item}</button>
              ))}
            </div>
          </div>
        </div>

        {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
        {storageHealth && storageHealth.ratio > 0.8 ? <div className="notice notice-warning" role="alert">Local storage is above 80% of the browser quota. Export important projects and remove unused attachments.</div> : null}
        {isLoading ? <div className="empty-state">Loading local projects…</div> : null}
        {!isLoading && visibleProjects.length === 0 ? <div className="empty-state"><h3>No {status} projects</h3><p>Projects in this status will appear here.</p></div> : null}

        <div className="project-grid">
          {visibleProjects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-topline"><span className={`status-dot status-${project.status}`} aria-hidden="true" /><span>{project.status} · revision {project.revision}</span></div>
              <h3>{project.name}</h3>
              <p>{project.metadata.description || 'No description'}</p>
              <dl className="project-facts">
                <div><dt>Activities</dt><dd>{project.activities.length}</dd></div>
                <div><dt>Updated</dt><dd>{new Date(project.updatedAt).toLocaleDateString()}</dd></div>
                <div><dt>Location</dt><dd>{project.metadata.location || '—'}</dd></div>
                <div><dt>Start</dt><dd>{project.metadata.startDate}</dd></div>
              </dl>
              <div className="card-actions">
                {project.status !== 'trashed' ? <button className="button button-card" type="button" onClick={() => onOpen(project.id)}>Open workspace <span aria-hidden="true">→</span></button> : null}
                <details className="action-menu">
                  <summary aria-label={`More actions for ${project.name}`}>•••</summary>
                  <div>
                    {project.status === 'active' ? <button type="button" onClick={() => { const name = window.prompt('Rename project', project.name); if (name) onRename(project.id, name); }}>Rename</button> : null}
                    {project.status !== 'trashed' ? <button type="button" onClick={() => onDuplicate(project.id)}>Duplicate</button> : null}
                    {project.status !== 'trashed' ? <button type="button" onClick={() => onExport(project.id)}>Export .cpmproj</button> : null}
                    {project.status === 'active' ? <button type="button" onClick={() => onArchive(project.id)}>Archive</button> : null}
                    {project.status === 'archived' ? <button type="button" onClick={() => onRestore(project.id)}>Return to active</button> : null}
                    {project.status !== 'trashed' ? <button type="button" className="danger" onClick={() => onTrash(project.id)}>Move to trash</button> : null}
                    {project.status === 'trashed' ? <button type="button" onClick={() => onRestore(project.id)}>Restore</button> : null}
                    {project.status === 'trashed' ? <button type="button" className="danger" onClick={() => { if (window.confirm(`Permanently delete ${project.name}?`)) onDelete(project.id); }}>Delete permanently</button> : null}
                  </div>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>
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
