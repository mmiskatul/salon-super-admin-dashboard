'use client';

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { loadPlatformOverview } from './redux/slices/platformSlice';
import type { PlatformOverviewDto, PlatformTotals, TenantVitals } from './api/platform';
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
}

/**
 * Connects directly to the global Redux store (`platformSlice`).
 *
 * Benefits:
 * 1. Fast, instant page navigation across `/` (Overview), `/shops` (Salons), etc.
 * 2. Shared caching: avoids redundant requests and layout jitter when switching views.
 * 3. Unified reload: dispatching `loadPlatformOverview` re-syncs all components simultaneously.
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
  } = useAppSelector((state) => state.platform);

  useEffect(() => {
    // Initial fetch if store does not have platform telemetry yet
    if (!lastFetched && !loading && !overview && !tenants) {
      dispatch(loadPlatformOverview());
    }
  }, [dispatch, lastFetched, loading, overview, tenants]);

  const reload = useCallback(() => {
    dispatch(loadPlatformOverview());
  }, [dispatch]);

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
  };
}
