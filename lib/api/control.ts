import { apiFetch } from '../api-client';

/** Console controls (backend AdminControlService, /admin/control/*). Super admins only; every
 *  change is recorded in the audit log. */

export type NotifyGroup = 'CUSTOMERS' | 'PARTNERS' | 'OWNERS' | 'SHOP_BARBERS' | 'INDEPENDENT_BARBERS';
export interface NotifyTarget {
  userIds?: string[];
  tenantId?: string;
  group?: NotifyGroup;
  everyone?: boolean;
}

export const NOTIFY_GROUP_LABELS: Record<NotifyGroup, string> = {
  CUSTOMERS: 'All customers',
  PARTNERS: 'All partners (owners and barbers)',
  OWNERS: 'All shop owners',
  SHOP_BARBERS: 'Barbers working in shops',
  INDEPENDENT_BARBERS: 'Independent barbers',
};

export interface DeletionRequest {
  ticketId: string;
  status: 'PENDING' | 'CLOSED' | 'DONE';
  requestedAt: string;
  expiresAt?: string;
  daysRemaining?: number;
  isOverdue?: boolean;
  reason?: string;
  user?: { id: string; name: string | null; email: string; phone: string | null; role: string; deletedAt: string | null };
  owner: { id: string; name: string | null; email: string; phone: string | null; role?: string; deletedAt: string | null };
  shop: { id: string; name: string; listed: boolean; suspended: boolean } | null;
  upcomingBookings: number;
  teamMembers: number;
}

export interface Deletions {
  pending: number;
  requests: DeletionRequest[];
  deleted: { id: string; role: string; deletedAt: string; joinedAt: string; by: 'admin' | 'self'; note: string | null }[];
  totals: { deleted: number; deletedLast30Days: number; byRole: { role: string; count: number }[] };
}

export interface AdminService {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  durationMinutes: number;
  isActive: boolean;
  imageUrl: string | null;
  category: { name: string } | null;
}

const json = (method: string, body?: unknown) => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

export const getDeletions = () => apiFetch<Deletions>('/admin/control/deletions');
export const purgeExpiredDeletions = () =>
  apiFetch<{ purgedCount: number; purgedUserIds: string[] }>('/admin/control/deletions/purge-expired', json('POST'));
export const adminDeleteAccount = (userId: string, note?: string) =>
  apiFetch<{ status: 'DELETED'; shopClosed: string | null; bookingsCancelled: number }>(`/admin/control/users/${encodeURIComponent(userId)}/delete`, json('POST', { note }));
export const declineDeletion = (ticketId: string, message: string) =>
  apiFetch<{ status: string }>(`/admin/control/deletions/${encodeURIComponent(ticketId)}/decline`, json('POST', { message }));
export const adminUpdateAccount = (userId: string, body: { name?: string; phone?: string; email?: string; emailVerified?: boolean }) =>
  apiFetch<{ id: string; email: string; emailVerified: boolean; profile: { name: string | null; phone: string | null } | null }>(`/admin/control/users/${encodeURIComponent(userId)}`, json('PATCH', body));
export const adminSignOut = (userId: string) => apiFetch<{ sessionsEnded: number }>(`/admin/control/users/${encodeURIComponent(userId)}/sign-out`, json('POST'));
export const previewNotify = (target: NotifyTarget) =>
  apiFetch<{ recipients: number }>('/admin/control/notify/preview', json('POST', { ...target, title: 'preview', body: 'preview' }));
export const sendNotify = (target: NotifyTarget & { title: string; body: string; push: boolean }) =>
  apiFetch<{ sent: number; pushDevices: number }>('/admin/control/notify', json('POST', target));
export const listAdminServices = (owner: { tenantId?: string; barberId?: string }) =>
  apiFetch<AdminService[]>(`/admin/control/services?${new URLSearchParams(owner.tenantId ? { tenantId: owner.tenantId } : { barberId: owner.barberId ?? '' }).toString()}`);
export const updateAdminService = (id: string, body: { name?: string; price?: number; durationMinutes?: number; isActive?: boolean; description?: string | null }) =>
  apiFetch<AdminService>(`/admin/control/services/${encodeURIComponent(id)}`, json('PATCH', body));
