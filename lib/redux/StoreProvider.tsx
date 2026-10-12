'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';
import { AppStore, makeStore } from './store';
import { initializeAuth } from './slices/authSlice';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  // Created once, on the first render, with the saved session loaded into it.
  const [store] = useState<AppStore>(() => {
    const created = makeStore();
    created.dispatch(initializeAuth());
    return created;
  });

  return <Provider store={store}>{children}</Provider>;
}
