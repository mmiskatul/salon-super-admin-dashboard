'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { loadPlatformCharts, loadPlatformOverview } from './redux/slices/platformSlice';
import type { PlatformOverviewDto, PlatformPeriod, PlatformTotals, TenantVitals } from './api/platform';
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
}

/**
 * Connects directly to the global Redux store (`platformSlice`).
 *
 * Whenever `selectedPeriod` changes (via the PeriodFilterBar), this hook
 * automatically re-fetches the overview and charts for the new period so
 * every widget on the Overview page reflects the correct time range.
 */
export function usePlatform(): PlatformState {
  const dispatch = useAppDispatch();
  const {
    overview,
    tenants,
    vitals,
    totals,
    loading,
    sweeping,
    swept,
    error,
    lastFetched,
    selectedPeriod,
    charts,
  } = useAppSelector((state) => state.platform);

  // Track previous period to detect changes
  const prevPeriodRef = useRef<PlatformPeriod | null>(null);

  useEffect(() => {
    const periodChanged = prevPeriodRef.current !== null && prevPeriodRef.current !== selectedPeriod;
    prevPeriodRef.current = selectedPeriod;

    if (periodChanged) {
      // Re-fetch overview for the new period
      dispatch(loadPlatformOverview(selectedPeriod));
      // Load charts if not cached for this period
      if (!charts[selectedPeriod.toLowerCase()]) {
        dispatch(loadPlatformCharts(selectedPeriod));
      }
      return;
    }

    // Initial fetch if store has no data yet
    if (!lastFetched && !loading && !overview && !tenants) {
      dispatch(loadPlatformOverview(selectedPeriod));
      if (!charts[selectedPeriod.toLowerCase()]) {
        dispatch(loadPlatformCharts(selectedPeriod));
      }
    }
  }, [dispatch, lastFetched, loading, overview, tenants, selectedPeriod, charts]);

  const reload = useCallback(() => {
    dispatch(loadPlatformOverview(selectedPeriod));
    dispatch(loadPlatformCharts(selectedPeriod));
  }, [dispatch, selectedPeriod]);

  return {
    overview,
    tenants,
    vitals,
    totals,
    loading: loading && !overview && !tenants,
    sweeping,
    swept,
    error,
    reload,
    selectedPeriod,
  };
}
