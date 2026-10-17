'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  RotateCw,
  MapPin,
  Store,
  Scissors,
  Users,
  AlertTriangle,
  ExternalLink,
  Navigation,
  Compass,
  CheckCircle2,
  Search,
  Layers,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { getMap, type MapData } from '@/lib/api/insights';
import { count } from '@/lib/format';
import {
  Button,
  Canvas,
  Empty,
  Failed,
  Loading,
  PageHead,
  Panel,
  Stat,
  Badge,
} from '@/components/ui/primitives';
import { BANGLADESH_AREAS } from '@/components/map/BangladeshMap';

// Dynamically load real Leaflet Bangladesh Map on client only
const BangladeshMap = dynamic(() => import('@/components/map/BangladeshMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[620px] w-full items-center justify-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#635BFF] border-t-transparent" />
        <p className="text-[13px] font-bold text-[#64748B]">
          Initializing real Bangladesh Mapbox HD & geospatial tiles...
        </p>
      </div>
    </div>
  ),
});

type ListTab = 'unserved' | 'places' | 'demand';

export default function MapPage() {
  const data = useApi(getMap, [], 'insights-map');
  const m = data.data;

  const [activeTab, setActiveTab] = useState<ListTab>('unserved');
  const [activeTarget, setActiveTarget] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    name?: string;
  } | null>(null);
  const [placeSearch, setPlaceSearch] = useState('');

  // Coverage statistics
  const coverageRate = useMemo(() => {
    if (!m || m.totals.demandCells === 0) return 0;
    const served = Math.max(0, m.totals.demandCells - m.unservedAreas.length);
    return Math.round((served / m.totals.demandCells) * 100);
  }, [m]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    if (!m) return [];
    const q = placeSearch.trim().toLowerCase();
    if (!q) return m.places;
    return m.places.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.kind.toLowerCase().includes(q),
    );
  }, [m, placeSearch]);

  const handleFocusLocation = (lat: number, lng: number, zoom = 15, name?: string) => {
    setActiveTarget({ lat, lng, zoom, name });
    // Scroll smoothly to map if on mobile
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  return (
    <>
      <PageHead
        eyebrow="Market Intelligence"
        title="Supply & Demand Geospatial Map"
        lede="Real interactive GPS map of Bangladesh showing active studios, independent stylists, and customer demand clusters. Identify unserved market hotspots where customers have saved addresses with no salon within 5 km."
        actions={
          <Button onClick={data.refresh} disabled={data.loading}>
            <RotateCw className="h-4 w-4" /> Refresh Map Data
          </Button>
        }
      />

      <Canvas>
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !m ? (
          <Loading label="Plotting studios and customer demand coordinates across Bangladesh..." />
        ) : (
          <>
            {/* Executive 5-Stat KPI Strip */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 font-manrope">
              <Stat
                label="Geotagged Venues"
                value={count(m.totals.places)}
                sub="With exact GPS pin"
                pending={data.loading}
              />
              <Stat
                label="Visible to Customers"
                value={count(m.totals.listed)}
                sub={
                  m.totals.places
                    ? `${Math.round((m.totals.listed / m.totals.places) * 100)}% discoverable`
                    : undefined
                }
                pending={data.loading}
                tone="live"
              />
              <Stat
                label="Customer Demand Addresses"
                value={count(m.totals.savedAddresses)}
                sub={`${m.totals.demandCells} 1-km clusters`}
                pending={data.loading}
              />
              <Stat
                label="Unserved Market Gaps"
                value={count(m.unservedAreas.length)}
                sub="No salon within 5 km"
                pending={data.loading}
                tone={m.unservedAreas.length > 0 ? 'signal' : 'plain'}
              />
              <Stat
                label="Demand Coverage Rate"
                value={`${coverageRate}%`}
                sub="Clusters within 5 km"
                pending={data.loading}
                tone={coverageRate >= 70 ? 'live' : 'plain'}
              />
            </div>

            {/* Quick Bangladesh Area Jump Toolbar */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm font-manrope">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-[#635BFF]" />
                  <span className="text-[13px] font-bold text-[#1E293B]">
                    Quick Zoom to Bangladesh Division / District:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {BANGLADESH_AREAS.slice(0, 9).map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleFocusLocation(area.lat, area.lng, area.zoom, area.name)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-indigo-50 hover:border-indigo-200 hover:text-[#635BFF] transition-all"
                    >
                      {area.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Real Interactive Bangladesh Map */}
            <BangladeshMap
              data={m}
              activeTarget={activeTarget}
              height="640px"
              onSelectPlace={(place) => {
                setActiveTarget({ lat: place.lat, lng: place.lng, zoom: 16, name: place.name });
              }}
            />

            {/* Geospatial Explorer Panes */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
              {/* Explorer Tab Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
                <div className="flex items-center gap-2">
                  {[
                    {
                      id: 'unserved',
                      label: 'High-Demand Unserved Gaps',
                      count: m.unservedAreas.length,
                    },
                    { id: 'places', label: 'Mapped Studios & Stylists', count: m.places.length },
                    { id: 'demand', label: 'All Customer Demand Cells', count: m.demand.length },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id as ListTab)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                        activeTab === t.id
                          ? 'bg-[#635BFF] text-white shadow-sm'
                          : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                      }`}
                    >
                      {t.label}
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          activeTab === t.id
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>

                {activeTab === 'places' && (
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search mapped venue..."
                      value={placeSearch}
                      onChange={(e) => setPlaceSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[12px] text-[#1E293B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                    />
                  </div>
                )}
              </div>

              {/* Tab 1: Unserved Market Expansion Hotspots */}
              {activeTab === 'unserved' && (
                <div>
                  <div className="mb-3 text-[12px] text-[#64748B]">
                    Clusters where multiple clients have saved homes or workplaces, but no active
                    studio exists within 5 km. Ideal areas for partner acquisition campaigns.
                  </div>

                  {m.unservedAreas.length === 0 ? (
                    <Empty title="Every customer cluster has a salon within 5 km" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {m.unservedAreas.map((area, idx) => (
                        <div
                          key={`${area.lat},${area.lng}`}
                          className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                Opportunity #{idx + 1}
                              </span>
                              <span className="text-[13px] font-extrabold text-rose-700">
                                {area.count} {area.count === 1 ? 'Customer' : 'Customers'}
                              </span>
                            </div>
                            <p className="text-[13px] font-bold text-[#1E293B]">
                              GPS: {area.lat.toFixed(4)}, {area.lng.toFixed(4)}
                            </p>
                            <p className="text-[11px] text-[#64748B] mt-1">
                              Nearest visible salon:{' '}
                              <b>
                                {area.nearestListedKm === null
                                  ? 'None nearby'
                                  : `${area.nearestListedKm} km away`}
                              </b>
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleFocusLocation(area.lat, area.lng, 15)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#635BFF] hover:underline"
                            >
                              <Target className="h-3 w-3" /> Focus on Map
                            </button>
                            <a
                              href={`https://www.google.com/maps?q=${area.lat},${area.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] hover:text-[#1E293B]"
                            >
                              Google Maps <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Mapped Studios & Stylists */}
              {activeTab === 'places' && (
                <div>
                  {filteredPlaces.length === 0 ? (
                    <Empty title="No matching places found" />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPlaces.map((p) => {
                        const linkUrl = p.kind === 'shop' ? `/shops/${p.id}` : `/barbers/${p.id}`;
                        return (
                          <div
                            key={p.id}
                            className="p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64748B]">
                                  {p.kind === 'shop' ? (
                                    <Store className="h-3.5 w-3.5 text-indigo-500" />
                                  ) : (
                                    <Scissors className="h-3.5 w-3.5 text-sky-500" />
                                  )}
                                  {p.kind === 'shop' ? 'Studio' : 'Independent'}
                                </span>
                                {p.listed ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Live
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <h4 className="text-[14px] font-bold text-[#1E293B] truncate">
                                {p.name}
                              </h4>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                GPS: {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                              </p>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleFocusLocation(p.lat, p.lng, 16, p.name)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#635BFF] hover:underline"
                              >
                                <Target className="h-3 w-3" /> Locate Pin
                              </button>
                              <Link
                                href={linkUrl}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] hover:text-[#1E293B]"
                              >
                                View Profile <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: All Customer Demand Cells */}
              {activeTab === 'demand' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {m.demand.slice(0, 24).map((d, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] hover:bg-white hover:border-[#E2E8F0] transition-colors"
                      >
                        <div className="flex items-center justify-between text-[12px] mb-1">
                          <span className="font-extrabold text-[#1E293B]">
                            {d.count} {d.count === 1 ? 'Address' : 'Addresses'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleFocusLocation(d.lat, d.lng, 14)}
                            className="text-[11px] font-bold text-[#635BFF] hover:underline"
                          >
                            Zoom
                          </button>
                        </div>
                        <p className="text-[10px] text-[#94A3B8]">
                          {d.lat.toFixed(3)}, {d.lng.toFixed(3)} · Nearest:{' '}
                          {d.nearestListedKm !== null ? `${d.nearestListedKm} km` : 'None'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Canvas>
    </>
  );
}
