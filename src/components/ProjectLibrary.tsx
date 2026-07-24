import type { ProjectRecord } from '../infrastructure/projectRepository';

interface ProjectLibraryProps {
  projects: ProjectRecord[];
  isLoading: boolean;
  error?: string;
  onOpen: (projectId: string) => void;
  onCreateBlank: () => void;
  onCreateSample: () => void;
}

export function ProjectLibrary({
  projects,
  isLoading,
  error,
  onOpen,
  onCreateBlank,
  onCreateSample
}: ProjectLibraryProps) {
  return (
    <main className="library-shell">
      <section className="hero-panel" aria-labelledby="library-title">
        <div>
          <p className="eyebrow">Offline construction controls</p>
          <h1 id="library-title">Plan, calculate, and control from one project model.</h1>
          <p className="hero-copy">
            The first implementation slice includes persistent local projects, a worker-based CPM engine,
            critical-path analysis, and a professional schedule workspace.
          </p>
        </div>
        <div className="hero-actions">
          <button className="button button-primary" type="button" onClick={onCreateBlank}>
            New project
          </button>
          <button className="button button-secondary" type="button" onClick={onCreateSample}>
            Duplicate sample
          </button>
        </div>
      </section>

      <section className="library-section" aria-labelledby="projects-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Local workspace</p>
            <h2 id="projects-title">Projects</h2>
          </div>
          <span className="count-badge">{projects.length}</span>
        </div>

        {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
        {isLoading ? <div className="empty-state">Loading local projects…</div> : null}

        {!isLoading && projects.length === 0 ? (
          <div className="empty-state">
            <h3>No local projects yet</h3>
            <p>Create a blank project or load the sample construction schedule.</p>
          </div>
        ) : null}

        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-topline">
                <span className="status-dot" aria-hidden="true" />
                <span>Stored offline</span>
              </div>
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <dl className="project-facts">
                <div>
                  <dt>Activities</dt>
                  <dd>{project.activities.length}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{new Date(project.updatedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
              <button className="button button-card" type="button" onClick={() => onOpen(project.id)}>
                Open workspace
                <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
