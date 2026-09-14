import { apiFetch } from '../api-client';

export interface PlatformUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'BARBER' | 'STAFF' | 'OWNER' | 'SUPER_ADMIN' | string;
  tenantId: string | null;
  emailVerified: boolean;
  isBanned: boolean;
  bannedReason: string | null;
  bannedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUserPage {
  data: PlatformUser[];
  total: number;
  page: number;
  limit: number;
}

export function listUsers(query?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<PlatformUserPage> {
  const params = new URLSearchParams();
  if (query?.search) params.set('search', query.search);
  if (query?.role) params.set('role', query.role);
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return apiFetch<PlatformUserPage>(`/auth/users${qs ? `?${qs}` : ''}`);
}

export interface UserWallet {
  id: string;
  ownerId: string;
  balance: string | number;
  currency: string;
}

export interface UserWalletEntry {
  id: string;
  ownerId: string;
  type: string;
  amount: string | number;
  balanceAfter: string | number;
  label: string;
  status: string;
  createdAt: string;
}

export function getUserWallet(ownerId: string): Promise<UserWallet> {
  return apiFetch<UserWallet>(`/wallets/${encodeURIComponent(ownerId)}`);
}

export function getUserWalletEntries(ownerId: string): Promise<UserWalletEntry[]> {
  return apiFetch<UserWalletEntry[]>(`/wallets/${encodeURIComponent(ownerId)}/entries`);
}

/** Blocks login and any future token refresh — see AuthService.banUser(). A SUPER_ADMIN account
 *  cannot be targeted (rejected server-side). */
export function banUser(id: string, reason?: string): Promise<PlatformUser> {
  return apiFetch<PlatformUser>(`/auth/users/${encodeURIComponent(id)}/ban`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export function unbanUser(id: string): Promise<PlatformUser> {
  return apiFetch<PlatformUser>(`/auth/users/${encodeURIComponent(id)}/unban`, { method: 'PATCH' });
}

