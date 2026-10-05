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
  /** The person's name (their profile), when they have set one. */
  name?: string | null;
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

export async function getUser(id: string): Promise<PlatformUser & { name?: string; phone?: string; avatarUrl?: string }> {
  try {
    return await apiFetch<PlatformUser & { name?: string; phone?: string; avatarUrl?: string }>(
      `/auth/users/${encodeURIComponent(id)}`
    );
  } catch (err: any) {
    if (err?.status === 404 || err?.statusCode === 404) {
      // Fallback for backends where /auth/users/:id is pending deploy
      const res = await listUsers({ search: id, limit: 10 });
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      const found = list.find((u) => u.id === id);
      if (found) return found;
    }
    throw err;
  }
}

export async function getUserWallet(ownerId: string): Promise<UserWallet | null> {
  try {
    const res = await apiFetch<any>(`/wallets/${encodeURIComponent(ownerId)}`);
    if (res && typeof res === 'object') {
      if ('data' in res && res.data) return res.data as UserWallet;
      return res as UserWallet;
    }
    return null;
  } catch {
    return null;
  }
}

/** Credit (positive) or debit (negative) someone's wallet by hand, with the reason they will see
 *  on their ledger. SUPER_ADMIN; recorded in the audit log. A debit can't go below zero. */
export function adjustWallet(ownerId: string, delta: number, reason: string): Promise<UserWallet> {
  return apiFetch<UserWallet>('/wallets/adjust', {
    method: 'POST',
    body: JSON.stringify({ ownerId, delta, reason }),
  });
}

export async function getUserWalletEntries(ownerId: string): Promise<UserWalletEntry[]> {
  try {
    const res = await apiFetch<any>(`/wallets/${encodeURIComponent(ownerId)}/entries`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.entries)) return res.entries;
    return [];
  } catch {
    return [];
  }
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

