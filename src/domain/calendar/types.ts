export interface WorkInterval {
  startMinute: number;
  endMinute: number;
}

export interface CalendarException {
  date: string;
  working: boolean;
  intervals?: WorkInterval[];
  name?: string;
}

export interface WorkCalendar {
  id: string;
  name: string;
  timezone: string;
  standardMinutesPerDay: number;
  week: Record<number, WorkInterval[]>;
  holidays: string[];
  exceptions: CalendarException[];
}

export interface WorkInstant {
  date: string;
  minute: number;
}

export interface CalendarValidationIssue {
  code: string;
  message: string;
}
