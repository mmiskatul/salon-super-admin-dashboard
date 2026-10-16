'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  RotateCw,
  Search,
  ShieldAlert,
  Scissors,
  Store,
  UserCheck,
  Users,
  XCircle,
  Crown,
  Sparkles,
  SlidersHorizontal,
  Mail,
  Phone,
  Activity,
  Calendar,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { listUsers, type PlatformUser } from '@/lib/api/users';
import { listTenants } from '@/lib/api/tenants';
import { getOverview, type InsightDays } from '@/lib/api/insights';
import { count, date, initials, shortId, since } from '@/lib/format';
import {
  Badge,
  Button,
  Canvas,
  Empty,
  Failed,
  Loading,
  PageHead,
  Panel,
} from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { DonutBreakdownChart } from '@/components/overview/OverviewRecharts';

const ROLES = ['ALL', 'CUSTOMER', 'OWNER', 'BARBER', 'STAFF', 'SUPER_ADMIN'] as const;
type RoleFilter = (typeof ROLES)[number];

const PAGE_SIZE = 50;

export function UserRoleBadge({ role }: { role?: string }) {
  const normalized = (role || '').toUpperCase();
  switch (normalized) {
    case 'SUPER_ADMIN':
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-bold text-[#6D28D9]">Super Admin</span>;
    case 'OWNER':
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-bold text-[#0369A1]">Shop Owner</span>;
    case 'STAFF':
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">Staff Barber</span>;
    case 'BARBER':
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold text-[#B45309]">Barber</span>;
    case 'CUSTOMER':
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-bold text-[#4338CA]">Customer</span>;
    default:
      return <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">{role || 'Unknown'}</span>;
  }
}

function UsersPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read URL query parameters passed from Overview / Account Breakdown
  const roleParam = searchParams.get('role')?.toUpperCase();
  const statusParam = searchParams.get('status')?.toLowerCase();
  const urlQuery = searchParams.get('q') ?? '';
  const daysParam = searchParams.get('days');
  const dateParam = searchParams.get('date');

  const todayIso = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>(
    roleParam && ROLES.includes(roleParam as RoleFilter) ? (roleParam as RoleFilter) : 'ALL'
  );

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'unverified' | 'banned'>(
    statusParam === 'unverified' || statusParam === 'banned' ? statusParam : 'ALL'
  );

  const [query, setQuery] = useState(urlQuery);
  const [search, setSearch] = useState(urlQuery.trim());
  const [page, setPage] = useState(1);

  const days: InsightDays = useMemo(() => {
    if (daysParam === '1') return 1;
    if (daysParam === '7') return 7;
    if (daysParam === '30') return 30;
    if (daysParam === '90') return 90;
    if (daysParam === '365') return 365;
    return 30;
  }, [daysParam]);

  const selectedDate = useMemo(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam;
    }
    return todayIso;
  }, [dateParam, todayIso]);

  // Synchronize state if URL query parameters change
  useEffect(() => {
    if (roleParam && ROLES.includes(roleParam as RoleFilter)) {
      setRoleFilter(roleParam as RoleFilter);
    }
    if (statusParam === 'unverified' || statusParam === 'banned') {
      setStatusFilter(statusParam);
    }
    if (urlQuery) {
      setQuery(urlQuery);
      setSearch(urlQuery.trim());
    }
  }, [roleParam, statusParam, urlQuery]);

  // Debounced search query
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Load Overview data for whole-platform account composition & active engagement
  const overviewApi = useApi(
    () => getOverview(days, selectedDate),
    [days, selectedDate],
    'users-overview-metrics'
  );
  const o = overviewApi.data;

  // Load paginated users directly from backend
  const usersApi = useApi(
    () =>
      listUsers({
        search: search || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: PAGE_SIZE,
      }),
    [roleFilter, statusFilter, page, search],
    'users-directory-list'
  );

  // Load tenants roster for shop lookup
  const tenantsApi = useApi(() => listTenants(), [], 'tenants-directory');
  const shopNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tenantsApi.data ?? []) {
      map.set(t.id, t.name);
    }
    return map;
  }, [tenantsApi.data]);

  const usersData = usersApi.data;
  const rows: PlatformUser[] = useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData;
    return usersData.data ?? [];
  }, [usersData]);

  const totalUsersCount = useMemo(() => {
    if (!usersData) return 0;
    if (Array.isArray(usersData)) return usersData.length;
    return usersData.total ?? rows.length;
  }, [usersData, rows]);

  const totalPages = Math.max(1, Math.ceil(totalUsersCount / PAGE_SIZE));

  function selectRole(r: RoleFilter) {
    setRoleFilter(r);
    setStatusFilter('ALL');
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if (r === 'ALL') params.delete('role');
    else params.set('role', r);
    params.delete('status');
    router.replace(`/users?${params.toString()}`);
  }

  function selectStatus(s: 'ALL' | 'unverified' | 'banned') {
    setStatusFilter(s);
    setRoleFilter('ALL');
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if (s === 'ALL') params.delete('status');
    else params.set('status', s);
    params.delete('role');
    router.replace(`/users?${params.toString()}`);
  }

  return (
    <>
      <PageHead
        eyebrow="User Ecosystem & Directory"
        title="Users & Account Breakdown"
        lede="Comprehensive directory of registered users across all platform applications, with real-time role distribution, verification status, and tenant affiliations."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4" /> Platform Overview
              </Button>
            </Link>
            <Button
              onClick={() => {
                usersApi.refresh();
                overviewApi.refresh();
              }}
              disabled={usersApi.loading || overviewApi.loading}
            >
              <RotateCw
                size={14}
                className={usersApi.loading || overviewApi.loading ? 'animate-spin' : ''}
              />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        <div className="space-y-6 font-manrope">
          {/* Account Breakdown Visual Section (Matches Overview & Expands It!) */}
          {o && (
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#1E293B]">
                      Platform Account Composition & Health
                    </h3>
                    <p className="text-[11px] font-medium text-[#64748B]">
                      Total platform user distribution across {count(o.people.total)} registered accounts
                    </p>
                  </div>
                </div>

                {/* Live Active Engagement Badges */}
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 font-bold text-[#15803D]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] animate-pulse" />
                    DAU: {count(o.active.day.total)} today
                  </span>
                  <span className="rounded-full bg-[#EEF2FF] px-2.5 py-0.5 font-bold text-[#4338CA]">
                    WAU: {count(o.active.week.total)} week
                  </span>
                  <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 font-bold text-[#475569]">
                    MAU: {count(o.active.month.total)} month
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Left: Donut Chart */}
                <div className="lg:border-r lg:border-[#F1F5F9] lg:pr-6">
                  <DonutBreakdownChart
                    centreLabel="Accounts"
                    total={o.people.total}
                    parts={[
                      { name: 'Customers', value: o.people.customers, color: '#635BFF' },
                      { name: 'Shop Owners', value: o.people.owners, color: '#0EA5E9' },
                      { name: 'Shop Barbers', value: o.people.shopBarbers, color: '#16A34A' },
                      { name: 'Independent Barbers', value: o.people.independentBarbers, color: '#F59E0B' },
                      { name: 'Admins', value: o.people.admins, color: '#94A3B8' },
                    ]}
                  />
                </div>

                {/* Right: Interactive Role & Status Cards (Click to filter table!) */}
                <div className="lg:col-span-2 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                    Click any category to filter the directory table below:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* All Accounts */}
                    <button
                      type="button"
                      onClick={() => {
                        selectRole('ALL');
                        selectStatus('ALL');
                      }}
                      className={`cursor-pointer rounded-xl p-3 text-left transition-all border ${
                        roleFilter === 'ALL' && statusFilter === 'ALL'
                          ? 'border-[#635BFF] bg-[#EEF2FF]/40 shadow-xs'
                          : 'border-[#E2E8F0] bg-[#FAFBFD] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase text-[#64748B]">All Accounts</span>
                      <span className="text-xl font-extrabold text-[#1E293B] tabular-nums">
                        {count(o.people.total)}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#635BFF]">+{o.people.newInPeriod} new</span>
                    </button>

                    {/* Customers */}
                    <button
                      type="button"
                      onClick={() => selectRole('CUSTOMER')}
                      className={`cursor-pointer rounded-xl p-3 text-left transition-all border ${
                        roleFilter === 'CUSTOMER'
                          ? 'border-[#635BFF] bg-[#EEF2FF]/40 shadow-xs'
                          : 'border-[#E2E8F0] bg-[#FAFBFD] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase text-[#635BFF]">Customers</span>
                      <span className="text-xl font-extrabold text-[#4338CA] tabular-nums">
                        {count(o.people.customers)}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#64748B]">
                        {Math.round((o.people.customers / o.people.total) * 100)}% of total
                      </span>
                    </button>

                    {/* Shop Owners */}
                    <button
                      type="button"
                      onClick={() => selectRole('OWNER')}
                      className={`cursor-pointer rounded-xl p-3 text-left transition-all border ${
                        roleFilter === 'OWNER'
                          ? 'border-[#0EA5E9] bg-[#E0F2FE]/40 shadow-xs'
                          : 'border-[#E2E8F0] bg-[#FAFBFD] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase text-[#0EA5E9]">Shop Owners</span>
                      <span className="text-xl font-extrabold text-[#0369A1] tabular-nums">
                        {count(o.people.owners)}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#64748B]">
                        {o.places.shops} registered shops
                      </span>
                    </button>

                    {/* Barbers & Staff */}
                    <button
                      type="button"
                      onClick={() => selectRole('BARBER')}
                      className={`cursor-pointer rounded-xl p-3 text-left transition-all border ${
                        roleFilter === 'BARBER' || roleFilter === 'STAFF'
                          ? 'border-[#16A34A] bg-[#DCFCE7]/40 shadow-xs'
                          : 'border-[#E2E8F0] bg-[#FAFBFD] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase text-[#16A34A]">Barbers</span>
                      <span className="text-xl font-extrabold text-[#15803D] tabular-nums">
                        {count(o.people.shopBarbers + o.people.independentBarbers)}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#64748B]">
                        {o.people.shopBarbers} shop · {o.people.independentBarbers} freelance
                      </span>
                    </button>

                    {/* Admins */}
                    <button
                      type="button"
                      onClick={() => selectRole('SUPER_ADMIN')}
                      className={`cursor-pointer rounded-xl p-3 text-left transition-all border ${
                        roleFilter === 'SUPER_ADMIN'
                          ? 'border-[#6D28D9] bg-[#EDE9FE]/40 shadow-xs'
                          : 'border-[#E2E8F0] bg-[#FAFBFD] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase text-[#6D28D9]">Super Admins</span>
                      <span className="text-xl font-extrabold text-[#6D28D9] tabular-nums">
                        {count(o.people.admins)}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#64748B]">Console access</span>
                    </button>

                    {/* Unverified Accounts */}
                    <button
                      type="button"
                      onClick={() => selectStatus('unverified')}
                      className={`cursor-pointer rounded-xl p-3 text-left transition-all border ${
                        statusFilter === 'unverified'
                          ? 'border-[#F59E0B] bg-[#FEF3C7]/40 shadow-xs'
                          : 'border-[#E2E8F0] bg-[#FAFBFD] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase text-[#B45309]">Unverified</span>
                      <span className="text-xl font-extrabold text-[#B45309] tabular-nums">
                        {count(o.people.unverified)}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#B45309]">Needs verification</span>
                    </button>

                    {/* Banned Accounts */}
                    <button
                      type="button"
                      onClick={() => selectStatus('banned')}
                      className={`cursor-pointer rounded-xl p-3 text-left transition-all border ${
                        statusFilter === 'banned'
                          ? 'border-[#EF4444] bg-[#FEE2E2]/40 shadow-xs'
                          : 'border-[#E2E8F0] bg-[#FAFBFD] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="block text-[10px] font-bold uppercase text-[#EF4444]">Banned</span>
                      <span className="text-xl font-extrabold text-[#BE123C] tabular-nums">
                        {count(o.people.banned)}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#EF4444]">Suspended access</span>
                    </button>

                    {/* New Signups in Period */}
                    <div className="rounded-xl p-3 text-left border border-[#E2E8F0] bg-[#FAFBFD]">
                      <span className="block text-[10px] font-bold uppercase text-[#635BFF]">New In Period</span>
                      <span className="text-xl font-extrabold text-[#635BFF] tabular-nums">
                        +{count(o.people.newInPeriod)}
                      </span>
                      <span className="block text-[10px] font-semibold text-[#64748B]">
                        {o.people.newCustomers} cust · {o.people.newPartners} part
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Directory Table & Search Console */}
          <Panel
            flush
            title={`Accounts Directory (${count(totalUsersCount)} total)`}
            note={
              statusFilter !== 'ALL'
                ? `Filtered by ${statusFilter} status`
                : roleFilter !== 'ALL'
                ? `Filtered by ${roleFilter.toLowerCase()} role`
                : 'All registered platform accounts'
            }
            actions={
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Bar */}
                <label className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email, phone, or ID..."
                    aria-label="Search users"
                    className="w-[230px] rounded-lg border border-[#E2E8F0] bg-white py-1.5 pr-3 pl-8 text-[12px] font-semibold text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-all"
                  />
                </label>
              </div>
            }
          >
            {/* Filter Tabs Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] bg-[#FAFBFD] px-4 py-2 text-[12px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#64748B] uppercase mr-1">Role:</span>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => selectRole(r)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      roleFilter === r && statusFilter === 'ALL'
                        ? 'bg-[#635BFF] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    {r === 'ALL' ? 'All Roles' : r === 'SUPER_ADMIN' ? 'Admins' : r.toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#64748B] uppercase mr-1">Status:</span>
                <button
                  type="button"
                  onClick={() => selectStatus('unverified')}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    statusFilter === 'unverified'
                      ? 'bg-[#F59E0B] text-white shadow-2xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Unverified
                </button>
                <button
                  type="button"
                  onClick={() => selectStatus('banned')}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                    statusFilter === 'banned'
                      ? 'bg-[#EF4444] text-white shadow-2xs'
                      : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Banned
                </button>
              </div>
            </div>

            {usersApi.error ? (
              <div className="p-8">
                <Failed message={usersApi.error} onRetry={usersApi.refresh} />
              </div>
            ) : usersApi.loading && !rows.length ? (
              <div className="p-8">
                <Loading label="Querying users directory..." />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center">
                <Empty
                  title="No accounts match current filters"
                  hint={
                    query
                      ? `No accounts found matching "${query}". Try adjusting your keywords.`
                      : 'No users found in this specific role or status category.'
                  }
                />
              </div>
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <Tr className="border-b border-[#E2E8F0] bg-[#FAFBFD] text-[11px] font-bold uppercase text-[#64748B]">
                      <Th className="py-3 pl-4">Account & Profile</Th>
                      <Th className="py-3">Role</Th>
                      <Th className="py-3">Salon Affiliation</Th>
                      <Th className="py-3">Verification & Status</Th>
                      <Th className="py-3 text-right">Registered</Th>
                      <Th className="py-3 text-right pr-4">Action</Th>
                    </Tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                    {rows.map((u) => {
                      const displayName = u.name || u.email.split('@')[0];
                      const affiliatedShop = u.tenantId ? shopNameMap.get(u.tenantId) : null;
                      const isCustomer = (u.role || '').toUpperCase() === 'CUSTOMER';
                      const isOwner = (u.role || '').toUpperCase() === 'OWNER';
                      const isBarber = (u.role || '').toUpperCase() === 'BARBER' || (u.role || '').toUpperCase() === 'STAFF';

                      const profileLink = isCustomer
                        ? `/customers/${encodeURIComponent(u.id)}`
                        : isOwner
                        ? `/owners/${encodeURIComponent(u.id)}`
                        : isBarber
                        ? `/barbers/${encodeURIComponent(u.id)}`
                        : `/users/${encodeURIComponent(u.id)}`;

                      return (
                        <Tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                          {/* Account & Profile */}
                          <Td className="py-3 pl-4">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[12px] font-extrabold text-[#1E293B] border border-[#E2E8F0]">
                                  {initials(u.name || u.email)}
                                </span>
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                                    u.isBanned
                                      ? 'bg-[#EF4444]'
                                      : u.emailVerified
                                      ? 'bg-[#16A34A]'
                                      : 'bg-[#F59E0B]'
                                  }`}
                                  title={u.isBanned ? 'Banned' : u.emailVerified ? 'Verified' : 'Unverified'}
                                />
                              </div>

                              <div className="min-w-0">
                                <Link
                                  href={profileLink}
                                  className="block truncate font-bold text-[#1E293B] hover:text-[#635BFF] transition-colors"
                                >
                                  {displayName}
                                </Link>
                                <span className="block truncate text-[11px] text-[#64748B]">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </Td>

                          {/* Role Badge */}
                          <Td className="py-3">
                            <UserRoleBadge role={u.role} />
                          </Td>

                          {/* Salon Affiliation */}
                          <Td className="py-3">
                            {u.tenantId ? (
                              <Link
                                href={`/shops/${encodeURIComponent(u.tenantId)}`}
                                className="inline-flex items-center gap-1 text-[12px] font-bold text-[#1E293B] hover:text-[#635BFF] hover:underline"
                              >
                                <Store className="h-3 w-3 text-[#64748B]" />
                                <span className="truncate max-w-[170px]">{affiliatedShop || shortId(u.tenantId)}</span>
                                <ArrowUpRight className="h-2.5 w-2.5 text-[#94A3B8]" />
                              </Link>
                            ) : (
                              <span className="text-[12px] text-[#94A3B8]">
                                {u.role === 'BARBER' ? 'Freelance / Independent' : u.role === 'OWNER' ? 'No salon yet' : 'Individual'}
                              </span>
                            )}
                          </Td>

                          {/* Status */}
                          <Td className="py-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {u.emailVerified ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-bold text-[#15803D]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold text-[#B45309]">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </span>
                              )}
                              {u.isBanned && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-bold text-[#EF4444]">
                                  <ShieldAlert className="h-3 w-3" />
                                  Banned
                                </span>
                              )}
                            </div>
                          </Td>

                          {/* Registered Date */}
                          <Td className="py-3 text-right tabular-nums text-[12px] text-[#64748B]">
                            <span title={date(u.createdAt)}>{since(u.createdAt)}</span>
                          </Td>

                          {/* Direct Actions */}
                          <Td className="py-3 text-right pr-4">
                            <Link
                              href={profileLink}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#635BFF] hover:bg-[#635BFF] hover:text-white hover:border-[#635BFF] transition-all shadow-2xs"
                            >
                              <span>{isCustomer ? 'Customer 360' : isOwner ? 'Owner Profile' : isBarber ? 'Barber Profile' : 'Inspect'}</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </Td>
                        </Tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Scroll>
            )}

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between border-t border-[#F1F5F9] bg-[#FAFBFD] px-4 py-3 text-[12px] text-[#64748B]">
              <span>
                Page {page} of {totalPages} &middot; Showing {rows.length} of {count(totalUsersCount)} accounts
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || usersApi.loading}
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || usersApi.loading}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </Canvas>
    </>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<Loading label="Loading users directory and account breakdown..." />}>
      <UsersPageInner />
    </Suspense>
  );
}
