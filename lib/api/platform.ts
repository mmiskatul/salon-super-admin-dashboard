import { apiFetch } from '../api-client';
import type { Tenant } from './tenants';

/**
 * Platform-wide numbers for the overview and the shop roster. The backend computes them across
 * every shop in a fixed number of grouped queries (GET /dashboard/platform-overview, -vitals,
 * -charts; SUPER_ADMIN only, cached briefly server-side). This dashboard used to assemble them
 * itself by fanning out five requests per shop from the browser; that path is gone.
 *
 * A number the backend could not compute is `null`, never `0`: a shop whose staff count is
 * unknown is not a shop with no staff, and rolling those together would understate every total.
 */

export type Vitality = 'live' | 'idle' | 'dormant' | 'unknown';

export interface TenantVitals {
  tenantId: string;
  staff: number | null;
  services: number | null;
  activeServices: number | null;
  appointments: number | null;
  upcoming: number | null;
  completed: number | null;
  cancelled: number | null;
  reviews: number | null;
  revenue: number | null;
  lastBookingAt: string | null;
  /** Which numbers the backend could not compute for this shop, so a row can say what is missing. */
  failed: string[];
}

export interface PlatformSummaryDto {
  totalTenants: number;
  liveTenants: number;
  idleTenants: number;
  dormantTenants: number;
  totalRevenue: number;
  /** The platform's own income: shop subscriptions (bookings carry no platform fee). */
  platformNetEarnings: number;
  subscriptionMrr: number;
  activeSubscriptions?: number;
  /** Bookings still to be paid at the counter, across all shops. */
  pendingPaymentsAmount?: number;
  pendingPaymentsCount?: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  upcomingAppointments: number;
  totalStaff: number;
  totalServices: number;
  totalReviews: number;
  currency: string;
}

export interface PlatformOverviewDto {
  summary: PlatformSummaryDto;
  vitals: TenantVitals[];
  tenants: Tenant[];
  funnel: {
    stages: Array<{ name: string; count: number; pct: number }>;
    stalledShops: Array<{ id: string; name: string; slug: string | null; brandColor: string | null; missing: string[] }>;
  };
  leaderboard: Array<{
    id: string;
    name: string;
    brandColor: string;
    appointments: number;
    revenue: number;
    staff: number;
  }>;
  outcomes: {
    completed: number;
    upcoming: number;
    cancelled: number;
    total: number;
  };
  trustPulse: {
    qualityScore: number;
    completionRate: number;
    disputeRate: number;
    activeTickets: number;
  };
}

export interface PlatformChartsDto {
  period: string;
  labels: string[];
  revenueTrend: {
    labels: string[];
    current: number[];
    previous: number[];
    netEarnings: number[];
  };
  appointmentsTrend: {
    labels: string[];
    data: number[];
  };
  tenantGrowth: {
    labels: string[];
    data: number[];
  };
}

export type PlatformPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export function fetchPlatformOverview(period?: PlatformPeriod): Promise<PlatformOverviewDto> {
  const query = period ? `?period=${encodeURIComponent(period)}` : '';
  return apiFetch<PlatformOverviewDto>(`/dashboard/platform-overview${query}`);
}

export function fetchPlatformCharts(period: PlatformPeriod = 'Monthly'): Promise<PlatformChartsDto> {
  return apiFetch<PlatformChartsDto>(`/dashboard/platform-charts?period=${encodeURIComponent(period)}`);
}

export function fetchPlatformVitals(period?: PlatformPeriod): Promise<TenantVitals[]> {
  const query = period ? `?period=${encodeURIComponent(period)}` : '';
  return apiFetch<TenantVitals[]>(`/dashboard/platform-vitals${query}`);
}

/**
 * How alive a shop is, derived from what it actually has rather than from a status column — the
 * backend has no such column, and `isListed` only says whether customers can find the shop.
 *
 *  dormant — signed up, never furnished: no staff and no services. This is the number worth acting
 *            on, and the reason the roster computes vitals at all.
 *  idle    — set up, but has never taken a booking.
 *  live    — has bookings.
 *  unknown — the numbers that would decide it are not available.
 */
export function vitalityOf(v: TenantVitals | undefined): Vitality {
  if (!v) return 'unknown';
  if (v.staff === null && v.services === null && v.appointments === null) return 'unknown';
  if ((v.appointments ?? 0) > 0) return 'live';
  if ((v.staff ?? 0) === 0 && (v.services ?? 0) === 0) return 'dormant';
  return 'idle';
}

export interface PlatformTotals {
  tenants: number;
  listed: number;
  staff: number;
  services: number;
  appointments: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  reviews: number;
  revenue: number;
  dormant: number;
  idle: number;
  live: number;
  /** Shops with at least one number missing — the totals below are short by these shops. */
  incomplete: number;
}

export function totalsOf(vitals: TenantVitals[], tenants: Tenant[]): PlatformTotals {
  const totals: PlatformTotals = {
    tenants: tenants.length,
    listed: tenants.filter((t) => t.isListed).length,
    staff: 0,
    services: 0,
    appointments: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    reviews: 0,
    revenue: 0,
    dormant: 0,
    idle: 0,
    live: 0,
    incomplete: 0,
  };

  for (const v of vitals) {
    totals.staff += v.staff ?? 0;
    totals.services += v.services ?? 0;
    totals.appointments += v.appointments ?? 0;
    totals.upcoming += v.upcoming ?? 0;
    totals.completed += v.completed ?? 0;
    totals.cancelled += v.cancelled ?? 0;
    totals.reviews += v.reviews ?? 0;
    totals.revenue += v.revenue ?? 0;
    if (v.failed.length > 0) totals.incomplete += 1;

    const vitality = vitalityOf(v);
    if (vitality === 'dormant') totals.dormant += 1;
    else if (vitality === 'idle') totals.idle += 1;
    else if (vitality === 'live') totals.live += 1;
  }

  return totals;
}
