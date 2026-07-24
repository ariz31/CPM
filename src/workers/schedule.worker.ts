/// <reference lib="webworker" />
import { calculateSchedule } from '../domain/schedule/cpm';
import type { ScheduleProject, ScheduleResult } from '../domain/schedule/types';

interface CalculateRequest {
  type: 'CALCULATE';
  requestId: string;
  projectRevision: number;
  project: ScheduleProject;
}

interface CancelRequest {
  type: 'CANCEL';
  requestId: string;
}

type WorkerRequest = CalculateRequest | CancelRequest;

interface WorkerSuccess {
  type: 'RESULT';
  requestId: string;
  projectRevision: number;
  result: ScheduleResult;
}

interface WorkerFailure {
  type: 'ERROR';
  requestId: string;
  projectRevision?: number;
  error: string;
}

const cancelled = new Set<string>();

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === 'CANCEL') {
    cancelled.add(request.requestId);
    return;
  }
  try {
    const result = calculateSchedule(request.project);
    if (cancelled.delete(request.requestId)) return;
    const response: WorkerSuccess = {
      type: 'RESULT',
      requestId: request.requestId,
      projectRevision: request.projectRevision,
      result
    };
    self.postMessage(response);
  } catch (error) {
    if (cancelled.delete(request.requestId)) return;
    const response: WorkerFailure = {
      type: 'ERROR',
      requestId: request.requestId,
      projectRevision: request.projectRevision,
      error: error instanceof Error ? error.message : 'Unknown schedule calculation failure.'
    };
    self.postMessage(response);
  }
});
