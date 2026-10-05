import { apiFetch } from '../api-client';

/** Mirrors service-user `model Ticket` with its messages included. */
export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId: string;
  /** Who raised it (their profile name), for the inbox. */
  userName?: string | null;
  tenantId: string | null;
  subject: string;
  category?: string;
  status: string;
  createdAt: string;
  messages?: TicketMessage[];
}

/** Must match TICKET_STATUSES in the backend's ticket.dto.ts exactly — this previously said
 *  'PENDING', which the backend has never accepted (its real value is 'IN_PROGRESS'), so setting
 *  that status from this console always failed and filtering by it always returned nothing. */
export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

/**
 * Lists tickets across the platform with optional status and category filters.
 */
export function listTickets(filters?: { status?: string; category?: string }): Promise<Ticket[]> {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.category) query.set('category', filters.category);
  const qs = query.toString();
  return apiFetch<Ticket[]>(`/tickets${qs ? `?${qs}` : ''}`);
}

export function getTicket(id: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${encodeURIComponent(id)}`);
}

export function replyToTicket(id: string, body: string): Promise<TicketMessage> {
  return apiFetch<TicketMessage>(`/tickets/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function setTicketStatus(id: string, status: string): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
