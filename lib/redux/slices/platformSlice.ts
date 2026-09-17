import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  fetchPlatformCharts,
  fetchPlatformOverview,
  fetchPlatformVitals,
  probeAll,
  totalsOf,
  type PlatformChartsDto,
  type PlatformOverviewDto,
  type PlatformPeriod,
  type PlatformTotals,
  type TenantVitals,
} from '@/lib/api/platform';
import { listTenants, type Tenant } from '@/lib/api/tenants';

export interface PlatformSliceState {
  overview: PlatformOverviewDto | null;
  tenants: Tenant[] | null;
  vitals: Record<string, TenantVitals>;
  totals: PlatformTotals | null;
  charts: Record<string, PlatformChartsDto>;
  chartsLoading: boolean;
  selectedPeriod: PlatformPeriod;
  loading: boolean;
  sweeping: boolean;
  swept: number;
  error: string | null;
  lastFetched: number | null;
}

const initialState: PlatformSliceState = {
  overview: null,
  tenants: null,
  vitals: {},
  totals: null,
  charts: {},
  chartsLoading: false,
  selectedPeriod: 'Monthly',
  loading: false,
  sweeping: false,
  swept: 0,
  error: null,
  lastFetched: null,
};

export const loadPlatformOverview = createAsyncThunk(
  'platform/loadOverview',
  async (period: PlatformPeriod | undefined = undefined, { rejectWithValue }) => {
    try {
      // 1. Try first-class overview endpoint
      try {
        const overview = await fetchPlatformOverview(period);
        return {
          type: 'full' as const,
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
        vitalsList = await fetchPlatformVitals();
      } catch {
        // Empty vitals fallback
      }

      if (vitalsList.length === 0 && roster.length > 0) {
        try {
          vitalsList = await probeAll(roster.map((t) => t.id));
        } catch {
          // Keep empty if failed
        }
      }

      return {
        type: 'fallback' as const,
        overview: null,
        tenants: roster,
        vitals: Object.fromEntries(vitalsList.map((v) => [v.tenantId, v])),
      };
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Could not load platform telemetry',
      );
    }
  },
);

export const loadPlatformCharts = createAsyncThunk(
  'platform/loadCharts',
  async (period: PlatformPeriod, { rejectWithValue }) => {
    try {
      const data = await fetchPlatformCharts(period);
      return { period, data };
    } catch (err) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Could not load platform charts',
      );
    }
  },
);

export const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    setSelectedPeriod: (state, action: PayloadAction<PlatformPeriod>) => {
      state.selectedPeriod = action.payload;
    },
    updateTenantVitals: (state, action: PayloadAction<TenantVitals>) => {
      state.vitals[action.payload.tenantId] = action.payload;
      const list = Object.values(state.vitals);
      state.swept = list.length;
      if (state.tenants) {
        state.totals = totalsOf(list, state.tenants);
      }
    },
    setSweepingStatus: (state, action: PayloadAction<boolean>) => {
      state.sweeping = action.payload;
    },
    invalidatePlatformData: (state) => {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadPlatformOverview
      .addCase(loadPlatformOverview.pending, (state) => {
        state.loading = !state.overview && !state.tenants;
        state.error = null;
      })
      .addCase(loadPlatformOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.sweeping = false;
        state.overview = action.payload.overview;
        state.tenants = action.payload.tenants;
        state.vitals = action.payload.vitals;

        const vitalsList = Object.values(action.payload.vitals);
        state.swept = vitalsList.length;
        if (action.payload.tenants) {
          state.totals = totalsOf(vitalsList, action.payload.tenants);
        }
        state.lastFetched = Date.now();
      })
      .addCase(loadPlatformOverview.rejected, (state, action) => {
        state.loading = false;
        state.sweeping = false;
        state.error = action.payload as string;
      })

      // loadPlatformCharts
      .addCase(loadPlatformCharts.pending, (state) => {
        state.chartsLoading = true;
      })
      .addCase(loadPlatformCharts.fulfilled, (state, action) => {
        state.chartsLoading = false;
        state.charts[action.payload.period.toLowerCase()] = action.payload.data;
      })
      .addCase(loadPlatformCharts.rejected, (state) => {
        state.chartsLoading = false;
      });
  },
});

export const {
  setSelectedPeriod,
  updateTenantVitals,
  setSweepingStatus,
  invalidatePlatformData,
} = platformSlice.actions;

export default platformSlice.reducer;
