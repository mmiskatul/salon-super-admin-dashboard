import { apiFetch } from '../api-client';

/** Mirrors service-booking `model Appointment`. */
export interface Appointment {
  id: string;
  tenantId: string | null;
  staffId: string;
  customerId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  serviceId: string | null;
  serviceName: string | null;
  durationMinutes: number | null;
  startAt: string;
  endAt: string;
  price: string | number;
  status: string;
  isWalkIn: boolean;
  cancellationReason: string | null;
  cancelledBy: string | null;
  couponCode: string | null;
  discountAmount: string | number | null;
  createdAt: string;
}

/** Mirrors service-booking `model Review`. */
export interface Review {
  id: string;
  tenantId: string | null;
  customerId: string;
  staffId: string | null;
  serviceId: string | null;
  appointmentId: string | null;
  rating: number;
  comment: string | null;
  replyText: string | null;
  replyAt: string | null;
  createdAt: string;
}

/** Every status string service-booking writes to `Appointment.status`. */
export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

/**
 * A shop's appointments, optionally narrowed to one day.
 *
 * `date` is an ISO yyyy-mm-dd; omit it for the shop's full history. There is no cross-tenant
 * appointment endpoint, so anything platform-wide is assembled by fanning this out over the
 * roster — see lib/api/platform.ts.
 */
export function listAppointments(tenantId: string, day?: string): Promise<Appointment[]> {
  const params = new URLSearchParams({ tenantId });
  if (day) params.set('date', day);
  return apiFetch<Appointment[]>(`/appointments?${params.toString()}`);
}

export function listReviews(tenantId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/reviews?tenantId=${encodeURIComponent(tenantId)}`);
}
