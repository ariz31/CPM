import type { ScheduleProject, ScheduleResult } from '../domain/schedule/types';

interface PendingRequest {
  resolve: (result: ScheduleResult) => void;
  reject: (error: Error) => void;
  timeout: number;
  revision: number;
}

interface WorkerResponse {
  type: 'RESULT' | 'ERROR';
  requestId: string;
  projectRevision?: number;
  result?: ScheduleResult;
  error?: string;
}

let worker: Worker | undefined;
const pending = new Map<string, PendingRequest>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/schedule.worker.ts', import.meta.url), { type: 'module' });
  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const response = event.data;
    const request = pending.get(response.requestId);
    if (!request) return;
    pending.delete(response.requestId);
    window.clearTimeout(request.timeout);
    if (!isWorkerResponseCurrent(request.revision, response.projectRevision)) {
      request.reject(new Error('Discarded stale schedule result.'));
      return;
    }
    if (response.type === 'RESULT' && response.result) request.resolve(response.result);
    else request.reject(new Error(response.error ?? 'Unable to calculate the schedule.'));
  });
  worker.addEventListener('error', () => {
    for (const request of pending.values()) {
      window.clearTimeout(request.timeout);
      request.reject(new Error('The schedule worker stopped unexpectedly.'));
    }
    pending.clear();
    worker?.terminate();
    worker = undefined;
  });
  return worker;
}

export function calculateScheduleInWorker(
  project: ScheduleProject,
  projectRevision: number,
  timeoutMs = 30_000
): { requestId: string; result: Promise<ScheduleResult>; cancel: () => void } {
  const requestId = crypto.randomUUID();
  const target = getWorker();
  const result = new Promise<ScheduleResult>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      pending.delete(requestId);
      target.postMessage({ type: 'CANCEL', requestId });
      reject(new Error('Schedule calculation exceeded the 30-second safety limit.'));
    }, timeoutMs);
    pending.set(requestId, { resolve, reject, timeout, revision: projectRevision });
    target.postMessage({ type: 'CALCULATE', requestId, projectRevision, project });
  });

  return {
    requestId,
    result,
    cancel: () => {
      const request = pending.get(requestId);
      if (!request) return;
      window.clearTimeout(request.timeout);
      pending.delete(requestId);
      target.postMessage({ type: 'CANCEL', requestId });
      request.reject(new Error('Schedule calculation was cancelled.'));
    }
  };
}

export function isWorkerResponseCurrent(expectedRevision: number, responseRevision?: number): boolean {
  return responseRevision === expectedRevision;
}
