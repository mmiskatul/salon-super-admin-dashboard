import { apiFetch } from '../api-client';

/** Mirrors `model AdminAction` — every mutating action a platform operator has taken, recorded by
 *  AdminAuditService on the backend: shops, users, reviews, coupons, loyalty, wallets, bookings,
 *  reports and broadcasts. */
export interface AdminAction {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminActionPage {
  data: AdminAction[];
  total: number;
  page: number;
  limit: number;
}

export function listAdminActions(query?: {
  targetType?: string;
  page?: number;
  limit?: number;
}): Promise<AdminActionPage> {
  const params = new URLSearchParams();
  if (query?.targetType) params.set('targetType', query.targetType);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return apiFetch<AdminActionPage>(`/admin-actions${qs ? `?${qs}` : ''}`);
}
