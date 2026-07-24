/// <reference lib="webworker" />

import { calculateSchedule } from '../domain/schedule/cpm';
import type { ScheduleProject, ScheduleResult } from '../domain/schedule/types';

interface CalculateRequest {
  id: string;
  input: ScheduleProject;
}

interface CalculateSuccess {
  id: string;
  ok: true;
  result: ScheduleResult;
}

interface CalculateFailure {
  id: string;
  ok: false;
  error: string;
}

self.onmessage = (event: MessageEvent<CalculateRequest>) => {
  const { id, input } = event.data;

  try {
    const response: CalculateSuccess = { id, ok: true, result: calculateSchedule(input) };
    self.postMessage(response);
  } catch (error) {
    const response: CalculateFailure = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown scheduling failure.'
    };
    self.postMessage(response);
  }
};

export {};
