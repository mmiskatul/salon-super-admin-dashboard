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
  // Resolved server-side, additive on top of the raw fields above.
  customerName?: string | null;
  customerPhone?: string | null;
  customerAvatarUrl?: string | null;
  staffName?: string | null;
  tenantName?: string | null;
  tenantBrandColor?: string | null;
  tenantLogoUrl?: string | null;
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
  'IN_QUEUE',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;

export interface ListAppointmentsParams {
  tenantId?: string;
  day?: string;
  date?: string;
  status?: string;
  staffId?: string;
  customerId?: string;
  from?: string;
  to?: string;
}

/**
 * Lists appointments. Can be scoped to a single shop or queried cross-platform by SUPER_ADMIN.
 * Backward-compatible with `listAppointments(tenantId, day)` or `listAppointments({ ...params })`.
 */
export function listAppointments(
  arg1?: string | ListAppointmentsParams,
  arg2?: string,
): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (typeof arg1 === 'object' && arg1 !== null) {
    if (arg1.tenantId) params.set('tenantId', arg1.tenantId);
    const date = arg1.date ?? arg1.day;
    if (date) params.set('date', date);
    if (arg1.status && arg1.status !== 'ALL') params.set('status', arg1.status);
    if (arg1.staffId) params.set('staffId', arg1.staffId);
    if (arg1.customerId) params.set('customerId', arg1.customerId);
    if (arg1.from) params.set('from', arg1.from);
    if (arg1.to) params.set('to', arg1.to);
  } else {
    if (arg1) params.set('tenantId', arg1);
    if (arg2) params.set('date', arg2);
  }
  const query = params.toString();
  return apiFetch<Appointment[]>(`/appointments${query ? `?${query}` : ''}`);
}

export function updateAppointmentStatus(
  id: string,
  status: string,
  cancellationReason?: string,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, cancellationReason }),
  });
}

export function cancelAppointment(id: string, reason?: string): Promise<Appointment> {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return apiFetch<Appointment>(`/appointments/${encodeURIComponent(id)}${query}`, {
    method: 'DELETE',
  });
}

export function listReviews(tenantId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/reviews?tenantId=${encodeURIComponent(tenantId)}`);
}

/** Platform moderation — removes a review outright. SUPER_ADMIN only; no self-service equivalent
 *  exists for an OWNER/barber. Answers 204 with no body. */
export function removeReview(id: string): Promise<void> {
  return apiFetch<void>(`/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
