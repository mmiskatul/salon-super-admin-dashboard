import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  fetchPlatformCharts,
  fetchPlatformOverview,
  fetchPlatformVitals,
  probeAll,
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
 * Same fallback chain the old `loadPlatformOverview` thunk ran: try the real cross-tenant endpoint
 * first, and only fall back to fanning out over the roster if a deployment predates it. The one
 * behavioural addition is `queryClient.setQueryData` inside the sweep loop — TanStack Query treats
 * that exactly like a server push, so every component subscribed to this query key re-renders with
 * each tenant's numbers as they land, instead of waiting for the slowest shop on the platform.
 */
async function loadPlatformOverview(
  period: PlatformPeriod,
  queryClient: QueryClient,
): Promise<PlatformOverviewResult> {
  try {
    const overview = await fetchPlatformOverview(period);
    return {
      overview,
      tenants: overview.tenants,
      vitals: Object.fromEntries(overview.vitals.map((v) => [v.tenantId, v])),
    };
  } catch {
    // Fall back to roster + vitals query
  }

  const roster = await listTenants();
  let vitalsList: TenantVitals[] = [];
  try {
    vitalsList = await fetchPlatformVitals(period);
  } catch {
    // Empty vitals fallback
  }

  if (vitalsList.length === 0 && roster.length > 0) {
    const partial: Record<string, TenantVitals> = {};
    try {
      vitalsList = await probeAll(roster.map((t) => t.id), (v) => {
        partial[v.tenantId] = v;
        queryClient.setQueryData<PlatformOverviewResult>(platformOverviewKey(period), {
          overview: null,
          tenants: roster,
          vitals: { ...partial },
        });
      });
    } catch {
      // Keep whatever landed before the failure
    }
  }

  return { overview: null, tenants: roster, vitals: Object.fromEntries(vitalsList.map((v) => [v.tenantId, v])) };
}

/** Cross-tenant overview + roster + per-tenant vitals for the given period. Shared across every
 *  component that calls it for the same period — Query dedupes concurrent calls into one request
 *  and serves cached data instantly (revalidating in the background) inside `staleTime`. */
export function usePlatformOverview(period: PlatformPeriod) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: platformOverviewKey(period),
    queryFn: () => loadPlatformOverview(period, queryClient),
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
