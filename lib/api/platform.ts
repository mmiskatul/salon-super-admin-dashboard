import { apiFetch } from '../api-client';
import { toNumber } from '../format';
import { listAppointments, listReviews, type Appointment } from './bookings';
import { listServices } from './catalog';
import { listTransactions } from './finance';
import { listStaff } from './people';
import type { Tenant } from './tenants';

/**
 * Platform-wide numbers, assembled client-side.
 *
 * There is no cross-tenant aggregate anywhere in the backend: `GET /tenants` is the only call that
 * spans the platform, and every other list endpoint takes a `tenantId`. So the honest way to answer
 * "how many bookings does the platform have" is to fan out over the roster and add them up, which
 * is what this module does.
 *
 * Two consequences are designed for rather than hidden:
 *  - It is N tenants x 5 requests, so it runs pooled (see `probeAll`) and reports each tenant as it
 *    lands instead of blocking on the slowest one.
 *  - A probe that fails leaves `null`, never `0`. A shop whose staff call 500s is not a shop with
 *    no staff, and rolling those together would quietly understate every platform total.
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
  /** Names of the probes that failed, so a row can say which number is missing and why. */
  failed: string[];
}

const PROBE_KEYS = ['staff', 'services', 'appointments', 'reviews', 'transactions'] as const;

function emptyVitals(tenantId: string): TenantVitals {
  return {
    tenantId,
    staff: null,
    services: null,
    activeServices: null,
    appointments: null,
    upcoming: null,
    completed: null,
    cancelled: null,
    reviews: null,
    revenue: null,
    lastBookingAt: null,
    failed: [],
  };
}

/**
 * Revenue counts only transactions the backend considers settled.
 *
 * service-payment writes `Transaction.status` as PENDING on create and moves it on from there, so
 * summing every row would bill the platform for charges that never completed.
 */
const SETTLED = new Set(['COMPLETED', 'PAID', 'SUCCEEDED', 'CAPTURED']);

function isSettled(status: string): boolean {
  return SETTLED.has(String(status ?? '').toUpperCase());
}

function summariseAppointments(rows: Appointment[]) {
  const now = Date.now();
  let upcoming = 0;
  let completed = 0;
  let cancelled = 0;
  let lastBookingAt: string | null = null;

  for (const row of rows) {
    const status = String(row.status ?? '').toUpperCase();
    if (status === 'COMPLETED') completed += 1;
    else if (status === 'CANCELLED' || status === 'NO_SHOW') cancelled += 1;
    else if (new Date(row.startAt).getTime() >= now) upcoming += 1;

    if (!lastBookingAt || new Date(row.createdAt) > new Date(lastBookingAt)) {
      lastBookingAt = row.createdAt;
    }
  }

  return { total: rows.length, upcoming, completed, cancelled, lastBookingAt };
}

/**
 * The real fix for the N-tenant sweep below: one backend call that computes every tenant's vitals
 * in a fixed number of grouped queries (`GET /dashboard/platform-vitals`, SUPER_ADMIN-only), rather
 * than 5 requests x N tenants fanned out from the browser. Same `TenantVitals` shape, so callers
 * don't need to change — see `usePlatform`, which tries this first and only falls back to
 * `probeAll` if it fails (e.g. talking to a backend deployment that predates this endpoint).
 */
export interface PlatformSummaryDto {
  totalTenants: number;
  liveTenants: number;
  idleTenants: number;
  dormantTenants: number;
  totalRevenue: number;
  platformNetEarnings: number;
  subscriptionMrr: number;
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

export function fetchPlatformOverview(): Promise<PlatformOverviewDto> {
  return apiFetch<PlatformOverviewDto>('/dashboard/platform-overview');
}

export function fetchPlatformCharts(period = 'Monthly'): Promise<PlatformChartsDto> {
  return apiFetch<PlatformChartsDto>(`/dashboard/platform-charts?period=${encodeURIComponent(period)}`);
}

export function fetchPlatformVitals(): Promise<TenantVitals[]> {
  return apiFetch<TenantVitals[]>('/dashboard/platform-vitals');
}

/** Runs one tenant's five probes concurrently, recording failures instead of throwing. */
export async function probeTenant(tenantId: string): Promise<TenantVitals> {
  const vitals = emptyVitals(tenantId);

  const results = await Promise.allSettled([
    listStaff(tenantId),
    listServices(tenantId),
    listAppointments(tenantId),
    listReviews(tenantId),
    listTransactions(tenantId),
  ]);

  results.forEach((result, index) => {
    const key = PROBE_KEYS[index];
    if (result.status === 'rejected') {
      vitals.failed.push(key);
      return;
    }
    const value = result.value;
    switch (key) {
      case 'staff':
        vitals.staff = Array.isArray(value) ? value.length : 0;
        break;
      case 'services': {
        const rows = Array.isArray(value) ? value : [];
        vitals.services = rows.length;
        vitals.activeServices = rows.filter(
          (s) => (s as { isActive?: boolean }).isActive !== false,
        ).length;
        break;
      }
      case 'appointments': {
        const summary = summariseAppointments(
          Array.isArray(value) ? (value as Appointment[]) : [],
        );
        vitals.appointments = summary.total;
        vitals.upcoming = summary.upcoming;
        vitals.completed = summary.completed;
        vitals.cancelled = summary.cancelled;
        vitals.lastBookingAt = summary.lastBookingAt;
        break;
      }
      case 'reviews':
        vitals.reviews = Array.isArray(value) ? value.length : 0;
        break;
      case 'transactions': {
        const rows = Array.isArray(value)
          ? (value as { amount: unknown; status: string }[])
          : [];
        vitals.revenue = rows
          .filter((t) => isSettled(t.status))
          .reduce((sum, t) => sum + toNumber(t.amount), 0);
        break;
      }
    }
  });

  return vitals;
}

/**
 * Fans `probeTenant` across the roster with a fixed pool.
 *
 * The pool is the point. Firing every tenant at once would open five requests per shop in a single
 * burst — enough to trip the browser's own per-host connection ceiling and make the console look
 * hung on a platform that is answering fine. Six at a time keeps the roster filling steadily.
 *
 * `onResult` fires per tenant so the caller can paint each row as it lands rather than waiting for
 * the slowest shop on the platform.
 */
export async function probeAll(
  tenantIds: string[],
  onResult?: (vitals: TenantVitals) => void,
  concurrency = 6,
): Promise<TenantVitals[]> {
  const out: TenantVitals[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < tenantIds.length) {
      const index = cursor;
      cursor += 1;
      const vitals = await probeTenant(tenantIds[index]);
      out.push(vitals);
      onResult?.(vitals);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tenantIds.length) }, () => worker()),
  );
  return out;
}

/**
 * How alive a shop is, derived from what it actually has rather than from a status column — the
 * backend has no such column, and `isListed` only says whether customers can find the shop.
 *
 *  dormant — signed up, never furnished: no staff and no services. This is the number worth acting
 *            on, and the reason the roster computes vitals at all.
 *  idle    — set up, but has never taken a booking.
 *  live    — has bookings.
 *  unknown — the probes that would decide it did not come back.
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
  /** Tenants with at least one failed probe — the totals below are short by these shops. */
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
