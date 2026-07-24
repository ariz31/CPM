import { useEffect, useState } from 'react';
import { ProjectLibrary } from './components/ProjectLibrary';
import { ScheduleWorkspace } from './components/ScheduleWorkspace';
import {
  createBlankProject,
  duplicateSampleProject,
  ensureSampleProject,
  getProject,
  listProjects,
  type ProjectRecord
} from './infrastructure/projectRepository';

export function App() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize(): Promise<void> {
    setIsLoading(true);
    setError(undefined);

    try {
      await ensureSampleProject();
      setProjects(await listProjects());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to open local project storage.');
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshProjects(): Promise<void> {
    setProjects(await listProjects());
  }

  async function handleOpen(projectId: string): Promise<void> {
    setError(undefined);
    const project = await getProject(projectId);
    if (!project) {
      setError('The selected project could not be found in local storage.');
      return;
    }
    setSelectedProject(project);
  }

  async function handleCreateBlank(): Promise<void> {
    const project = await createBlankProject(`New Project ${projects.length + 1}`);
    await refreshProjects();
    setSelectedProject(project);
  }

  async function handleCreateSample(): Promise<void> {
    const project = await duplicateSampleProject();
    await refreshProjects();
    setSelectedProject(project);
  }

  function handleBack(): void {
    setSelectedProject(undefined);
    void refreshProjects();
  }

  return (
    <div className="app-shell">
      <div className="network-banner" role="status">
        <span className={isOnline ? 'network-dot online' : 'network-dot'} aria-hidden="true" />
        {isOnline ? 'Online — app data remains local' : 'Offline mode — core scheduling remains available'}
      </div>

      {selectedProject ? (
        <ScheduleWorkspace
          project={selectedProject}
          onBack={handleBack}
          onProjectChange={setSelectedProject}
        />
      ) : (
        <ProjectLibrary
          projects={projects}
          isLoading={isLoading}
          error={error}
          onOpen={(projectId) => void handleOpen(projectId)}
          onCreateBlank={() => void handleCreateBlank()}
          onCreateSample={() => void handleCreateSample()}
        />
      )}
    </div>
  );
}
