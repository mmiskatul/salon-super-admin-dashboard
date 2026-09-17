'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from './redux/hooks';
import { usePlatformCharts, usePlatformOverview } from './query/platformQueries';
import { totalsOf, type PlatformOverviewDto, type PlatformPeriod, type PlatformTotals, type TenantVitals } from './api/platform';
import type { Tenant } from './api/tenants';

export interface PlatformState {
  overview: PlatformOverviewDto | null;
  tenants: Tenant[] | null;
  /** Keyed by tenant id. Fills in progressively or when loaded. */
  vitals: Record<string, TenantVitals>;
  totals: PlatformTotals | null;
  loading: boolean;
  /** The per-tenant sweep is still running; totals are partial. */
  sweeping: boolean;
  swept: number;
  error: string | null;
  reload: () => void;
  selectedPeriod: PlatformPeriod;
  charts: Record<string, import('./api/platform').PlatformChartsDto>;
  trustPulse: PlatformOverviewDto['trustPulse'] | null;
}

/**
 * Server state (overview/roster/vitals/charts) lives in TanStack Query now — see
 * lib/query/platformQueries.ts. `selectedPeriod` stays in Redux (`platformSlice`) because it's
 * genuinely shared UI state: PeriodFilterBar, OverviewHeroCards and PlatformRevenueChart all read
 * it independently, and it needs to persist as a plain "what's the operator looking at" choice
 * rather than being re-derived per component. This hook just composes the two: read the period
 * from Redux, use it as the Query key, and reshape the result into the same PlatformState every
 * existing page/component already expects.
 *
 * Query's own `staleTime`/`refetchOnWindowFocus` (configured once in QueryProvider) replace what
 * used to be a hand-rolled TTL + visibilitychange listener here — and because every mutation site
 * now calls `queryClient.invalidateQueries({ queryKey: ['platform-overview'] })` instead of a
 * Redux-only `invalidatePlatformData` flag, a change on the shop detail page is reflected the next
 * time any component touches this query, not just the one that made it.
 */
export function usePlatform(): PlatformState {
  const queryClient = useQueryClient();
  const selectedPeriod = useAppSelector((state) => state.platform.selectedPeriod);

  const overviewQuery = usePlatformOverview(selectedPeriod);
  const chartsQuery = usePlatformCharts(selectedPeriod);

  const tenants = overviewQuery.data?.tenants ?? null;
  const vitals = useMemo(() => overviewQuery.data?.vitals ?? {}, [overviewQuery.data]);
  const overview = overviewQuery.data?.overview ?? null;

  const totals = useMemo(() => (tenants ? totalsOf(Object.values(vitals), tenants) : null), [tenants, vitals]);

  const swept = Object.keys(vitals).length;
  const sweeping = overviewQuery.isFetching && !overview && !!tenants && swept < tenants.length;

  const charts = useMemo(
    () => (chartsQuery.data ? { [selectedPeriod.toLowerCase()]: chartsQuery.data } : {}),
    [chartsQuery.data, selectedPeriod],
  );

  const reload = () => {
    void queryClient.invalidateQueries({ queryKey: ['platform-overview', selectedPeriod] });
    void queryClient.invalidateQueries({ queryKey: ['platform-charts', selectedPeriod] });
  };

  return {
    overview,
    tenants,
    vitals,
    totals,
    loading: overviewQuery.isPending,
    sweeping,
    swept,
    error: overviewQuery.error ? (overviewQuery.error as Error).message : null,
    reload,
    selectedPeriod,
    charts,
    trustPulse: overview?.trustPulse ?? null,
  };
}
