import { apiFetch } from '../api-client';

/** Mirrors ScheduleController's day/range slot DTOs (service-booking). SUPER_ADMIN is explicitly
 *  unrestricted on staffId here — see schedule.controller.ts's getDay/getRange — so this works for
 *  any barber's id with no special wiring on the backend. */
export interface ScheduleSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: string;
  status?: string;
  notes?: string;
  source?: string;
  /** Present only on a slot synthesised from a real booking rather than a declared slot. */
  appointmentId?: string;
  clientName?: string;
  title?: string;
}

export interface ScheduleDay {
  date: string;
  slots: ScheduleSlot[];
}

export function getScheduleRange(staffId: string, from: string, to: string): Promise<ScheduleDay[]> {
  const query = new URLSearchParams({ staffId, from, to });
  return apiFetch<ScheduleDay[]>(`/schedule/range?${query.toString()}`);
}
