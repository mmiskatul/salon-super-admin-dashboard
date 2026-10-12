'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getMap } from '@/lib/api/insights';
import { count } from '@/lib/format';
import { Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Legend, PointMap } from '@/components/insights/Bits';

const AREA_KM = 25;

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Where the shops are, and where customers are, from their saved addresses (rounded to ~1 km). */
export default function MapPage() {
  const data = useApi(getMap, [], 'insights-map');
  const m = data.data;
  const [focus, setFocus] = useState<'busiest' | 'all'>('busiest');
  // "Busiest area": everything within 25 km of the place with the most other places around it, so
  // one far-away address doesn't shrink the city where the shops are into a dot.
  const shown = useMemo(() => {
    if (!m || focus === 'all' || m.places.length === 0) return m ? { places: m.places, demand: m.demand } : { places: [], demand: [] };
    const centre = m.places.reduce((best, p) => {
      const n = m.places.filter((q) => km(p, q) <= AREA_KM).length;
      return n > best.n ? { p, n } : best;
    }, { p: m.places[0], n: 0 }).p;
    return { places: m.places.filter((p) => km(p, centre) <= AREA_KM), demand: m.demand.filter((d) => km(d, centre) <= AREA_KM) };
  }, [m, focus]);
  return (
    <>
      <PageHead
        eyebrow="Insights"
        title="Supply & demand map"
        lede="Shops and barbers with a map pin, and customers' saved addresses grouped into about 1 km areas (no exact address is shown). Areas with customers but no visible shop within 5 km are listed below."
        actions={<Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>}
      />
      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !m ? (
          <Loading label="Placing shops and customers" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Places with a pin" value={count(m.totals.places)} />
              <Stat label="Visible to customers" value={count(m.totals.listed)} tone="live" />
              <Stat label="Saved customer addresses" value={count(m.totals.savedAddresses)} />
              <Stat label="Areas with no shop near" value={count(m.unservedAreas.length)} tone={m.unservedAreas.length ? 'signal' : 'plain'} />
            </div>
            <Panel title="Map" note={focus === 'busiest' ? `Busiest area (${AREA_KM} km around the most shops) · ${shown.places.length} places · ${shown.demand.length} customer areas` : 'Whole country'} actions={<div className="flex flex-wrap items-center gap-3"><div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5">{(['busiest', 'all'] as const).map((f) => <button key={f} type="button" onClick={() => setFocus(f)} aria-pressed={focus === f} className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${focus === f ? 'bg-[#635BFF] text-white' : 'text-[#64748B]'}`}>{f === 'busiest' ? 'Busiest area' : 'Whole country'}</button>)}</div><Legend items={[{ color: '#16A34A', label: 'Visible shop / barber' }, { color: '#EF4444', label: 'Hidden (not complete)' }, { color: '#F59E0B', label: 'Customers (bigger = more)', ring: true }]} /></div>}>
              <PointMap places={shown.places} demand={shown.demand} />
            </Panel>
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Customers without a shop nearby" note="Areas with saved addresses and no visible shop within 5 km">
                {m.unservedAreas.length === 0 ? (
                  <Empty title="Every customer area has a shop within 5 km" />
                ) : (
                  <ol className="space-y-1.5 text-[13px]">
                    {m.unservedAreas.map((a) => (
                      <li key={`${a.lat},${a.lng}`} className="flex justify-between gap-3">
                        <a className="font-semibold hover:text-[#635BFF]" href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer">
                          {a.lat.toFixed(2)}, {a.lng.toFixed(2)}
                        </a>
                        <span className="tabular-nums">
                          <b>{a.count}</b> address{a.count === 1 ? '' : 'es'} · {a.nearestListedKm === null ? 'no visible shop at all' : `nearest ${a.nearestListedKm} km`}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Panel>
              <Panel title="Hidden places on the map" note="They have a pin but aren't complete yet">
                {m.places.filter((p) => !p.listed).length === 0 ? (
                  <Empty title="None" />
                ) : (
                  <ul className="space-y-1.5 text-[13px]">
                    {m.places.filter((p) => !p.listed).map((p) => (
                      <li key={p.id}>
                        <Link href={p.kind === 'shop' ? `/shops/${p.id}` : `/barbers/${p.id}`} className="font-semibold hover:text-[#635BFF]">{p.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </>
        )}
      </Canvas>
    </>
  );
}
