'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  Search,
  ShieldAlert,
  Scissors,
  Store,
  Eye,
  Star,
  Lock,
  Unlock,
  Sparkles,
  LayoutGrid,
  List,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Filter,
  Users,
  Award,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { listAllBarbers, type BarberSummary } from '@/lib/api/barbers';
import { banUser, unbanUser } from '@/lib/api/users';
import { count, date, initials, money, rating, shortId, brandColor } from '@/lib/format';
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
import { Field, FormError, Modal, TextInput } from '@/components/ui/Form';
import BarberDetailModal from '@/components/ui/BarberDetailModal';
import Mark from '@/components/ui/Mark';
import { BarbersAnalytics } from '@/components/barbers/BarbersAnalytics';

type TypeFilter = 'ALL' | 'SHOP_STAFF' | 'SOLO';
type StatusFilter = 'ALL' | 'ACTIVE' | 'BANNED';
type FocusSegment = 'all' | 'top_rated' | 'solo' | 'shop_linked' | 'high_volume' | 'banned';
type SortKey = 'rating' | 'appointments' | 'revenue' | 'services' | 'newest' | 'name';
type ViewMode = 'grid' | 'table';

export default function BarbersDirectoryPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [focusSegment, setFocusSegment] = useState<FocusSegment>('all');
  const [sortKey, setSortKey] = useState<SortKey>('rating');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [quickPreview, setQuickPreview] = useState<{ userId: string; name: string } | null>(null);

  // Moderation state
  const [banningTarget, setBanningTarget] = useState<BarberSummary | null>(null);
  const [banReason, setBanReason] = useState('');

  const ban = useMutation(banUser);
  const unban = useMutation(unbanUser);

  const { data: barbers, loading, error, refresh } = useApi(() => listAllBarbers(), [], 'barbers');
  const rows = useMemo(() => barbers ?? [], [barbers]);

  // Summary Metrics across all barbers
  const totals = useMemo(() => {
    let shopStaff = 0;
    let solo = 0;
    let banned = 0;
    let active = 0;
    let topRatedCount = 0;
    let totalAppointments = 0;
    let totalRevenue = 0;

    for (const b of rows) {
      if (b.type === 'SOLO') solo++;
      else shopStaff++;

      if (b.isBanned) banned++;
      else active++;

      if (Number(b.ratingAvg) >= 4.8) topRatedCount++;
      totalAppointments += b.appointmentsCount || 0;
      totalRevenue += b.totalRevenue || 0;
    }

    return {
      total: rows.length,
      shopStaff,
      solo,
      active,
      banned,
      topRatedCount,
      totalAppointments,
      totalRevenue,
    };
  }, [rows]);

  // Filtered and Sorted rows with Focus Segments
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows
      .filter((b) => {
        // Direct Type and Status Filters
        if (typeFilter !== 'ALL' && b.type !== typeFilter) return false;
        if (statusFilter === 'ACTIVE' && b.isBanned) return false;
        if (statusFilter === 'BANNED' && !b.isBanned) return false;

        // Focus Segment filter
        if (focusSegment === 'top_rated' && Number(b.ratingAvg) < 4.8) return false;
        if (focusSegment === 'solo' && b.type !== 'SOLO') return false;
        if (focusSegment === 'shop_linked' && b.type !== 'SHOP_STAFF') return false;
        if (focusSegment === 'high_volume' && (b.appointmentsCount || 0) < 1) return false;
        if (focusSegment === 'banned' && !b.isBanned) return false;

        // Search query
        if (!q) return true;
        const nameMatch = b.name.toLowerCase().includes(q);
        const emailMatch = b.email.toLowerCase().includes(q);
        const phoneMatch = b.phone ? b.phone.toLowerCase().includes(q) : false;
        const shopMatch = b.tenantName?.toLowerCase().includes(q);
        const idMatch = b.id.toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || shopMatch || idMatch;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case 'rating': {
            const rB = Number(b.ratingAvg) || 0;
            const rA = Number(a.ratingAvg) || 0;
            if (rB !== rA) return rB - rA;
            return (b.ratingCount || 0) - (a.ratingCount || 0);
          }
          case 'appointments':
            return (b.appointmentsCount || 0) - (a.appointmentsCount || 0);
          case 'revenue':
            return (b.totalRevenue || 0) - (a.totalRevenue || 0);
          case 'services':
            return (b.servicesCount || 0) - (a.servicesCount || 0);
          case 'name':
            return a.name.localeCompare(b.name);
          case 'newest':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [rows, query, typeFilter, statusFilter, focusSegment, sortKey]);

  async function handleBanSubmit() {
    if (!banningTarget) return;
    try {
      await ban.mutate(banningTarget.id, banReason.trim() || undefined);
      setBanningTarget(null);
      setBanReason('');
      refresh();
    } catch {
      // Handled by useMutation
    }
  }

  async function handleUnban(b: BarberSummary) {
    try {
      await unban.mutate(b.id);
      refresh();
    } catch {
      // Handled by useMutation
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Platform Supply Network"
        title="Barbers & Stylists"
        lede="Super-admin command directory of all platform hair artists, salon-affiliated specialists, and solo studio operators with performance telemetry, quality ratings, and moderation control."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={refresh} disabled={loading}>
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={refresh} />}
        {loading && !error && <Loading label="Loading platform barbers & stylists..." />}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 font-manrope">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Stylists</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums">{count(totals.total)}</span>
                  <span className="text-[10px] font-bold text-[#635BFF] bg-[#635BFF]/10 px-1.5 py-0.5 rounded-full">
                    Platform
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Registered staff & solos</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Active & Ready</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">{count(totals.active)}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Available for bookings</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Shop Stylists</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums">{count(totals.shopStaff)}</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                    {totals.total > 0 ? Math.round((totals.shopStaff / totals.total) * 100) : 0}%
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Assigned to verified shops</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Independent Solo</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-purple-600 tabular-nums">{count(totals.solo)}</span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full">
                    {totals.total > 0 ? Math.round((totals.solo / totals.total) * 100) : 0}%
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Solo studios & mobile</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Top Rated (4.8★+)</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-amber-500 tabular-nums">{count(totals.topRatedCount)}</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    ★ Favorite
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">High client satisfaction</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Suspended / Banned</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-extrabold tabular-nums ${
                      totals.banned > 0 ? 'text-rose-600' : 'text-[#64748B]'
                    }`}
                  >
                    {count(totals.banned)}
                  </span>
                  {totals.banned > 0 && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full">
                      Alert
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">
                  {totals.banned > 0 ? 'Access suspended' : 'No banned accounts'}
                </span>
              </div>
            </div>

            {/* Interactive Analytics Suite */}
            <BarbersAnalytics
              barbers={rows}
              onSelectBarber={(barberId) => {
                const found = rows.find((b) => b.id === barberId);
                if (found) setQuery(found.name);
              }}
            />

            {/* Focus Segment Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-2 font-manrope">
              {[
                { id: 'all', label: 'All Stylists', count: totals.total },
                { id: 'top_rated', label: 'Top Rated (4.8★+)', count: totals.topRatedCount },
                { id: 'solo', label: 'Solo Independents', count: totals.solo },
                { id: 'shop_linked', label: 'Shop Affiliated', count: totals.shopStaff },
                { id: 'high_volume', label: 'Active Bookers', count: rows.filter((b) => (b.appointmentsCount || 0) > 0).length },
                { id: 'banned', label: 'Needs Moderation / Banned', count: totals.banned },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFocusSegment(tab.id as FocusSegment)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    focusSegment === tab.id
                      ? 'bg-[#1E293B] text-white shadow-xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                      focusSegment === tab.id ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter, Sort & View Control Bar */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs font-manrope">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Left Controls: Type & Status Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mr-1">Type:</span>
                  {(['ALL', 'SHOP_STAFF', 'SOLO'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        typeFilter === t
                          ? 'bg-[#635BFF] text-white shadow-xs'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-white hover:text-[#1E293B]'
                      }`}
                    >
                      {t === 'ALL' && 'All Types'}
                      {t === 'SHOP_STAFF' && 'Shop Stylists'}
                      {t === 'SOLO' && 'Solo Masters'}
                    </button>
                  ))}

                  <div className="mx-2 hidden h-5 w-px bg-[#E2E8F0] sm:block" />

                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mr-1">Status:</span>
                  {(['ALL', 'ACTIVE', 'BANNED'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        statusFilter === s
                          ? 'bg-[#635BFF] text-white shadow-xs'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-white hover:text-[#1E293B]'
                      }`}
                    >
                      {s === 'ALL' && 'All Statuses'}
                      {s === 'ACTIVE' && 'Active Only'}
                      {s === 'BANNED' && 'Banned'}
                    </button>
                  ))}
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
                      placeholder="Search name, shop, email..."
                      aria-label="Search barbers"
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
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      aria-label="Sort barbers"
                      className="bg-transparent text-xs font-bold text-[#1E293B] focus:outline-none cursor-pointer"
                    >
                      <option value="rating">Sort: Highest Rating</option>
                      <option value="appointments">Sort: Most Bookings</option>
                      <option value="revenue">Sort: Top Revenue</option>
                      <option value="services">Sort: Services Count</option>
                      <option value="newest">Sort: Newest Joined</option>
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
                Showing <strong className="text-[#1E293B]">{visible.length}</strong> of {totals.total} barbers
                {query && ` matching "${query}"`}
              </span>
              {visible.length < totals.total && (
                <button
                  onClick={() => {
                    setQuery('');
                    setTypeFilter('ALL');
                    setStatusFilter('ALL');
                    setFocusSegment('all');
                  }}
                  className="text-[#635BFF] hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}
            </div>

            {/* Main Content: Grid View or Dense Table View */}
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center shadow-xs">
                <Empty
                  title={rows.length === 0 ? 'No barbers registered yet' : 'No barbers match current filters'}
                  hint={
                    rows.length === 0
                      ? 'Barbers and stylists appear here as soon as they register or join a salon team.'
                      : 'Try broadening your search query or switching the focus segment filter above.'
                  }
                />
              </div>
            ) : viewMode === 'grid' ? (
              /* ================== GRID VIEW ================== */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-manrope">
                {visible.map((b) => {
                  const color = brandColor(b.shopBrandColor);
                  const isSolo = b.type === 'SOLO';
                  const rNum = Number(b.ratingAvg) || 0;

                  return (
                    <div
                      key={b.id}
                      className="group relative flex flex-col justify-between rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-md"
                    >
                      {/* Card Header: Avatar, Name, Affiliation, Status */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar with Status Pulse */}
                            <div className="relative shrink-0">
                              <span
                                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E293B] text-sm font-extrabold text-white shadow-xs transition-transform group-hover:scale-105"
                                style={
                                  b.shopBrandColor
                                    ? { backgroundColor: color }
                                    : undefined
                                }
                              >
                                {initials(b.name)}
                              </span>
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                                  b.isBanned ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                title={b.isBanned ? 'Banned' : 'Active'}
                              />
                            </div>

                            <div className="min-w-0">
                              <Link
                                href={`/barbers/${b.id}`}
                                className="block truncate text-base font-extrabold text-[#1E293B] group-hover:text-[#635BFF] transition-colors"
                              >
                                {b.name}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isSolo ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                                    <Sparkles size={11} />
                                    Independent Solo
                                  </span>
                                ) : (
                                  <Link
                                    href={`/shops/${b.tenantId}`}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#475569] hover:text-[#1E293B] truncate max-w-[170px]"
                                  >
                                    <Mark name={b.tenantName ?? 'Shop'} color={color} size={14} />
                                    <span className="truncate">{b.tenantName ?? 'Shop-Linked'}</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Pill */}
                          <div>
                            {b.isBanned ? (
                              <Badge tone="signal">Banned</Badge>
                            ) : (
                              <Badge tone="live">Active</Badge>
                            )}
                          </div>
                        </div>

                        {/* Contact details snippet */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] border-t border-[#F1F5F9] pt-2.5">
                          <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={b.email}>
                            <Mail size={12} className="text-[#94A3B8] shrink-0" />
                            <span className="truncate">{b.email !== '—' ? b.email : shortId(b.id)}</span>
                          </span>
                          {b.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={12} className="text-[#94A3B8] shrink-0" />
                              <span>{b.phone}</span>
                            </span>
                          )}
                        </div>

                        {/* Rating Banner */}
                        <div className="mt-3 flex items-center justify-between bg-[#F8FAFC] rounded-xl px-3 py-2 border border-[#E2E8F0]/70">
                          <div className="flex items-center gap-1.5">
                            <Star
                              size={15}
                              className={rNum > 0 ? 'fill-amber-400 text-amber-400' : 'text-[#CBD5E1]'}
                            />
                            <span className="text-xs font-extrabold text-[#1E293B]">
                              {rNum > 0 ? rating(rNum) : 'New / Unrated'}
                            </span>
                            {b.ratingCount > 0 && (
                              <span className="text-[11px] font-medium text-[#64748B]">
                                ({b.ratingCount} reviews)
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-medium text-[#94A3B8]">
                            Joined {date(b.createdAt)}
                          </span>
                        </div>

                        {/* 3-Column Performance Stats Grid */}
                        <div className="mt-3 grid grid-cols-3 gap-2 py-1 text-center">
                          <div className="rounded-xl bg-[#F8FAFC] p-2 border border-[#E2E8F0]/60">
                            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                              Bookings
                            </span>
                            <span className="text-sm font-extrabold text-[#1E293B] tabular-nums mt-0.5 block">
                              {count(b.appointmentsCount || 0)}
                            </span>
                          </div>

                          <div className="rounded-xl bg-[#F8FAFC] p-2 border border-[#E2E8F0]/60">
                            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                              Services
                            </span>
                            <span className="text-sm font-extrabold text-[#1E293B] tabular-nums mt-0.5 block">
                              {count(b.servicesCount || 0)}
                            </span>
                          </div>

                          <div className="rounded-xl bg-[#F8FAFC] p-2 border border-[#E2E8F0]/60">
                            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                              Revenue
                            </span>
                            <span className="text-sm font-extrabold text-emerald-600 tabular-nums mt-0.5 block">
                              {money(b.totalRevenue || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setQuickPreview({ userId: b.id, name: b.name })}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-bold text-[#475569] hover:bg-white hover:text-[#1E293B] transition-all cursor-pointer"
                          >
                            <Eye size={12} />
                            Quick Look
                          </button>

                          {b.isBanned ? (
                            <button
                              onClick={() => handleUnban(b)}
                              disabled={unban.pending}
                              title="Unban this barber"
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                            >
                              <Unlock size={12} />
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setBanningTarget(b);
                                setBanReason('');
                              }}
                              disabled={ban.pending}
                              title="Ban this account"
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              <Lock size={12} />
                              Ban
                            </button>
                          )}
                        </div>

                        <Link
                          href={`/barbers/${b.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#635BFF] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#5349e0] transition-all"
                        >
                          <span>Inspect Hub</span>
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
                        <Th>Barber / Stylist</Th>
                        <Th>Affiliation & Studio</Th>
                        <Th>Model</Th>
                        <Th align="right">Rating</Th>
                        <Th align="right">Bookings</Th>
                        <Th align="right">Services</Th>
                        <Th align="right">Revenue (Est.)</Th>
                        <Th align="right">Joined</Th>
                        <Th align="right">Status</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((b) => {
                        const color = brandColor(b.shopBrandColor);
                        return (
                          <Tr key={b.id}>
                            {/* Barber identity */}
                            <Td nowrap={false}>
                              <Link
                                href={`/barbers/${b.id}`}
                                className="group flex items-center gap-2.5 font-medium hover:text-[#635BFF]"
                              >
                                <span
                                  className="tabular inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E293B] text-[11px] font-extrabold text-white shadow-xs"
                                  style={b.shopBrandColor ? { backgroundColor: color } : undefined}
                                  aria-hidden
                                >
                                  {initials(b.name)}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-bold text-[#1E293B] group-hover:text-[#635BFF]">
                                    {b.name}
                                  </span>
                                  <span className="tabular block text-[11px] text-[#64748B]">
                                    {b.email !== '—' ? b.email : shortId(b.id)}
                                  </span>
                                </span>
                              </Link>
                            </Td>

                            {/* Shop Affiliation */}
                            <Td muted nowrap={false}>
                              {b.tenantId ? (
                                <Link
                                  href={`/shops/${b.tenantId}`}
                                  className="flex items-center gap-1.5 hover:text-[#1E293B]"
                                >
                                  <Mark name={b.tenantName ?? 'Shop'} color={color} size={18} />
                                  <span className="truncate text-xs font-semibold">
                                    {b.tenantName ?? shortId(b.tenantId)}
                                  </span>
                                </Link>
                              ) : (
                                <span className="flex items-center gap-1 text-purple-600 font-semibold text-xs">
                                  <Sparkles size={12} />
                                  Independent Solo
                                </span>
                              )}
                            </Td>

                            {/* Type Pill */}
                            <Td>
                              {b.type === 'SHOP_STAFF' ? (
                                <Badge tone="plain">
                                  <Store size={10} className="mr-1" />
                                  Shop Stylist
                                </Badge>
                              ) : (
                                <Badge tone="live">
                                  <Scissors size={10} className="mr-1" />
                                  Solo Barber
                                </Badge>
                              )}
                            </Td>

                            {/* Rating */}
                            <Td align="right" mono muted>
                              {Number(b.ratingAvg) > 0 ? (
                                <span className="flex items-center justify-end gap-1 font-extrabold text-[#1E293B]">
                                  <Star size={12} className="fill-amber-400 text-amber-400" />
                                  {rating(b.ratingAvg)}
                                  {b.ratingCount > 0 && (
                                    <span className="text-[#94A3B8] font-medium text-[11px]">
                                      ({b.ratingCount})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[#94A3B8] text-xs">New</span>
                              )}
                            </Td>

                            {/* Bookings Count */}
                            <Td align="right" mono>
                              <span className="font-extrabold text-[#1E293B]">
                                {count(b.appointmentsCount || 0)}
                              </span>
                            </Td>

                            {/* Services Count */}
                            <Td align="right" mono>
                              <span className="font-semibold text-[#64748B]">
                                {count(b.servicesCount || 0)}
                              </span>
                            </Td>

                            {/* Revenue */}
                            <Td align="right" mono>
                              <span className="font-extrabold text-emerald-600">
                                {money(b.totalRevenue || 0)}
                              </span>
                            </Td>

                            {/* Joined Date */}
                            <Td align="right" mono muted>
                              {date(b.createdAt)}
                            </Td>

                            {/* Status */}
                            <Td align="right">
                              {b.isBanned ? (
                                <Badge tone="signal">Banned</Badge>
                              ) : (
                                <Badge tone="live">Active</Badge>
                              )}
                            </Td>

                            {/* Actions */}
                            <Td align="right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setQuickPreview({ userId: b.id, name: b.name })}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1 text-[11px] font-bold text-[#475569] hover:bg-white hover:text-[#1E293B]"
                                  title="Quick look preview"
                                >
                                  <Eye size={12} />
                                </button>

                                <Link
                                  href={`/barbers/${b.id}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#1E293B] hover:bg-[#F8FAFC] hover:text-[#635BFF]"
                                >
                                  Inspect Hub
                                </Link>

                                {b.isBanned ? (
                                  <Button
                                    variant="secondary"
                                    onClick={() => handleUnban(b)}
                                    disabled={unban.pending}
                                    title="Unban this barber"
                                  >
                                    <Unlock size={11} className="mr-1 text-emerald-600" />
                                    Unban
                                  </Button>
                                ) : (
                                  <Button
                                    variant="danger"
                                    onClick={() => {
                                      setBanningTarget(b);
                                      setBanReason('');
                                    }}
                                    disabled={ban.pending}
                                    title="Ban this account"
                                  >
                                    <Lock size={11} />
                                  </Button>
                                )}
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

      {/* Quick Preview Modal if requested */}
      {quickPreview && (
        <BarberDetailModal
          userId={quickPreview.userId}
          name={quickPreview.name}
          onClose={() => setQuickPreview(null)}
        />
      )}

      {/* Ban Barber Modal */}
      {banningTarget && (
        <Modal
          title={`Ban ${banningTarget.name}`}
          note="Suspending this account immediately revokes login, invalidates all sessions, and closes upcoming booking availability across all channels."
          onClose={() => setBanningTarget(null)}
        >
          <div className="space-y-4 font-manrope">
            <FormError message={ban.error} />
            <Field label="Ban Reason" hint="Optional rationale logged with this moderation action">
              <TextInput
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Repeated policy violations, customer complaint audit"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setBanningTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleBanSubmit} disabled={ban.pending}>
                <ShieldAlert size={13} className="mr-1" />
                Confirm Ban
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
