import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearSession, getSession, type Session } from '@/lib/api-client';

export interface AuthState {
  session: Session | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
}

const initialState: AuthState = {
  session: null,
  isAuthenticated: false,
  status: 'idle',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth: (state) => {
      const current = typeof window !== 'undefined' ? getSession() : null;
      if (current && current.user.role === 'SUPER_ADMIN') {
        state.session = current;
        state.isAuthenticated = true;
        state.status = 'authenticated';
      } else {
        state.session = null;
        state.isAuthenticated = false;
        state.status = 'unauthenticated';
      }
    },
    setSessionAction: (state, action: PayloadAction<Session>) => {
      state.session = action.payload;
      state.isAuthenticated = true;
      state.status = 'authenticated';
    },
    signOutAction: (state) => {
      if (typeof window !== 'undefined') {
        clearSession();
      }
      state.session = null;
      state.isAuthenticated = false;
      state.status = 'unauthenticated';
    },
  },
});

export const { initializeAuth, setSessionAction, signOutAction } = authSlice.actions;
export default authSlice.reducer;
