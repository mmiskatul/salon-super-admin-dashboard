import { apiFetch } from '../api-client';
import type { Appointment, Review } from './bookings';
import type { GiftCard } from './giftCards';
import type { Transaction } from './finance';
import type { Staff } from './people';
import type { ServiceItem } from './catalog';
import type { Client, Location, ShopHours, Tenant } from './tenants';

export interface ShopDashboardDetail {
  tenant: Tenant;
  staff: Staff[];
  services: ServiceItem[];
  appointments: Appointment[];
  reviews: Review[];
  transactions: Transaction[];
  giftCards: GiftCard[];
  locations: Location[];
  shopHours: ShopHours | null;
  clients: Client[];
}

export function getShopDashboard(tenantId: string): Promise<ShopDashboardDetail> {
  return apiFetch<ShopDashboardDetail>(`/dashboard/shops/${encodeURIComponent(tenantId)}`);
}
