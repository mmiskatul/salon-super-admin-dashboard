import { useQuery } from '@tanstack/react-query';
import {
  fetchPlatformCharts,
  fetchPlatformOverview,
  fetchPlatformVitals,
  type PlatformChartsDto,
  type PlatformOverviewDto,
  type PlatformPeriod,
  type TenantVitals,
} from '@/lib/api/platform';
import { listTenants, type Tenant } from '@/lib/api/tenants';

export interface PlatformOverviewResult {
  overview: PlatformOverviewDto | null;
  tenants: Tenant[];
  vitals: Record<string, TenantVitals>;
}

export const platformOverviewKey = (period: PlatformPeriod) => ['platform-overview', period] as const;
export const platformChartsKey = (period: PlatformPeriod) => ['platform-charts', period] as const;

/**
 * The overview in one call. If that fails, the roster plus the vitals endpoint; if the vitals fail
 * too, the roster alone, with every shop's numbers unknown (`vitalityOf` shows them as such).
 * It no longer falls back to asking every shop for its own lists from the browser: that was five
 * requests per shop, sent exactly when the backend was already struggling.
 */
async function loadPlatformOverview(period: PlatformPeriod): Promise<PlatformOverviewResult> {
  try {
    const overview = await fetchPlatformOverview(period);
    return {
      overview,
      tenants: overview.tenants,
      vitals: Object.fromEntries(overview.vitals.map((v) => [v.tenantId, v])),
    };
  } catch {
    // Fall back to roster + vitals below.
  }

  const roster = await listTenants();
  let vitalsList: TenantVitals[] = [];
  try {
    vitalsList = await fetchPlatformVitals(period);
  } catch {
    // Roster alone: every shop shows as "unknown".
  }
  return { overview: null, tenants: roster, vitals: Object.fromEntries(vitalsList.map((v) => [v.tenantId, v])) };
}

/** Cross-tenant overview + roster + per-tenant vitals for the given period. Shared across every
 *  component that calls it for the same period — Query dedupes concurrent calls into one request
 *  and serves cached data instantly (revalidating in the background) inside `staleTime`. */
export function usePlatformOverview(period: PlatformPeriod) {
  return useQuery({
    queryKey: platformOverviewKey(period),
    queryFn: () => loadPlatformOverview(period),
    // Keep the previous period's data on screen while the new one loads instead of flashing empty.
    placeholderData: (prev) => prev,
  });
}

export function usePlatformCharts(period: PlatformPeriod) {
  return useQuery({
    queryKey: platformChartsKey(period),
    queryFn: (): Promise<PlatformChartsDto> => fetchPlatformCharts(period),
    placeholderData: (prev) => prev,
  });
}
