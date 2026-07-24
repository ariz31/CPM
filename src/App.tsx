import { useEffect, useState } from 'react';
import { ApplicationHeader } from './components/ApplicationHeader';
import { ProjectLibrary } from './components/ProjectLibrary';
import { PwaUpdateBanner } from './components/PwaUpdateBanner';
import { ScheduleWorkspace } from './components/ScheduleWorkspace';
import { PROJECT_TEMPLATES, type ProjectTemplateDefinition } from './data/projectTemplates';
import type { ProjectRecord } from './domain/project/types';
import { createProjectFile, downloadProjectFile, importProjectFile } from './infrastructure/projectFile';
import {
  createBlankProject,
  duplicateProject,
  duplicateSampleProject,
  ensureSampleProject,
  getProject,
  getStorageHealth,
  listProjects,
  listQuarantinedProjects,
  permanentlyDeleteProject,
  renameProject,
  restoreProject,
  setProjectStatus,
  trashProject
} from './infrastructure/projectRepository';
import { createProjectFromTemplate } from './infrastructure/templateRepository';

interface StorageHealth {
  usage: number;
  quota: number;
  ratio: number;
  persistent: boolean;
}

export function App() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageHealth, setStorageHealth] = useState<StorageHealth>();
  const [quarantineCount, setQuarantineCount] = useState(0);

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

  useEffect(() => { void initialize(); }, []);

  async function initialize(): Promise<void> {
    setIsLoading(true);
    setError(undefined);
    try {
      await ensureSampleProject();
      await refreshProjects();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to open local project storage.');
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshProjects(): Promise<void> {
    const [records, health, quarantined] = await Promise.all([
      listProjects(['active', 'archived', 'trashed']),
      getStorageHealth().catch(() => ({ usage: 0, quota: 0, ratio: 0, persistent: false })),
      listQuarantinedProjects()
    ]);
    setProjects(records);
    setStorageHealth(health);
    setQuarantineCount(quarantined.length);
  }

  async function runAction(action: () => Promise<unknown>): Promise<void> {
    setError(undefined);
    try {
      await action();
      await refreshProjects();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The operation failed.');
    }
  }

  async function handleOpen(projectId: string): Promise<void> {
    await runAction(async () => {
      const project = await getProject(projectId);
      if (!project) throw new Error('The selected project could not be found.');
      setSelectedProject(project);
    });
  }

  function handleBack(): void {
    setSelectedProject(undefined);
    void refreshProjects();
  }

  function handleCreateTemplate(templateId: ProjectTemplateDefinition['id']): void {
    void runAction(async () => {
      const project = await createProjectFromTemplate(templateId);
      setSelectedProject(project);
    });
  }

  return (
    <div className="app-shell">
      <ApplicationHeader isOnline={isOnline} projectName={selectedProject?.name} onHome={selectedProject ? handleBack : undefined} />
      {!isOnline ? <div className="offline-banner" role="status">Offline mode — scheduling, editing, recovery, and local project storage remain available.</div> : null}
      <PwaUpdateBanner />
      {selectedProject ? (
        <ScheduleWorkspace project={selectedProject} onBack={handleBack} onProjectChange={setSelectedProject} />
      ) : (
        <ProjectLibrary
          projects={projects}
          templates={PROJECT_TEMPLATES}
          isLoading={isLoading}
          error={error}
          storageHealth={storageHealth}
          quarantineCount={quarantineCount}
          onOpen={(id) => void handleOpen(id)}
          onCreateBlank={() => void runAction(async () => { const project = await createBlankProject(`New Project ${projects.length + 1}`); setSelectedProject(project); })}
          onCreateSample={() => void runAction(async () => { const project = await duplicateSampleProject(); setSelectedProject(project); })}
          onCreateTemplate={handleCreateTemplate}
          onRename={(id, name) => void runAction(() => renameProject(id, name))}
          onDuplicate={(id) => void runAction(() => duplicateProject(id))}
          onArchive={(id) => void runAction(() => setProjectStatus(id, 'archived'))}
          onTrash={(id) => void runAction(() => trashProject(id))}
          onRestore={(id) => void runAction(() => restoreProject(id))}
          onDelete={(id) => void runAction(() => permanentlyDeleteProject(id))}
          onExport={(id) => void runAction(async () => {
            const project = await getProject(id);
            if (!project) throw new Error('Project was not found.');
            downloadProjectFile(await createProjectFile(project), project.name.replace(/[^a-z0-9-_]+/gi, '-'));
          })}
          onImport={(file) => void runAction(async () => { const project = await importProjectFile(file); setSelectedProject(project); })}
        />
      )}
    </div>
  );
}
