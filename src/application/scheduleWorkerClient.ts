import type { ScheduleProject, ScheduleResult } from '../domain/schedule/types';

interface WorkerResponse {
  id: string;
  ok: boolean;
  result?: ScheduleResult;
  error?: string;
}

interface PendingRequest {
  resolve: (result: ScheduleResult) => void;
  reject: (error: Error) => void;
  timeoutId: number;
}

let worker: Worker | undefined;
const pending = new Map<string, PendingRequest>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/schedule.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const request = pending.get(event.data.id);
      if (!request) {
        return;
      }
      window.clearTimeout(request.timeoutId);
      pending.delete(event.data.id);

      if (event.data.ok && event.data.result) {
        request.resolve(event.data.result);
      } else {
        request.reject(new Error(event.data.error ?? 'Schedule worker failed.'));
      }
    };
    worker.onerror = () => {
      for (const request of pending.values()) {
        window.clearTimeout(request.timeoutId);
        request.reject(new Error('Schedule worker terminated unexpectedly.'));
      }
      pending.clear();
      worker?.terminate();
      worker = undefined;
    };
  }
  return worker;
}

export function calculateScheduleInWorker(input: ScheduleProject): Promise<ScheduleResult> {
  const id = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error('Schedule calculation exceeded the 30-second safety limit.'));
    }, 30_000);

    pending.set(id, { resolve, reject, timeoutId });
    getWorker().postMessage({ id, input });
  });
}
