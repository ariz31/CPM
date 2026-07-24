import { registerSW } from 'virtual:pwa-register';
import { createProjectSnapshot, listProjects } from './projectRepository';

export type PwaReleaseState = 'idle' | 'offline-ready' | 'update-available' | 'preparing-update' | 'failed';
export const APPLICATION_RELEASE_VERSION = '1.0.0-rc.1';

let state: PwaReleaseState = 'idle';
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;
const listeners = new Set<(state: PwaReleaseState) => void>();

export function initializePwaUpdateControl(): void {
  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh: () => setState('update-available'),
    onOfflineReady: () => setState('offline-ready'),
    onRegisterError: () => setState('failed')
  });
  const previous = localStorage.getItem('cpm-current-release');
  if (previous && previous !== APPLICATION_RELEASE_VERSION) localStorage.setItem('cpm-previous-release', previous);
  localStorage.setItem('cpm-current-release', APPLICATION_RELEASE_VERSION);
}

export function subscribePwaReleaseState(listener: (next: PwaReleaseState) => void): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

export async function applyPendingPwaUpdate(): Promise<void> {
  if (!updateServiceWorker) throw new Error('The service-worker update controller is not initialized.');
  setState('preparing-update');
  try {
    const projects = await listProjects(['active', 'archived']);
    for (const project of projects) {
      await createProjectSnapshot(project, `Automatic pre-update snapshot ${APPLICATION_RELEASE_VERSION}`, 'recovery');
    }
    localStorage.setItem('cpm-update-prepared-at', new Date().toISOString());
    await updateServiceWorker(true);
  } catch (error) {
    setState('failed');
    throw error;
  }
}

export function getPwaReleaseMetadata(): { current: string; previous?: string; preparedAt?: string } {
  return {
    current: localStorage.getItem('cpm-current-release') ?? APPLICATION_RELEASE_VERSION,
    previous: localStorage.getItem('cpm-previous-release') ?? undefined,
    preparedAt: localStorage.getItem('cpm-update-prepared-at') ?? undefined
  };
}

function setState(next: PwaReleaseState): void {
  state = next;
  for (const listener of listeners) listener(next);
}
