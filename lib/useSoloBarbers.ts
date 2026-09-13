'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listSoloBarbers } from './api/people';
import { profilesByIds, servicesByOwner, type UserProfile } from './api/profiles';

export interface BarberRow {
  id: string;
  profile: UserProfile | null;
  services: number | null;
  catalogueValue: number | null;
}

export interface SoloBarbersState {
  rows: BarberRow[] | null;
  loading: boolean;
  /** Names and catalogues are still arriving behind the id list. */
  enriching: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Independent barbers, assembled from three calls.
 *
 * `GET /auth/barbers/independent` answers with account ids and nothing else, so a usable list has
 * to be stitched together: ids first, then names from service-user's bulk profile lookup, then each
 * barber's own catalogue from service-business. They land in that order deliberately — the id list
 * paints immediately and the rest fills in, rather than the screen holding blank until the slowest
 * of the three finishes.
 */
export function useSoloBarbers(): SoloBarbersState {
  const [rows, setRows] = useState<BarberRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const runRef = useRef(0);

  useEffect(() => {
    const runId = runRef.current + 1;
    runRef.current = runId;
    const live = () => runRef.current === runId;

    // Entering the loading state is the point of this effect: it synchronises with an external
    // system (the API) on mount and on every dependency change. The lint rule below targets
    // derived state, which this is not.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    setRows(null);

    (async () => {
      let ids: string[];
      try {
        const barbers = await listSoloBarbers();
        ids = barbers.map((b) => b.id).filter(Boolean);
      } catch (err) {
        if (!live()) return;
        setError(err instanceof Error ? err.message : 'Could not load independent barbers.');
        setLoading(false);
        return;
      }
      if (!live()) return;

      setRows(ids.map((id) => ({ id, profile: null, services: null, catalogueValue: null })));
      setLoading(false);
      setEnriching(ids.length > 0);

      const profiles = await profilesByIds(ids);
      if (!live()) return;
      setRows((prev) => (prev ?? []).map((row) => ({ ...row, profile: profiles[row.id] ?? null })));

      const catalogues = await Promise.allSettled(ids.map((id) => servicesByOwner(id)));
      if (!live()) return;
      setRows((prev) =>
        (prev ?? []).map((row, index) => {
          const result = catalogues[index];
          if (!result || result.status !== 'fulfilled' || !Array.isArray(result.value)) return row;
          return {
            ...row,
            services: result.value.length,
            catalogueValue: result.value.reduce((sum, s) => sum + Number(s.price ?? 0), 0),
          };
        }),
      );
      setEnriching(false);
    })();
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { rows, loading, enriching, error, reload };
}
