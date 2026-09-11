import { apiFetch } from '../api-client';

export interface Subscription {
  id: string;
  tenantId: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE' | string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | string;
  currentPeriodEnd: string;
}

export function listSubscriptions(): Promise<Subscription[]> {
  return apiFetch<Subscription[]>('/subscriptions');
}

export function updateSubscription(
  tenantId: string,
  input: { plan: string; status?: string; currentPeriodEnd?: string },
): Promise<Subscription> {
  return apiFetch<Subscription>(`/subscriptions/${encodeURIComponent(tenantId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
