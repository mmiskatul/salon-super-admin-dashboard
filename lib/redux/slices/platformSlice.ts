import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PlatformPeriod } from '@/lib/api/platform';

/**
 * All server state that used to live here (overview, roster, vitals, totals, charts, and the
 * loadPlatformOverview/loadPlatformCharts thunks) has moved to TanStack Query — see
 * lib/query/platformQueries.ts and lib/usePlatform.ts. What's left is genuinely client-side UI
 * state: which period the operator has selected, shared across PeriodFilterBar, OverviewHeroCards
 * and PlatformRevenueChart. That's a real cross-component preference, not fetched data, so it
 * stays in Redux rather than being force-fit into a query cache.
 */
export interface PlatformSliceState {
  selectedPeriod: PlatformPeriod;
}

const initialState: PlatformSliceState = {
  selectedPeriod: 'Monthly',
};

export const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    setSelectedPeriod: (state, action: PayloadAction<PlatformPeriod>) => {
      state.selectedPeriod = action.payload;
    },
  },
});

export const { setSelectedPeriod } = platformSlice.actions;

export default platformSlice.reducer;
