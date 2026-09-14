import { apiFetch } from '../api-client';

/** Mirrors service-payment `model MembershipPlan` — a shop's own membership tiers, distinct from
 *  the platform's Tenant Subscription (that's the shop's billing plan to the platform; this is
 *  what the shop sells to its own customers). GET /membership-plans is public — customer-app shop
 *  pages show it to logged-out visitors — so this needed no backend change. */
export interface MembershipPlan {
  id: string;
  tenantId: string;
  name: string;
  price: string | number;
  billingPeriodMonths: number;
  benefitDescription: string | null;
  includedBookings: number | null;
  discountPercent: string | number | null;
  active: boolean;
}

export function listMembershipPlans(tenantId: string): Promise<MembershipPlan[]> {
  return apiFetch<MembershipPlan[]>(`/membership-plans?tenantId=${encodeURIComponent(tenantId)}`);
}
