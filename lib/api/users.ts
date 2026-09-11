import { apiFetch } from '../api-client';

export interface PlatformUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'BARBER' | 'STAFF' | 'OWNER' | 'SUPER_ADMIN' | string;
  tenantId: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export function listUsers(query?: { search?: string; role?: string }): Promise<PlatformUser[]> {
  const params = new URLSearchParams();
  if (query?.search) params.set('search', query.search);
  if (query?.role) params.set('role', query.role);
  const qs = params.toString();
  return apiFetch<PlatformUser[]>(`/auth/users${qs ? `?${qs}` : ''}`);
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

