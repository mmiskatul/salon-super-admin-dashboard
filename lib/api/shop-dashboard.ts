import { apiFetch } from '../api-client';
import type { Appointment, Review } from './bookings';
import type { GiftCard } from './giftCards';
import type { MembershipPlan } from './memberships';
import type { Transaction } from './finance';
import type { Staff } from './people';
import type { ServiceItem } from './catalog';
import type { Client, Location, Product, ShopHours, StoredFile, Tenant } from './tenants';

export interface ShopDashboardDetail {
  tenant: Tenant;
  staff: Staff[];
  services: ServiceItem[];
  appointments: Appointment[];
  reviews: Review[];
  transactions: Transaction[];
  membershipPlans: MembershipPlan[];
  giftCards: GiftCard[];
  locations: Location[];
  shopHours: ShopHours | null;
  products: Product[];
  clients: Client[];
  files: StoredFile[];
}

export function getShopDashboard(tenantId: string): Promise<ShopDashboardDetail> {
  return apiFetch<ShopDashboardDetail>(`/dashboard/shops/${encodeURIComponent(tenantId)}`);
}
