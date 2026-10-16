'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  RotateCw,
  Search,
  Store,
  DollarSign,
  Calendar,
  Users,
  Scissors,
  Sparkles,
  LayoutGrid,
  List,
  Star,
  ArrowRight,
  Filter,
  Activity,
  Phone,
  Mail,
  Eye,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlatform } from '@/lib/usePlatform';
import { vitalityOf, type Vitality } from '@/lib/api/platform';
import { createTenant, type Tenant } from '@/lib/api/tenants';
import { useMutation } from '@/lib/useApi';
import { brandColor, count, date, money, rating, since } from '@/lib/format';
import {
  Badge,
  Button,
  Canvas,
  Empty,
  Failed,
  Loading,
  PageHead,
  Panel,
  Stat,
} from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Field, FormError, Modal, Select, TextInput } from '@/components/ui/Form';
import Mark from '@/components/ui/Mark';
import { ceilingOf, Vitals, VitalityTag } from '@/components/ui/Vitals';
import { ShopsAnalytics } from '@/components/shops/ShopsAnalytics';

type SortKey = 'newest' | 'revenue' | 'bookings' | 'staff' | 'rating' | 'name';
type FocusSegment = 'all' | 'live' | 'top_earners' | 'multi_barber' | 'owner_studios' | 'needs_setup';
type ViewMode = 'grid' | 'table';

const FILTERS: { key: Vitality | 'all'; label: string }[] = [
  { key: 'all', label: 'All States' },
  { key: 'live', label: 'Taking bookings' },
  { key: 'idle', label: 'No bookings' },
  { key: 'dormant', label: 'Never set up' },
];

export default function ShopsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenants, vitals, loading, sweeping, swept, error, reload } = usePlatform();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Vitality | 'all'>('all');
  const [segment, setSegment] = useState<FocusSegment>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [creating, setCreating] = useState(false);

  const ceiling = useMemo(() => ceilingOf(Object.values(vitals)), [vitals]);

  // Overall statistics
  const totals = useMemo(() => {
    if (!tenants) {
      return {
        total: 0,
        live: 0,
        idle: 0,
        dormant: 0,
        totalRevenue: 0,
        totalBookings: 0,
        totalStaff: 0,
        ownerStudios: 0,
      };
    }

    let live = 0;
    let idle = 0;
    let dormant = 0;
    let totalRevenue = 0;
    let totalBookings = 0;
    let totalStaff = 0;
    let ownerStudios = 0;

    for (const t of tenants) {
      const v = vitals[t.id];
      const vit = vitalityOf(v);
      if (vit === 'live') live++;
      else if (vit === 'idle') idle++;
      else dormant++;

      if (t.isOwnerStudio) ownerStudios++;
      totalRevenue += v?.revenue ?? 0;
      totalBookings += v?.appointments ?? 0;
      totalStaff += v?.staff ?? 0;
    }

    return {
      total: tenants.length,
      live,
      idle,
      dormant,
      totalRevenue,
      totalBookings,
      totalStaff,
      ownerStudios,
    };
  }, [tenants, vitals]);

  // Filtered and sorted rows
  const rows = useMemo(() => {
    if (!tenants) return [];
    const needle = query.trim().toLowerCase();

    const matched = tenants.filter((t) => {
      const v = vitals[t.id];
      const vit = vitalityOf(v);

      // Vitality state pill filter
      if (filter !== 'all' && vit !== filter) return false;

      // Focus segment filter
      if (segment === 'live' && vit !== 'live') return false;
      if (segment === 'top_earners' && (v?.revenue ?? 0) <= 0) return false;
      if (segment === 'multi_barber' && (v?.staff ?? 0) < 2) return false;
      if (segment === 'owner_studios' && !t.isOwnerStudio) return false;
      if (segment === 'needs_setup' && (t.isListed || vit === 'live')) return false;

      // Query search
      if (!needle) return true;
      return (
        t.name.toLowerCase().includes(needle) ||
        t.contactEmail.toLowerCase().includes(needle) ||
        (t.contactPhone && t.contactPhone.toLowerCase().includes(needle)) ||
        t.businessType.toLowerCase().includes(needle) ||
        t.id.toLowerCase().includes(needle)
      );
    });

    const sorted = [...matched];
    sorted.sort((a, b) => {
      const vA = vitals[a.id];
      const vB = vitals[b.id];

      switch (sort) {
        case 'revenue':
          return (vB?.revenue ?? 0) - (vA?.revenue ?? 0);
        case 'bookings':
          return (vB?.appointments ?? 0) - (vA?.appointments ?? 0);
        case 'staff':
          return (vB?.staff ?? 0) - (vA?.staff ?? 0);
        case 'rating': {
          const rB = Number(b.ratingAvg) || 0;
          const rA = Number(a.ratingAvg) || 0;
          if (rB !== rA) return rB - rA;
          return b.ratingCount - a.ratingCount;
        }
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [tenants, vitals, query, filter, segment, sort]);

  return (
    <>
      <PageHead
        eyebrow="Commercial Storefront Network"
        title="Shops & Studios"
        lede="Complete platform directory of every verified salon, commercial barbershop, and private owner studio with real-time operational vitals, revenue, staff count, and direct hub inspection."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={reload} disabled={loading || sweeping}>
              <RotateCw size={12} className={sweeping ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={12} />
              New Shop
            </Button>
          </div>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={reload} />}
        {loading && !error && <Loading label="Loading commercial storefront directory..." />}

        {tenants && !error && (
          <div className="space-y-6 font-manrope">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Studios</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums">{count(totals.total)}</span>
                  <span className="text-[10px] font-bold text-[#635BFF] bg-[#635BFF]/10 px-1.5 py-0.5 rounded-full">
                    Platform
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Commercial tenants</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Taking Bookings</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">{count(totals.live)}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Active customer queue</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Revenue</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">
                    {money(totals.totalRevenue)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    Volume
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Processed appointments</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Bookings</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums">
                    {count(totals.totalBookings)}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                    All-time
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Completed &amp; upcoming</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Barbers On Staff</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums">
                    {count(totals.totalStaff)}
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full">
                    Team
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Active team stylists</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Owner Studios</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-indigo-600 tabular-nums">
                    {count(totals.ownerStudios)}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                    Solo Studios
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Owner single chairs</span>
              </div>
            </div>

            {/* Interactive Analytics Suite */}
            <ShopsAnalytics
              tenants={tenants}
              vitals={vitals}
              onSelectShop={(tenantId) => {
                const found = tenants.find((t) => t.id === tenantId);
                if (found) setQuery(found.name);
              }}
            />

            {/* Focus Segment Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-2 font-manrope">
              {[
                { id: 'all', label: 'All Salons', count: totals.total },
                { id: 'live', label: 'Taking Bookings (Live)', count: totals.live },
                {
                  id: 'top_earners',
                  label: 'Top Earners (Revenue > 0)',
                  count: tenants.filter((t) => (vitals[t.id]?.revenue ?? 0) > 0).length,
                },
                {
                  id: 'multi_barber',
                  label: 'Multi-Barber Teams (Staff ≥ 2)',
                  count: tenants.filter((t) => (vitals[t.id]?.staff ?? 0) >= 2).length,
                },
                { id: 'owner_studios', label: 'Owner Studios', count: totals.ownerStudios },
                {
                  id: 'needs_setup',
                  label: 'Needs Setup / Hidden',
                  count: tenants.filter((t) => !t.isListed || vitalityOf(vitals[t.id]) === 'dormant').length,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSegment(tab.id as FocusSegment)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    segment === tab.id
                      ? 'bg-[#1E293B] text-white shadow-xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      segment === tab.id ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter, Sort, View Mode & Search Toolbar */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs font-manrope">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Left Controls: Operational Vitality Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mr-1">
                    State:
                  </span>
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilter(f.key)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        filter === f.key
                          ? 'bg-[#635BFF] text-white shadow-xs'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-white hover:text-[#1E293B]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                  <div className="mx-2 hidden h-5 w-px bg-[#E2E8F0] sm:block" />
                  <Link
                    href="/barbers"
                    className="text-xs font-semibold text-[#635BFF] hover:underline flex items-center gap-1"
                  >
                    <span>Independent Barbers</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                {/* Right Controls: Search, Sort & Dual View Modes */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <label className="relative min-w-[220px] flex-1 sm:flex-initial">
                    <Search
                      size={14}
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search salon name, email, type..."
                      aria-label="Search salons"
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pr-3 pl-8 text-xs text-[#1E293B] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-medium transition-all"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery('')}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#1E293B]"
                      >
                        ✕
                      </button>
                    )}
                  </label>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0]">
                    <Filter size={13} className="text-[#64748B]" />
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      aria-label="Sort salons"
                      className="bg-transparent text-xs font-bold text-[#1E293B] focus:outline-none cursor-pointer"
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="revenue">Sort: Top Revenue</option>
                      <option value="bookings">Sort: Most Bookings</option>
                      <option value="staff">Sort: Most Staff</option>
                      <option value="rating">Sort: Highest Rating</option>
                      <option value="name">Sort: Name (A-Z)</option>
                    </select>
                  </div>

                  {/* Dual View Mode Buttons */}
                  <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] gap-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      title="Grid Cards View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white text-[#635BFF] shadow-xs'
                          : 'text-[#94A3B8] hover:text-[#1E293B]'
                      }`}
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      title="Dense Table View"
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-white text-[#635BFF] shadow-xs'
                          : 'text-[#94A3B8] hover:text-[#1E293B]'
                      }`}
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count Banner */}
            <div className="flex items-center justify-between text-xs font-semibold text-[#64748B] px-1 font-manrope">
              <span>
                Showing <strong className="text-[#1E293B]">{rows.length}</strong> of {totals.total} shops
                {query && ` matching "${query}"`}
                {sweeping && (
                  <span className="ml-2 text-indigo-600 font-normal">
                    (Vitals updating: {swept} of {tenants.length} read)
                  </span>
                )}
              </span>
              {rows.length < totals.total && (
                <button
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                    setSegment('all');
                  }}
                  className="text-[#635BFF] hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Main Content: Grid Cards View vs Dense Table View */}
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center shadow-xs">
                <Empty
                  title={tenants.length === 0 ? 'No shops on the platform yet' : 'No shops match current filters'}
                  hint={
                    tenants.length === 0
                      ? 'A shop is normally created when an owner registers with a business name, or you can create one directly.'
                      : 'Try broadening your search query or switching your state filter.'
                  }
                  action={
                    tenants.length === 0 ? (
                      <Button variant="primary" onClick={() => setCreating(true)}>
                        <Plus size={12} />
                        New Shop
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : viewMode === 'grid' ? (
              /* ================== GRID CARDS VIEW ================== */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-manrope">
                {rows.map((tenant) => {
                  const v = vitals[tenant.id];
                  const color = brandColor(tenant.brandColor);
                  const vit = vitalityOf(v);
                  const rNum = Number(tenant.ratingAvg) || 0;

                  return (
                    <div
                      key={tenant.id}
                      className="group relative flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-md"
                    >
                      {/* Card Header */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Mark
                              name={tenant.name}
                              logoUrl={tenant.logoUrl}
                              color={tenant.brandColor}
                              size={44}
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/shops/${tenant.id}`}
                                className="block truncate text-base font-extrabold text-[#1E293B] group-hover:text-[#635BFF] transition-colors"
                              >
                                {tenant.name}
                              </Link>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] font-semibold text-[#64748B]">
                                  {tenant.businessType || 'Salon'}
                                </span>
                                {tenant.isOwnerStudio && (
                                  <span className="rounded bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 text-[9px] font-extrabold">
                                    Owner Studio
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Vitality Tag */}
                          <div>
                            <VitalityTag vitality={vit} />
                          </div>
                        </div>

                        {/* Contact details */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] border-t border-[#F1F5F9] pt-2.5">
                          <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={tenant.contactEmail}>
                            <Mail size={12} className="text-[#94A3B8] shrink-0" />
                            <span className="truncate">{tenant.contactEmail}</span>
                          </span>
                          {tenant.contactPhone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={12} className="text-[#94A3B8] shrink-0" />
                              <span>{tenant.contactPhone}</span>
                            </span>
                          )}
                        </div>

                        {/* Rating & Listing Banner */}
                        <div className="mt-3 flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2 border border-[#E2E8F0]/70">
                          <div className="flex items-center gap-1.5">
                            <Star
                              size={15}
                              className={rNum > 0 ? 'fill-amber-400 text-amber-400' : 'text-[#CBD5E1]'}
                            />
                            <span className="text-xs font-extrabold text-[#1E293B]">
                              {rNum > 0 ? rating(rNum) : 'New / Unrated'}
                            </span>
                            {tenant.ratingCount > 0 && (
                              <span className="text-[11px] font-medium text-[#64748B]">
                                ({tenant.ratingCount} reviews)
                              </span>
                            )}
                          </div>

                          <div>
                            {tenant.isSuspended ? (
                              <Badge tone="signal">Suspended</Badge>
                            ) : tenant.isListed ? (
                              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Publicly Listed
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-[#94A3B8]">
                                Hidden from Search
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 4-Column Statistics Grid */}
                        <div className="mt-3 grid grid-cols-4 gap-2 py-1 text-center">
                          <div className="rounded-xl bg-[#F8FAFC] p-2 border border-[#E2E8F0]/60">
                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">
                              Staff
                            </span>
                            <span className="text-sm font-extrabold text-[#1E293B] tabular-nums mt-0.5 block">
                              {v?.staff != null ? count(v.staff) : '—'}
                            </span>
                          </div>

                          <div className="rounded-xl bg-[#F8FAFC] p-2 border border-[#E2E8F0]/60">
                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">
                              Services
                            </span>
                            <span className="text-sm font-extrabold text-[#1E293B] tabular-nums mt-0.5 block">
                              {v?.services != null ? count(v.services) : '—'}
                            </span>
                          </div>

                          <div className="rounded-xl bg-[#F8FAFC] p-2 border border-[#E2E8F0]/60">
                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">
                              Bookings
                            </span>
                            <span className="text-sm font-extrabold text-[#1E293B] tabular-nums mt-0.5 block">
                              {v?.appointments != null ? count(v.appointments) : '—'}
                            </span>
                          </div>

                          <div className="rounded-xl bg-[#F8FAFC] p-2 border border-[#E2E8F0]/60">
                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider block">
                              Revenue
                            </span>
                            <span className="text-sm font-extrabold text-emerald-600 tabular-nums mt-0.5 block">
                              {v?.revenue != null ? money(v.revenue) : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                        <Link
                          href={`/owners/${tenant.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-bold text-[#475569] hover:bg-white hover:text-[#1E293B] transition-all cursor-pointer"
                        >
                          <Users size={12} />
                          Owner Hub
                        </Link>

                        <Link
                          href={`/shops/${tenant.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#635BFF] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#5349e0] transition-all"
                        >
                          <span>Inspect Shop</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ================== DENSE TABLE VIEW ================== */
              <Panel flush>
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Shop / Studio</Th>
                        <Th>Vitals</Th>
                        <Th>State</Th>
                        <Th align="right">Staff</Th>
                        <Th align="right">Services</Th>
                        <Th align="right">Bookings</Th>
                        <Th align="right">Revenue</Th>
                        <Th align="right">Rating</Th>
                        <Th align="right">Last Booking</Th>
                        <Th align="right">Joined</Th>
                        <Th align="right">Controls</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((tenant) => {
                        const v = vitals[tenant.id];
                        const color = brandColor(tenant.brandColor);
                        return (
                          <Tr
                            key={tenant.id}
                            accent={color}
                            onClick={() => router.push(`/shops/${tenant.id}`)}
                          >
                            <Td nowrap={false}>
                              <span className="flex items-center gap-2.5">
                                <Mark
                                  name={tenant.name}
                                  logoUrl={tenant.logoUrl}
                                  color={tenant.brandColor}
                                />
                                <span className="min-w-0">
                                  <span className="block truncate font-bold text-[#1E293B]">
                                    {tenant.name}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                    {tenant.isOwnerStudio && (
                                      <span className="rounded bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 text-[10px] font-bold">
                                        Owner Studio
                                      </span>
                                    )}
                                    {!tenant.isListed && (
                                      <span className="tabular block truncate text-[11px] text-[#94A3B8]">
                                        Hidden from search
                                      </span>
                                    )}
                                  </div>
                                </span>
                              </span>
                            </Td>
                            <Td>
                              <Vitals vitals={v} ceiling={ceiling} color={color} />
                            </Td>
                            <Td>
                              <VitalityTag vitality={vitalityOf(v)} />
                            </Td>
                            <Td align="right" mono muted={v?.staff == null}>
                              {v?.staff != null ? count(v.staff) : '—'}
                            </Td>
                            <Td align="right" mono muted={v?.services == null}>
                              {v?.services != null ? count(v.services) : '—'}
                            </Td>
                            <Td align="right" mono muted={v?.appointments == null}>
                              {v?.appointments != null ? count(v.appointments) : '—'}
                            </Td>
                            <Td align="right" mono muted={v?.revenue == null}>
                              {v?.revenue == null ? '—' : money(v.revenue)}
                            </Td>
                            <Td align="right" mono muted>
                              {rating(tenant.ratingAvg)}
                              {tenant.ratingCount > 0 && (
                                <span className="text-[#94A3B8]"> ({tenant.ratingCount})</span>
                              )}
                            </Td>
                            <Td align="right" mono muted>
                              {v?.lastBookingAt ? since(v.lastBookingAt) : '—'}
                            </Td>
                            <Td align="right" mono muted>
                              {date(tenant.createdAt)}
                            </Td>
                            <Td align="right">
                              <div
                                role="presentation"
                                className="flex items-center justify-end gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <Link
                                  href={`/owners/${tenant.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-bold text-[#1E293B] hover:bg-[#635BFF] hover:text-white hover:border-[#635BFF] transition-all"
                                  title="Open connected Owner Dashboard"
                                >
                                  Owner Hub
                                </Link>
                                <Link
                                  href={`/shops/${tenant.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#635BFF] text-[11px] font-bold text-white hover:bg-[#5349e0] transition-all"
                                  title="Inspect complete shop hub"
                                >
                                  Inspect
                                </Link>
                              </div>
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Scroll>
              </Panel>
            )}
          </div>
        )}
      </Canvas>

      {/* New Shop Dialog */}
      {creating && (
        <NewShopDialog
          onClose={() => setCreating(false)}
          onCreated={(tenant) => {
            setCreating(false);
            void queryClient.invalidateQueries({ queryKey: ['platform-overview'] });
            router.push(`/shops/${tenant.id}`);
          }}
        />
      )}
    </>
  );
}

/**
 * Creating a shop by hand.
 */
function NewShopDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (tenant: Tenant) => void;
}) {
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('Barbershop');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [colour, setColour] = useState('#1e293b');
  const [tagline, setTagline] = useState('');
  const { mutate, pending, error } = useMutation(createTenant);

  function onNameChange(value: string) {
    setName(value);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const created = await mutate({
      name: name.trim(),
      businessType: businessType.trim(),
      contactEmail: contactEmail.trim(),
      ...(contactPhone.trim() ? { contactPhone: contactPhone.trim() } : {}),
      ...(colour ? { brandColor: colour } : {}),
      ...(tagline.trim() ? { tagline: tagline.trim() } : {}),
    });
    if (created) onCreated(created);
  }

  return (
    <Modal
      title="Create New Commercial Shop"
      note="Creates the tenant record on the platform. It can be linked to an existing owner or used with its join code."
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-4 font-manrope">
        <FormError message={error} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shop name">
            <TextInput value={name} onChange={(e) => onNameChange(e.target.value)} required />
          </Field>
          <Field label="Business type">
            <Select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
              <option>Barbershop</option>
              <option>Salon</option>
              <option>Spa</option>
              <option>Nail bar</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Contact email">
            <TextInput
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Contact phone" hint="Optional.">
            <TextInput value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </Field>
          <Field label="Brand colour" hint="Used to identify the shop throughout this console.">
            <span className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                aria-label="Brand colour"
                className="h-[34px] w-12 cursor-pointer rounded-lg border border-[#E2E8F0] bg-white"
              />
              <input
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                aria-label="Brand colour hex"
                className="tabular w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-2 text-[13px] focus:border-[#635BFF] focus:outline-none"
              />
            </span>
          </Field>
        </div>

        <Field label="Tagline" hint="Optional. Shown to customers on the shop's public profile.">
          <TextInput value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </Field>

        <div className="flex justify-end gap-2 border-t border-[#F1F5F9] pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? 'Creating shop…' : 'Create Shop'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
