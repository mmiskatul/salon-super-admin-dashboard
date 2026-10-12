import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TenantsSliceState {
  searchQuery: string;
  statusFilter: 'all' | 'live' | 'idle' | 'dormant';
  selectedTenantId: string | null;
  sortBy: 'name' | 'created' | 'revenue' | 'appointments';
  sortOrder: 'asc' | 'desc';
}

const initialState: TenantsSliceState = {
  searchQuery: '',
  statusFilter: 'all',
  selectedTenantId: null,
  sortBy: 'appointments',
  sortOrder: 'desc',
};

export const tenantsSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStatusFilter: (
      state,
      action: PayloadAction<'all' | 'live' | 'idle' | 'dormant'>,
    ) => {
      state.statusFilter = action.payload;
    },
    setSelectedTenantId: (state, action: PayloadAction<string | null>) => {
      state.selectedTenantId = action.payload;
    },
    setSorting: (
      state,
      action: PayloadAction<{
        by: 'name' | 'created' | 'revenue' | 'appointments';
        order?: 'asc' | 'desc';
      }>,
    ) => {
      state.sortBy = action.payload.by;
      if (action.payload.order) {
        state.sortOrder = action.payload.order;
      } else {
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      }
    },
    resetTenantFilters: (state) => {
      state.searchQuery = '';
      state.statusFilter = 'all';
    },
  },
});

export const {
  setSearchQuery,
  setStatusFilter,
  setSelectedTenantId,
  setSorting,
  resetTenantFilters,
} = tenantsSlice.actions;

export default tenantsSlice.reducer;
