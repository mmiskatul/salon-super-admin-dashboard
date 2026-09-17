import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UiSliceState {
  broadcastModalOpen: boolean;
  refreshing: boolean;
  sidebarCollapsed: boolean;
}

const initialState: UiSliceState = {
  broadcastModalOpen: false,
  refreshing: false,
  sidebarCollapsed: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBroadcastModalOpen: (state, action: PayloadAction<boolean>) => {
      state.broadcastModalOpen = action.payload;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.refreshing = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { setBroadcastModalOpen, setRefreshing, toggleSidebar } = uiSlice.actions;

export default uiSlice.reducer;
