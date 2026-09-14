import { apiFetch } from '../api-client';

/** Mirrors `model WorkingHours` — the barber's own declared weekly pattern, distinct from the
 *  materialized ScheduleSlot rows (see lib/api/schedule.ts). Free-text time strings ("09:00 AM"),
 *  matching what the barber-app's UI actually collects. */
export interface DaySchedule {
  day: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  breakTime: string;
  breakEndTime?: string;
}

export interface WorkingHours {
  id: string;
  schedule: DaySchedule[];
  bufferBeforeMin: number;
  bufferAfterMin: number;
  minNotice: string;
  bookingWindow: string;
}

/** SUPER_ADMIN-only cross-view — see working-hours.controller.ts's GET /working-hours/:userId. */
export function getWorkingHoursFor(userId: string): Promise<WorkingHours> {
  return apiFetch<WorkingHours>(`/working-hours/${encodeURIComponent(userId)}`);
}
