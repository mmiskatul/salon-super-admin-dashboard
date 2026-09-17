import { apiFetch } from '../api-client';

export interface PlanDefinition {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  description: string;
  staffLimit: number;
  locationLimit: number;
  features: string[];
  recommended?: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE' | string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | string;
  billingCycle?: 'MONTHLY' | 'YEARLY' | string;
  amount?: number;
  currency?: string;
  currentPeriodStart?: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tenantName?: string;
  tenantBrandColor?: string | null;
  tenantLogoUrl?: string | null;
  tenantEmail?: string | null;
  planTitle?: string;
  daysRemaining?: number;
  isExpired?: boolean;
}

export function listSubscriptions(params?: {
  status?: string;
  plan?: string;
  search?: string;
}): Promise<Subscription[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.plan && params.plan !== 'ALL') query.set('plan', params.plan);
  if (params?.search) query.set('search', params.search);
  const qStr = query.toString();
  return apiFetch<Subscription[]>(`/subscriptions${qStr ? `?${qStr}` : ''}`);
}

export function getSubscription(tenantId: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/subscriptions/${encodeURIComponent(tenantId)}`);
}

export function listAvailablePlans(): Promise<PlanDefinition[]> {
  return apiFetch<PlanDefinition[]>('/subscriptions/plans/available');
}

export function updateSubscription(
  tenantId: string,
  input: {
    plan?: string;
    status?: string;
    billingCycle?: string;
    amount?: number;
    currency?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<Subscription> {
  return apiFetch<Subscription>(`/subscriptions/${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function cancelSubscription(
  tenantId: string,
  immediate = false,
  reason?: string,
): Promise<Subscription> {
  return apiFetch<Subscription>(`/subscriptions/${encodeURIComponent(tenantId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ immediate, reason }),
  });
}

export function reactivateSubscription(tenantId: string): Promise<Subscription> {
  return apiFetch<Subscription>(`/subscriptions/${encodeURIComponent(tenantId)}/reactivate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
