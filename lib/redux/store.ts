import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import platformReducer from './slices/platformSlice';
import tenantsReducer from './slices/tenantsSlice';
import uiReducer from './slices/uiSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      platform: platformReducer,
      tenants: tenantsReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
