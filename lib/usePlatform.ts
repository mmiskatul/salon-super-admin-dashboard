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
  charts: Record<string, import('./api/platform').PlatformChartsDto>;
  trustPulse: PlatformOverviewDto['trustPulse'] | null;
}

/**
 * How long cached overview/roster data is trusted before a page that mounts `usePlatform()` again
 * (e.g. the operator navigates Shops -> a shop's detail page -> back to Shops) will go fetch a fresh
 * copy in the background. Previously this only ever fetched once per browser session — creating a
 * shop, suspending one, editing one, all update the backend fine, but nothing told the cached
 * `platformSlice` it was now stale, so the Overview/Shops pages kept showing pre-mutation numbers
 * until someone noticed and hit the manual Refresh button. A short TTL plus a refresh-on-focus check
 * closes that gap for every caller without having to thread an invalidate() call through every
 * mutation site across the app.
 */
const STALE_MS = 30_000;

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

  const fetchOverviewAndCharts = useCallback(
    (period: PlatformPeriod) => {
      dispatch(loadPlatformOverview(period));
      if (!charts[period.toLowerCase()]) {
        dispatch(loadPlatformCharts(period));
      }
    },
    [dispatch, charts],
  );

  useEffect(() => {
    const periodChanged = prevPeriodRef.current !== null && prevPeriodRef.current !== selectedPeriod;
    prevPeriodRef.current = selectedPeriod;

    if (periodChanged) {
      fetchOverviewAndCharts(selectedPeriod);
    }
    // Runs only when the period itself changes — mount-time staleness is handled by the
    // mount-only effect below so a failed fetch's `loading: false` doesn't retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  // Mount-only: fetch if there's no data yet, or what we have is stale. Deliberately does not
  // depend on `loading`/`error` — those flip when a fetch settles, and depending on them here would
  // immediately re-fire this effect and hammer a failing backend in a retry loop. A genuinely fresh
  // mount (real page navigation) is what re-runs this, which is exactly the "went away, came back,
  // might be out of date" moment worth checking.
  useEffect(() => {
    const isStale = !lastFetched || Date.now() - lastFetched > STALE_MS;
    if (isStale && !loading) {
      fetchOverviewAndCharts(selectedPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revalidate when the tab regains focus after being away a while — the most common way an
  // operator ends up staring at stale numbers (switched to another tab to make the change that
  // should show up here, then switched back).
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      const isStale = !lastFetched || Date.now() - lastFetched > STALE_MS;
      if (isStale && !loading) {
        fetchOverviewAndCharts(selectedPeriod);
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [lastFetched, loading, selectedPeriod, fetchOverviewAndCharts]);

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
    charts,
    trustPulse: overview?.trustPulse ?? null,
  };
}
