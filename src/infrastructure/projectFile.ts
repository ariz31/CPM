import { validateProjectRecord } from '../domain/project/project';
import type { ProjectRecord } from '../domain/project/types';
import { migrateProjectRecord } from './projectMigration';
import { createProjectSnapshot, getProject, putImportedProject } from './projectRepository';
import { parseUntrustedJson } from './untrustedJson';

const FILE_FORMAT = 'CPMPROJ';
const FILE_VERSION = 1;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

interface ProjectFileEnvelope {
  format: typeof FILE_FORMAT;
  version: typeof FILE_VERSION;
  exportedAt: string;
  projectId: string;
  checksum: string;
  project: unknown;
  modules: {
    baselineCount: number;
    progressRecordCount: number;
    updateSnapshotCount: number;
    boqItemCount: number;
    boqRevisionCount: number;
    costLoadingCount: number;
    actualCostCount: number;
    pertEstimateCount: number;
    riskCount: number;
    productivityPlanCount: number;
    resourceCount: number;
    reportSnapshotCount: number;
    dashboardCount: number;
  };
}

export async function createProjectFile(project: ProjectRecord): Promise<Blob> {
  const projectCopy = structuredClone(project);
  const checksum = await checksumProject(projectCopy);
  const envelope: ProjectFileEnvelope = {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectId: project.id,
    checksum,
    project: projectCopy,
    modules: {
      baselineCount: project.baselines.length,
      progressRecordCount: Object.keys(project.progress).length,
      updateSnapshotCount: project.updateSnapshots.length,
      boqItemCount: project.boq.items.length,
      boqRevisionCount: project.boq.revisions.length,
      costLoadingCount: project.controls.activityLoadings.length,
      actualCostCount: project.controls.actualCosts.length,
      pertEstimateCount: project.riskResources.pertEstimates.length,
      riskCount: project.riskResources.risks.length,
      productivityPlanCount: project.riskResources.productivityPlans.length,
      resourceCount: project.riskResources.resources.length,
      reportSnapshotCount: project.enterprise.reportSnapshots.length,
      dashboardCount: project.enterprise.dashboards.length
    }
  };
  return new Blob([JSON.stringify(envelope)], { type: 'application/vnd.cpm.project+json' });
}

export async function importProjectFile(blob: Blob, replaceExisting = false): Promise<ProjectRecord> {
  if (blob.size > MAX_FILE_BYTES) throw new Error('Project file exceeds the 25 MB safety limit.');
  const text = await blob.text();
  let value: unknown;
  try { value = parseUntrustedJson(text); } catch (error) {
    throw new Error(error instanceof Error ? `Project file is unsafe or invalid: ${error.message}` : 'Project file is not valid JSON.');
  }
  if (!value || typeof value !== 'object') throw new Error('Project file envelope is invalid.');
  const envelope = value as Partial<ProjectFileEnvelope>;
  if (envelope.format !== FILE_FORMAT || envelope.version !== FILE_VERSION) throw new Error('Unsupported project file format or version.');
  if (!envelope.project || typeof envelope.checksum !== 'string') throw new Error('Project file is incomplete.');
  const actualChecksum = await checksumProject(envelope.project);
  if (actualChecksum !== envelope.checksum) throw new Error('Project file checksum does not match its contents.');

  const migrated = migrateProjectRecord(envelope.project);
  const issues = validateProjectRecord(migrated);
  if (issues.length > 0) throw new Error(`Project file validation failed: ${issues.join(' ')}`);
  const existing = await getProject(migrated.id);
  if (existing && !replaceExisting) {
    const imported: ProjectRecord = {
      ...structuredClone(migrated),
      id: crypto.randomUUID(),
      name: `${migrated.name} Imported`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revision: 1,
      status: 'active', archivedAt: undefined, trashedAt: undefined
    };
    return putImportedProject(imported);
  }
  if (existing) await createProjectSnapshot(existing, 'Automatic snapshot before project-file replacement', 'pre-import');
  return putImportedProject({ ...structuredClone(migrated), status: 'active', archivedAt: undefined, trashedAt: undefined });
}

export function downloadProjectFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.toLowerCase().endsWith('.cpmproj') ? filename : `${filename}.cpmproj`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function checksumProject(project: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableStringify(project));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}
