'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  Calendar,
  Scissors,
  Eye,
  Copy,
  Check,
  Store,
  Lock,
  Unlock,
  DollarSign,
  Sparkles,
  LayoutGrid,
  List,
  Star,
  ArrowRight,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { listOwnerDashboards, type OwnerDashboardSummary } from '@/lib/api/owners';
import { suspendTenant, unsuspendTenant } from '@/lib/api/tenants';
import { banUser, unbanUser } from '@/lib/api/users';
import { brandColor, count, money, since } from '@/lib/format';
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
import { OwnerDashboardsAnalytics } from '@/components/owners/OwnerDashboardsAnalytics';

type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
type FocusSegment = 'all' | 'top_earners' | 'multi_barber' | 'attention' | 'newest';
type SortKey = 'revenue' | 'barbers' | 'clients' | 'bookings' | 'newest' | 'name';
type ViewMode = 'grid' | 'table';

export default function OwnerDashboardsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [focusSegment, setFocusSegment] = useState<FocusSegment>('all');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Administrative Modals state
  const [suspendingTarget, setSuspendingTarget] = useState<OwnerDashboardSummary | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [banningTarget, setBanningTarget] = useState<OwnerDashboardSummary | null>(null);
  const [banReason, setBanReason] = useState('');

  const suspend = useMutation(suspendTenant);
  const unsuspend = useMutation(unsuspendTenant);
  const ban = useMutation(banUser);
  const unban = useMutation(unbanUser);

  const { data: dashboards, loading, error, refresh } = useApi(() => listOwnerDashboards(), [], 'owner-dashboards');

  function copyText(txt: string) {
    navigator.clipboard.writeText(txt);
    setCopiedCode(txt);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const rows = useMemo(() => dashboards ?? [], [dashboards]);

  // Summary Metrics across all owners
  const totals = useMemo(() => {
    let activeCount = 0;
    let suspendedCount = 0;
    let bannedCount = 0;
    let totalBarbers = 0;
    let totalClients = 0;
    let totalBookings = 0;
    let totalRevenue = 0;

    for (const d of rows) {
      if (d.isSuspended) suspendedCount++;
      else activeCount++;
      if (d.isBanned) bannedCount++;

      totalBarbers += d.barbersCount;
      totalClients += d.clientsCount;
      totalBookings += d.appointmentsCount;
      totalRevenue += d.revenueTotal;
    }

    return {
      totalDashboards: rows.length,
      activeCount,
      suspendedCount,
      bannedCount,
      totalBarbers,
      totalClients,
      totalBookings,
      totalRevenue,
    };
  }, [rows]);

  // Filtering and sorting with Focus Segments
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const thirtyDaysAgo = Date.now() - 30 * 86_400_000;

    return rows
      .filter((d) => {
        // Status filter
        if (statusFilter === 'ACTIVE' && (d.isSuspended || d.isBanned)) return false;
        if (statusFilter === 'SUSPENDED' && !d.isSuspended) return false;
        if (statusFilter === 'BANNED' && !d.isBanned) return false;

        // Focus Segment filter
        if (focusSegment === 'top_earners' && d.revenueTotal <= 0) return false;
        if (focusSegment === 'multi_barber' && d.barbersCount < 2) return false;
        if (focusSegment === 'attention' && !d.isSuspended && !d.isBanned && d.isListed) return false;
        if (focusSegment === 'newest') {
          const createdTime = new Date(d.tenantCreatedAt).getTime();
          if (createdTime < thirtyDaysAgo) return false;
        }

        // Query search
        if (!q) return true;
        return (
          d.ownerName.toLowerCase().includes(q) ||
          d.ownerEmail.toLowerCase().includes(q) ||
          d.tenantName.toLowerCase().includes(q) ||
          (d.joinCode && d.joinCode.toLowerCase().includes(q)) ||
          d.ownerId.toLowerCase().includes(q) ||
          d.tenantId.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        switch (sortKey) {
          case 'revenue':
            return b.revenueTotal - a.revenueTotal;
          case 'barbers':
            return b.barbersCount - a.barbersCount;
          case 'clients':
            return b.clientsCount - a.clientsCount;
          case 'bookings':
            return b.appointmentsCount - a.appointmentsCount;
          case 'name':
            return a.tenantName.localeCompare(b.tenantName);
          case 'newest':
          default:
            return new Date(b.tenantCreatedAt).getTime() - new Date(a.tenantCreatedAt).getTime();
        }
      });
  }, [rows, query, statusFilter, focusSegment, sortKey]);

  return (
    <>
      <PageHead
        eyebrow="Platform Management"
        title="Owner Dashboards"
        lede="Oversee and govern all registered salon owner dashboards. Inspect salon capacity, track revenue and appointment velocity, and administer operational permissions."
        actions={
          <Button onClick={refresh} disabled={loading}>
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={refresh} />}
        {loading && !dashboards && <Loading label="Loading owner dashboards and connected metrics" />}

        {dashboards && !error && (
          <div className="space-y-6">
            {/* Top Stat Counters */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              <Stat
                label="Owner Dashboards"
                value={count(totals.totalDashboards)}
                tone="plain"
                icon={<Store className="h-4 w-4 text-[#635BFF]" />}
                iconBg="bg-[#EEF2FF]"
              />
              <Stat
                label="Active Salons"
                value={count(totals.activeCount)}
                tone="live"
                icon={<ShieldCheck className="h-4 w-4 text-[#10B981]" />}
                iconBg="bg-[#ECFDF5]"
              />
              <Stat
                label="Suspended"
                value={count(totals.suspendedCount)}
                tone={totals.suspendedCount > 0 ? 'signal' : 'plain'}
                icon={<ShieldAlert className={`h-4 w-4 ${totals.suspendedCount > 0 ? 'text-[#EF4444]' : 'text-[#64748B]'}`} />}
                iconBg={totals.suspendedCount > 0 ? 'bg-[#FEF2F2]' : 'bg-[#F1F5F9]'}
              />
              <Stat
                label="Connected Barbers"
                value={count(totals.totalBarbers)}
                tone="plain"
                icon={<Scissors className="h-4 w-4 text-[#0EA5E9]" />}
                iconBg="bg-[#E0F2FE]"
              />
              <Stat
                label="Connected Clients"
                value={count(totals.totalClients)}
                tone="plain"
                icon={<Users className="h-4 w-4 text-[#8B5CF6]" />}
                iconBg="bg-[#F5F3FF]"
              />
              <Stat
                label="Total Bookings"
                value={count(totals.totalBookings)}
                tone="plain"
                icon={<Calendar className="h-4 w-4 text-[#F59E0B]" />}
                iconBg="bg-[#FEF3C7]"
              />
              <Stat
                label="Turnover Paid"
                value={money(totals.totalRevenue)}
                tone="live"
                icon={<DollarSign className="h-4 w-4 text-[#10B981]" />}
                iconBg="bg-[#ECFDF5]"
              />
            </div>

            {/* Recharts Analytics Suite */}
            <OwnerDashboardsAnalytics
              dashboards={rows}
              onSelectSalon={(tenantId) => {
                const target = rows.find((r) => r.tenantId === tenantId);
                if (target) {
                  setQuery(target.tenantName);
                }
              }}
            />

            {/* Errors from row actions */}
            {(unsuspend.error || unban.error) && <FormError message={(unsuspend.error || unban.error)!} />}

            {/* Main Navigation, Filters, and Search */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs font-manrope space-y-4">
              {/* Segmented Perspective Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-bold">
                  <span className="text-[#94A3B8] mr-1 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <Filter className="h-3 w-3" /> Focus View:
                  </span>
                  <button
                    type="button"
                    onClick={() => setFocusSegment('all')}
                    className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                      focusSegment === 'all'
                        ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    All Salons ({rows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusSegment('top_earners')}
                    className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                      focusSegment === 'top_earners'
                        ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    💎 Top Earners
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusSegment('multi_barber')}
                    className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                      focusSegment === 'multi_barber'
                        ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    👥 Multi-Barber (2+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusSegment('attention')}
                    className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                      focusSegment === 'attention'
                        ? 'bg-[#EF4444] text-white shadow-xs font-extrabold'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    ⚠️ Needs Attention ({totals.suspendedCount + totals.bannedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusSegment('newest')}
                    className={`rounded-xl px-3 py-1.5 transition-all cursor-pointer ${
                      focusSegment === 'newest'
                        ? 'bg-[#635BFF] text-white shadow-xs font-extrabold'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    ✨ New (30d)
                  </button>
                </div>

                {/* View Mode Toggle: Grid vs Table */}
                <div className="inline-flex items-center rounded-xl bg-[#F8FAFC] p-1 border border-[#E2E8F0] text-[12px] font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                    title="Grid Cards View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/80 font-extrabold'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                    title="Table View"
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>Table</span>
                  </button>
                </div>
              </div>

              {/* Search and Secondary Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Search by salon name, owner, email, or join code..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-2 text-[12px] text-[#1E293B] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#635BFF] transition-all font-medium"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#94A3B8] hover:text-[#1E293B]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span className="text-[#94A3B8] mr-1">Status:</span>
                    {(['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED'] as StatusFilter[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                          statusFilter === st
                            ? 'bg-[#635BFF] text-white shadow-2xs font-extrabold'
                            : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#1E293B]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-bold ml-2">
                    <span className="text-[#94A3B8]">Sort:</span>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] text-[#1E293B] font-bold focus:outline-none focus:border-[#635BFF] transition-all"
                    >
                      <option value="revenue">Highest Revenue</option>
                      <option value="barbers">Most Barbers</option>
                      <option value="clients">Most Clients</option>
                      <option value="bookings">Most Bookings</option>
                      <option value="newest">Newest</option>
                      <option value="name">Salon Name</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* RENDER VIEW: GRID OR TABLE */}
              {filteredRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-10 text-center">
                  <Store className="mx-auto h-8 w-8 text-[#94A3B8] mb-2" />
                  <p className="font-bold text-[#1E293B] text-[14px]">No owner dashboards match your filter</p>
                  <p className="mt-1 text-[12px] text-[#64748B]">
                    Try clearing your search query or switching your status filter.
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                /* GRID CARDS VIEW */
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                  {filteredRows.map((row) => {
                    const color = brandColor(row.brandColor);
                    const isOwnerBanned = row.isBanned;
                    const isShopSuspended = row.isSuspended;

                    return (
                      <div
                        key={`${row.ownerId}-${row.tenantId}`}
                        className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs hover:shadow-md hover:border-[#635BFF]/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top: Salon Identity & Status Badge */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-white text-[14px] shadow-2xs"
                                style={{ backgroundColor: color }}
                              >
                                {row.tenantName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/owners/${row.ownerId}`}
                                  className="font-extrabold text-[15px] text-[#1E293B] hover:text-[#635BFF] transition-colors truncate block"
                                >
                                  {row.tenantName}
                                </Link>
                                <p className="text-[12px] text-[#64748B] font-medium truncate">
                                  Owner: <b className="text-[#1E293B]">{row.ownerName}</b>
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isShopSuspended ? (
                                <Badge tone="signal">SUSPENDED</Badge>
                              ) : isOwnerBanned ? (
                                <Badge tone="signal">BANNED</Badge>
                              ) : !row.isListed ? (
                                <Badge tone="quiet">UNLISTED</Badge>
                              ) : (
                                <Badge tone="live">ACTIVE</Badge>
                              )}
                            </div>
                          </div>

                          {/* Email & Rating Strip */}
                          <div className="flex items-center justify-between text-[11px] text-[#94A3B8] py-2 border-y border-[#F1F5F9] mb-3">
                            <span className="truncate max-w-[170px]" title={row.ownerEmail}>
                              {row.ownerEmail}
                            </span>
                            <div className="flex items-center gap-1 font-bold text-[#1E293B]">
                              <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                              <span>{row.ratingAvg ? Number(row.ratingAvg).toFixed(1) : '5.0'}</span>
                              <span className="text-[#94A3B8] font-normal">({row.ratingCount})</span>
                            </div>
                          </div>

                          {/* 4 Mini KPIs */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-[#10B981]" /> Turnover
                              </span>
                              <p className="mt-1 text-[15px] font-black text-[#1E293B] tabular-nums">
                                {money(row.revenueTotal)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-[#635BFF]" /> Bookings
                              </span>
                              <p className="mt-1 text-[15px] font-black text-[#1E293B] tabular-nums">
                                {count(row.appointmentsCount)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1">
                                <Scissors className="h-3 w-3 text-[#0EA5E9]" /> Barbers
                              </span>
                              <p className="mt-1 text-[15px] font-black text-[#1E293B] tabular-nums">
                                {count(row.barbersCount)}
                              </p>
                            </div>

                            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1">
                                <Users className="h-3 w-3 text-[#8B5CF6]" /> Clients
                              </span>
                              <p className="mt-1 text-[15px] font-black text-[#1E293B] tabular-nums">
                                {count(row.clientsCount)}
                              </p>
                            </div>
                          </div>

                          {/* Join code pill */}
                          {row.joinCode && (
                            <div className="flex items-center justify-between text-[11px] rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5 mb-3">
                              <span className="text-[#64748B] font-semibold">Staff Join Code:</span>
                              <button
                                type="button"
                                onClick={() => copyText(row.joinCode!)}
                                className="font-mono font-bold text-[#635BFF] flex items-center gap-1 hover:underline cursor-pointer"
                                title="Click to copy join code"
                              >
                                {row.joinCode}
                                {copiedCode === row.joinCode ? (
                                  <Check className="h-3 w-3 text-[#10B981]" />
                                ) : (
                                  <Copy className="h-3 w-3 text-[#94A3B8]" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Action Controls */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#F1F5F9] mt-1">
                          <Link
                            href={`/owners/${row.ownerId}`}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#635BFF] text-white py-2 px-3 text-[12px] font-bold hover:bg-[#5248E2] transition-colors shadow-2xs"
                          >
                            <span>Inspect Dashboard</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>

                          {isShopSuspended ? (
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await unsuspend.mutate(row.tenantId);
                                if (result) await refresh();
                              }}
                              className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-2 text-[#16A34A] hover:bg-[#DCFCE7] transition-colors cursor-pointer"
                              title="Unsuspend Shop"
                            >
                              <Unlock className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSuspendingTarget(row);
                                setSuspendReason('');
                              }}
                              className="rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#64748B] hover:text-[#EF4444] hover:border-[#EF4444]/40 hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                              title="Suspend Shop"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TABLE VIEW */
                <Scroll>
                  <Table>
                    <thead>
                      <Tr>
                        <Th>Salon Owner</Th>
                        <Th>Salon & Brand</Th>
                        <Th>Connected Network</Th>
                        <Th>Gross Turnover</Th>
                        <Th>Join Code</Th>
                        <Th>Status</Th>
                        <Th className="text-right">Controls</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => {
                        const color = brandColor(row.brandColor);
                        const isOwnerBanned = row.isBanned;
                        const isShopSuspended = row.isSuspended;

                        return (
                          <Tr key={`${row.ownerId}-${row.tenantId}`} className="hover:bg-[#F8FAFC] transition-colors">
                            {/* Owner */}
                            <Td>
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-white text-[12px] shadow-2xs"
                                  style={{ backgroundColor: color }}
                                >
                                  {row.ownerName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    href={`/owners/${row.ownerId}`}
                                    className="font-bold text-[13px] text-[#1E293B] hover:text-[#635BFF] transition-colors truncate block"
                                  >
                                    {row.ownerName}
                                  </Link>
                                  <div className="text-[11px] text-[#64748B] truncate max-w-[180px]">{row.ownerEmail}</div>
                                </div>
                              </div>
                            </Td>

                            {/* Salon */}
                            <Td>
                              <div className="font-bold text-[13px] text-[#1E293B]">{row.tenantName}</div>
                              <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                                <span className="flex items-center gap-1 font-semibold text-[#1E293B]">
                                  <Star className="h-2.5 w-2.5 fill-[#F59E0B] text-[#F59E0B]" />
                                  {row.ratingAvg ? Number(row.ratingAvg).toFixed(1) : '5.0'}
                                </span>
                                <span>·</span>
                                <span>{row.businessType || 'Salon'}</span>
                              </div>
                            </Td>

                            {/* Network */}
                            <Td>
                              <div className="text-[12px] font-semibold text-[#1E293B]">
                                {count(row.barbersCount)} barbers · {count(row.clientsCount)} clients
                              </div>
                              <div className="text-[11px] text-[#64748B]">
                                {count(row.appointmentsCount)} total bookings
                              </div>
                            </Td>

                            {/* Revenue */}
                            <Td>
                              <span className="font-black text-[#10B981] tabular-nums text-[13px]">
                                {money(row.revenueTotal)}
                              </span>
                            </Td>

                            {/* Join Code */}
                            <Td>
                              {row.joinCode ? (
                                <button
                                  type="button"
                                  onClick={() => copyText(row.joinCode!)}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-mono text-[11px] font-bold text-[#635BFF] hover:bg-white transition-colors cursor-pointer"
                                  title="Click to copy join code"
                                >
                                  {row.joinCode}
                                  {copiedCode === row.joinCode ? (
                                    <Check className="h-3 w-3 text-[#10B981]" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-[#94A3B8]" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-[11px] text-[#94A3B8] italic">None</span>
                              )}
                            </Td>

                            {/* Status */}
                            <Td>
                              {isShopSuspended ? (
                                <Badge tone="signal">SUSPENDED</Badge>
                              ) : isOwnerBanned ? (
                                <Badge tone="signal">BANNED</Badge>
                              ) : !row.isListed ? (
                                <Badge tone="quiet">UNLISTED</Badge>
                              ) : (
                                <Badge tone="live">ACTIVE</Badge>
                              )}
                            </Td>

                            {/* Controls */}
                            <Td className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/owners/${row.ownerId}`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#1E293B] hover:border-[#635BFF] hover:text-[#635BFF] transition-all shadow-2xs"
                                  title="Open Owner Dashboard Inspection"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Inspect
                                </Link>

                                {isShopSuspended ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const result = await unsuspend.mutate(row.tenantId);
                                      if (result) await refresh();
                                    }}
                                    className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-1.5 text-[#16A34A] hover:bg-[#DCFCE7] transition-colors cursor-pointer"
                                    title="Unsuspend Shop"
                                  >
                                    <Unlock className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSuspendingTarget(row);
                                      setSuspendReason('');
                                    }}
                                    className="rounded-lg border border-[#E2E8F0] bg-white p-1.5 text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                                    title="Suspend Shop"
                                  >
                                    <Lock className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Scroll>
              )}
            </div>
          </div>
        )}
      </Canvas>

      {/* Suspend Confirmation Modal */}
      {suspendingTarget && (
        <Modal
          title={`Suspend ${suspendingTarget.tenantName}`}
          onClose={() => setSuspendingTarget(null)}
        >
          <div className="space-y-4">
            <p className="text-[13px] text-[#64748B]">
              Suspending <b>{suspendingTarget.tenantName}</b> immediately hides the salon and all its barbers from
              customer search and booking apps.
            </p>
            {suspend.error && <FormError message={suspend.error} />}
            <Field label="Suspension Reason (optional)">
              <TextInput
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Terms violation, payment dispute"
              />
            </Field>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F1F5F9]">
              <Button onClick={() => setSuspendingTarget(null)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={suspend.pending}
                onClick={async () => {
                  const result = await suspend.mutate(suspendingTarget.tenantId, suspendReason);
                  if (result) {
                    setSuspendingTarget(null);
                    await refresh();
                  }
                }}
              >
                {suspend.pending ? 'Suspending...' : 'Suspend Shop'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ban Owner Modal */}
      {banningTarget && (
        <Modal
          title={`Ban ${banningTarget.ownerName}`}
          onClose={() => setBanningTarget(null)}
        >
          <div className="space-y-4">
            <p className="text-[13px] text-[#64748B]">
              Banning <b>{banningTarget.ownerName}</b> revokes their owner dashboard access across the platform.
            </p>
            {ban.error && <FormError message={ban.error} />}
            <Field label="Reason for Ban (optional)">
              <TextInput
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="e.g. Fraudulent behavior, repeated policy violations"
              />
            </Field>
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F1F5F9]">
              <Button onClick={() => setBanningTarget(null)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={ban.pending}
                onClick={async () => {
                  const result = await ban.mutate(banningTarget.ownerId, banReason);
                  if (result) {
                    setBanningTarget(null);
                    await refresh();
                  }
                }}
              >
                {ban.pending ? 'Banning...' : 'Ban Owner'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
