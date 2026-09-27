import { apiFetch } from '../api-client';
import type { Tenant, Location, ShopHours, Client } from './tenants';
import type { Staff } from './people';
import type { ServiceItem } from './catalog';
import type { Appointment, Review } from './bookings';
import type { Transaction } from './finance';

export interface OwnerDashboardSummary {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhone: string | null;
  ownerCreatedAt: string;
  isBanned: boolean;
  bannedReason: string | null;
  tenantId: string;
  tenantName: string;
  businessType: string;
  brandColor: string | null;
  logoUrl: string | null;
  joinCode: string | null;
  isSuspended: boolean;
  suspendedReason: string | null;
  isListed: boolean;
  tenantCreatedAt: string;
  barbersCount: number;
  clientsCount: number;
  servicesCount: number;
  appointmentsCount: number;
  revenueTotal: number;
  locationsCount: number;
  ratingAvg: string | number;
  ratingCount: number;
}

export interface OwnerDashboardDetail {
  owner: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    isBanned: boolean;
    bannedReason: string | null;
    bannedAt: string | null;
    createdAt: string;
  };
  tenant: Tenant;
  metrics: {
    barbersCount: number;
    clientsCount: number;
    servicesCount: number;
    appointmentsCount: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    revenueTotal: number;
    locationsCount: number;
    ratingAvg: string | number;
    ratingCount: number;
  };
  barbers: Staff[];
  clients: Client[];
  appointments: Appointment[];
  services: ServiceItem[];
  transactions: Transaction[];
  locations: Location[];
  shopHours: ShopHours | null;
  reviews: Review[];
}

/**
 * Every owner with their shop's headline numbers, computed server-side (GET /dashboard/owners).
 * This used to fall back to rebuilding the list in the browser (seven requests per owner) when
 * the endpoint failed; a failure now surfaces as an error instead of a request storm against a
 * backend that is already struggling.
 */
export function listOwnerDashboards(): Promise<OwnerDashboardSummary[]> {
  return apiFetch<OwnerDashboardSummary[]>('/dashboard/owners');
}

/** One owner's shop in detail (GET /dashboard/owners/:id). */
export function getOwnerDashboard(id: string): Promise<OwnerDashboardDetail> {
  return apiFetch<OwnerDashboardDetail>(`/dashboard/owners/${encodeURIComponent(id)}`);
}
