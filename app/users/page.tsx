'use client';

import React, { Suspense, useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  RotateCw,
  Search,
  ShieldAlert,
  ShieldCheck,
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
  X,
  Eye,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { listUsers, banUser, unbanUser, type PlatformUser } from '@/lib/api/users';
import { listTenants } from '@/lib/api/tenants';
import { getOverview, type InsightDays } from '@/lib/api/insights';
import { count, date, initials, shortId, since } from '@/lib/format';
import {
  Button,
  Canvas,
  Empty,
  Failed,
  Loading,
  PageHead,
  Panel,
} from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { UsersAnalyticsSuite } from '@/components/users/UsersAnalyticsCharts';
import { UserInspectionDrawer } from '@/components/users/UserInspectionDrawer';
import { BanUserModal, UnbanUserModal } from '@/components/users/BanUserModal';

const ROLES = ['ALL', 'CUSTOMER', 'OWNER', 'BARBER', 'STAFF', 'SUPER_ADMIN'] as const;
type RoleFilter = (typeof ROLES)[number];

const STATUS_FILTERS = ['ALL', 'verified', 'unverified', 'banned'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const AFFILIATION_FILTERS = ['ALL', 'with_shop', 'independent'] as const;
type AffiliationFilter = (typeof AFFILIATION_FILTERS)[number];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest registered' },
  { key: 'oldest', label: 'Oldest registered' },
  { key: 'name_asc', label: 'Name (A to Z)' },
  { key: 'name_desc', label: 'Name (Z to A)' },
] as const;
type SortOption = (typeof SORT_OPTIONS)[number]['key'];

export function UserRoleBadge({ role }: { role?: string }) {
  const normalized = (role || '').toUpperCase();
  switch (normalized) {
    case 'SUPER_ADMIN':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-extrabold text-[#6D28D9] border border-[#DDD6FE]">
          <Crown className="h-3 w-3" />
          Super Admin
        </span>
      );
    case 'OWNER':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-extrabold text-[#0369A1] border border-[#BAE6FD]">
          <Store className="h-3 w-3" />
          Shop Owner
        </span>
      );
    case 'STAFF':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-extrabold text-[#15803D] border border-[#BBF7D0]">
          <Scissors className="h-3 w-3" />
          Staff Barber
        </span>
      );
    case 'BARBER':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-extrabold text-[#B45309] border border-[#FDE68A]">
          <Scissors className="h-3 w-3" />
          Barber
        </span>
      );
    case 'CUSTOMER':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-extrabold text-[#4338CA] border border-[#E0E7FF]">
          <User className="h-3 w-3" />
          Customer
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#64748B] border border-[#E2E8F0]">
          {role || 'Unknown'}
        </span>
      );
  }
}

function UsersPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read URL query parameters
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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    statusParam === 'unverified' || statusParam === 'banned' || statusParam === 'verified'
      ? (statusParam as StatusFilter)
      : 'ALL'
  );

  const [affiliationFilter, setAffiliationFilter] = useState<AffiliationFilter>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [pageSize, setPageSize] = useState<number>(50);

  const [query, setQuery] = useState(urlQuery);
  const [search, setSearch] = useState(urlQuery.trim());
  const [page, setPage] = useState(1);

  // Selection & Inspector state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectUser, setInspectUser] = useState<PlatformUser | null>(null);
  const [banTargetUser, setBanTargetUser] = useState<PlatformUser | null>(null);
  const [unbanTargetUser, setUnbanTargetUser] = useState<PlatformUser | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

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

  // Synchronize state with URL parameters
  useEffect(() => {
    if (roleParam && ROLES.includes(roleParam as RoleFilter)) {
      setRoleFilter(roleParam as RoleFilter);
    }
    if (statusParam === 'unverified' || statusParam === 'banned' || statusParam === 'verified') {
      setStatusFilter(statusParam as StatusFilter);
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

  // Server-side query parameter for status: backend supports 'unverified' and 'banned'
  const backendStatusParam =
    statusFilter === 'unverified' || statusFilter === 'banned' ? statusFilter : undefined;

  // Load paginated users directly from backend
  const usersApi = useApi(
    () =>
      listUsers({
        search: search || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: backendStatusParam,
        page,
        limit: pageSize,
      }),
    [roleFilter, backendStatusParam, page, pageSize, search],
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
  const rawRows: PlatformUser[] = useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData;
    return usersData.data ?? [];
  }, [usersData]);

  // Client-side additional filtering and sorting
  const rows: PlatformUser[] = useMemo(() => {
    let list = [...rawRows];

    // Status: verified filter (if backend didn't filter verified)
    if (statusFilter === 'verified') {
      list = list.filter((u) => u.emailVerified && !u.isBanned);
    }

    // Affiliation filter
    if (affiliationFilter === 'with_shop') {
      list = list.filter((u) => Boolean(u.tenantId));
    } else if (affiliationFilter === 'independent') {
      list = list.filter((u) => !u.tenantId);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === 'name_asc') {
        const nameA = a.name || a.email;
        const nameB = b.name || b.email;
        return nameA.localeCompare(nameB);
      }
      if (sortOption === 'name_desc') {
        const nameA = a.name || a.email;
        const nameB = b.name || b.email;
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return list;
  }, [rawRows, statusFilter, affiliationFilter, sortOption]);

  const totalUsersCount = useMemo(() => {
    if (!usersData) return 0;
    if (Array.isArray(usersData)) return usersData.length;
    return usersData.total ?? rawRows.length;
  }, [usersData, rawRows]);

  const totalPages = Math.max(1, Math.ceil(totalUsersCount / pageSize));

  // Switch timeframe handler
  const handleSelectDays = useCallback(
    (newDays: InsightDays) => {
      const params = new URLSearchParams(window.location.search);
      params.set('days', String(newDays));
      router.replace(`/users?${params.toString()}`);
    },
    [router]
  );

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

  function selectStatus(s: StatusFilter) {
    setStatusFilter(s);
    setRoleFilter('ALL');
    setPage(1);
    const params = new URLSearchParams(window.location.search);
    if (s === 'ALL') params.delete('status');
    else params.set('status', s);
    params.delete('role');
    router.replace(`/users?${params.toString()}`);
  }

  function resetAllFilters() {
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setAffiliationFilter('ALL');
    setQuery('');
    setSearch('');
    setPage(1);
    router.replace('/users');
  }

  // Row selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const next = new Set<string>(rows.map((r) => r.id));
      setSelectedIds(next);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy selected accounts
  const copySelectedEmails = () => {
    const selectedRows = rows.filter((r) => selectedIds.has(r.id));
    const emails = selectedRows.map((r) => r.email).join(', ');
    if (!emails) return;
    navigator.clipboard.writeText(emails).then(() => {
      setCopiedNotification(`Copied ${selectedRows.length} email addresses to clipboard!`);
      setTimeout(() => setCopiedNotification(null), 3000);
    });
  };

  const copySelectedIds = () => {
    const ids = Array.from(selectedIds).join(', ');
    if (!ids) return;
    navigator.clipboard.writeText(ids).then(() => {
      setCopiedNotification(`Copied ${selectedIds.size} user IDs to clipboard!`);
      setTimeout(() => setCopiedNotification(null), 3000);
    });
  };

  // Export visible rows to CSV
  const exportToCsv = () => {
    const header = [
      'User ID',
      'Name',
      'Email',
      'Role',
      'Salon ID',
      'Salon Name',
      'Email Verified',
      'Is Banned',
      'Ban Reason',
      'Registered Date',
    ];

    const escapeCsv = (str?: string | null) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvLines = [
      header.join(','),
      ...rows.map((u) => {
        const shop = u.tenantId ? shopNameMap.get(u.tenantId) : '';
        return [
          escapeCsv(u.id),
          escapeCsv(u.name || ''),
          escapeCsv(u.email),
          escapeCsv(u.role),
          escapeCsv(u.tenantId || ''),
          escapeCsv(shop || ''),
          u.emailVerified ? 'YES' : 'NO',
          u.isBanned ? 'YES' : 'NO',
          escapeCsv(u.bannedReason || ''),
          escapeCsv(u.createdAt),
        ].join(',');
      }),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salunbd-accounts-${todayIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct Ban & Unban actions
  const handleConfirmBan = async (userId: string, reason: string) => {
    await banUser(userId, reason);
    usersApi.refresh();
    overviewApi.refresh();
    setInspectUser((prev) => (prev && prev.id === userId ? { ...prev, isBanned: true, bannedReason: reason } : prev));
  };

  const handleConfirmUnban = async (userId: string) => {
    await unbanUser(userId);
    usersApi.refresh();
    overviewApi.refresh();
    setInspectUser((prev) => (prev && prev.id === userId ? { ...prev, isBanned: false, bannedReason: null } : prev));
  };

  const hasActiveFilters =
    roleFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    affiliationFilter !== 'ALL' ||
    Boolean(search);

  // Compute analytics segments for Recharts
  const compositionSegments = useMemo(() => {
    if (!o) return [];
    return [
      { name: 'Customers', value: o.people.customers, color: '#635BFF', roleKey: 'CUSTOMER' },
      { name: 'Shop Owners', value: o.people.owners, color: '#0EA5E9', roleKey: 'OWNER' },
      { name: 'Shop Stylists', value: o.people.shopBarbers, color: '#16A34A', roleKey: 'STAFF' },
      { name: 'Individual Barbers', value: o.people.independentBarbers, color: '#F59E0B', roleKey: 'BARBER' },
      { name: 'Super Admins', value: o.people.admins, color: '#8B5CF6', roleKey: 'SUPER_ADMIN' },
    ];
  }, [o]);

  // Compute signup trend points from overview timeline or signups
  const signupTrendPoints = useMemo(() => {
    if (o?.timeline?.signups && o.timeline.signups.length > 0) {
      return o.timeline.signups.map((s) => ({
        label: s.label,
        shortLabel: s.shortLabel,
        customers: s.customers,
        partners: s.partners,
        total: s.total,
      }));
    }
    if (o?.signups && o.signups.length > 0) {
      return o.signups.map((s) => ({
        day: s.day,
        label: s.day,
        shortLabel: s.day.slice(5),
        customers: s.customers,
        partners: s.partners,
        total: s.customers + s.partners,
      }));
    }
    return [];
  }, [o]);

  return (
    <>
      <PageHead
        eyebrow="Platform Governance & Identity"
        title="All Accounts Directory"
        lede="Comprehensive directory and real-time governance of all registered platform accounts across Customers, Shop Owners, Stylists, and Super Admins."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Timeframe Chips */}
            <div className="inline-flex items-center rounded-xl bg-[#F1F5F9] p-0.5 border border-[#E2E8F0] text-[12px] font-bold">
              {([1, 7, 30, 90, 365] as InsightDays[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDays(d)}
                  className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                    days === d
                      ? 'bg-white text-[#635BFF] shadow-2xs font-black'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {d === 1 ? 'Today' : d === 365 ? '1 Year' : `${d}D`}
                </button>
              ))}
            </div>

            {/* Platform Overview Back Link */}
            <Link href="/">
              <Button variant="outline" className="text-[12px] font-bold">
                <ArrowLeft className="h-3.5 w-3.5" /> Overview
              </Button>
            </Link>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              onClick={exportToCsv}
              disabled={rows.length === 0}
              className="text-[12px] font-bold"
              title="Export visible accounts to CSV format"
            >
              <Download className="h-3.5 w-3.5 text-[#635BFF]" /> Export CSV
            </Button>

            {/* Refresh Button */}
            <Button
              onClick={() => {
                usersApi.refresh();
                overviewApi.refresh();
              }}
              disabled={usersApi.loading || overviewApi.loading}
              className="text-[12px] font-bold"
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
          {/* Notification Toast for Quick Copy Actions */}
          {copiedNotification && (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#1E293B] px-4 py-3 text-[13px] font-bold text-white shadow-xl animate-fade-in border border-white/10">
              <Check className="h-4 w-4 text-[#10B981]" />
              <span>{copiedNotification}</span>
            </div>
          )}

          {/* Hero KPI Stat Metric Cards */}
          {o && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Platform Accounts */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                    Total Accounts
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#635BFF]/10 text-[#635BFF]">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#1E293B] tabular-nums">
                    {count(o.people.total)}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-[#EEF2FF] px-2 py-0.5 text-[11px] font-extrabold text-[#635BFF]">
                    +{count(o.people.newInPeriod)} new
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-medium text-[#64748B]">
                  {Math.round(((o.people.total - o.people.unverified) / Math.max(1, o.people.total)) * 100)}% email verified
                </p>
              </div>

              {/* Card 2: Customers Base */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#635BFF]">
                    Customers
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#635BFF]/10 text-[#635BFF]">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#4338CA] tabular-nums">
                    {count(o.people.customers)}
                  </span>
                  <span className="text-[12px] font-bold text-[#64748B]">
                    {Math.round((o.people.customers / Math.max(1, o.people.total)) * 100)}% share
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-medium text-[#64748B]">
                  +{count(o.people.newCustomers)} new registered in timeframe
                </p>
              </div>

              {/* Card 3: Providers & Partners */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0284C7]">
                    Service Providers
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0284C7]/10 text-[#0284C7]">
                    <Store className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0369A1] tabular-nums">
                    {count(o.people.owners + o.people.shopBarbers + o.people.independentBarbers)}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-extrabold text-[#0284C7]">
                    +{count(o.people.newPartners)} new
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-medium text-[#64748B]">
                  {o.places.shops} salons · {o.people.shopBarbers} shop stylists · {o.people.independentBarbers} individual
                </p>
              </div>

              {/* Card 4: Active Engagement Pulse */}
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs transition-all hover:shadow-md hover:border-[#CBD5E1]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#16A34A]">
                    Active Engagement
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16A34A]/10 text-[#16A34A]">
                    <Activity className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#15803D] tabular-nums">
                    {count(o.active.day.total)}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-black text-[#15803D]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                    DAU Today
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-medium text-[#64748B]">
                  WAU: <b className="text-[#1E293B]">{count(o.active.week.total)}</b> &middot; MAU: <b className="text-[#1E293B]">{count(o.active.month.total)}</b>
                </p>
              </div>
            </div>
          )}

          {/* Interactive Recharts Analytics Suite */}
          {o && (
            <UsersAnalyticsSuite
              totalUsers={o.people.total}
              segments={compositionSegments}
              signupPoints={signupTrendPoints}
              unverifiedCount={o.people.unverified}
              bannedCount={o.people.banned}
              activeRoleFilter={roleFilter === 'ALL' ? undefined : roleFilter}
              onSelectRole={(r) => selectRole(r as RoleFilter)}
            />
          )}

          {/* Interactive Category Filter Ribbon */}
          {o && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                  Click category card to filter the accounts directory:
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#635BFF] hover:underline cursor-pointer"
                  >
                    <X className="h-3 w-3" /> Reset all filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* 1. All Accounts */}
                <button
                  type="button"
                  onClick={() => {
                    selectRole('ALL');
                    selectStatus('ALL');
                  }}
                  className={`cursor-pointer rounded-2xl p-3.5 text-left transition-all border ${
                    roleFilter === 'ALL' && statusFilter === 'ALL'
                      ? 'border-[#635BFF] bg-[#EEF2FF]/60 shadow-xs ring-2 ring-[#635BFF]/30'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase text-[#64748B]">
                    All Accounts
                  </span>
                  <span className="text-xl font-black text-[#1E293B] tabular-nums block mt-0.5">
                    {count(o.people.total)}
                  </span>
                  <span className="block text-[10px] font-bold text-[#635BFF] mt-1">
                    +{count(o.people.newInPeriod)} new
                  </span>
                </button>

                {/* 2. Customers */}
                <button
                  type="button"
                  onClick={() => selectRole('CUSTOMER')}
                  className={`cursor-pointer rounded-2xl p-3.5 text-left transition-all border ${
                    roleFilter === 'CUSTOMER'
                      ? 'border-[#635BFF] bg-[#EEF2FF]/60 shadow-xs ring-2 ring-[#635BFF]/30'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase text-[#635BFF]">
                    Customers
                  </span>
                  <span className="text-xl font-black text-[#4338CA] tabular-nums block mt-0.5">
                    {count(o.people.customers)}
                  </span>
                  <span className="block text-[10px] font-semibold text-[#64748B] mt-1">
                    {Math.round((o.people.customers / Math.max(1, o.people.total)) * 100)}% of total
                  </span>
                </button>

                {/* 3. Shop Owners */}
                <button
                  type="button"
                  onClick={() => selectRole('OWNER')}
                  className={`cursor-pointer rounded-2xl p-3.5 text-left transition-all border ${
                    roleFilter === 'OWNER'
                      ? 'border-[#0EA5E9] bg-[#E0F2FE]/60 shadow-xs ring-2 ring-[#0EA5E9]/30'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase text-[#0EA5E9]">
                    Shop Owners
                  </span>
                  <span className="text-xl font-black text-[#0369A1] tabular-nums block mt-0.5">
                    {count(o.people.owners)}
                  </span>
                  <span className="block text-[10px] font-semibold text-[#64748B] mt-1">
                    {o.places.shops} salons
                  </span>
                </button>

                {/* 4. Barbers & Staff */}
                <button
                  type="button"
                  onClick={() => selectRole('BARBER')}
                  className={`cursor-pointer rounded-2xl p-3.5 text-left transition-all border ${
                    roleFilter === 'BARBER' || roleFilter === 'STAFF'
                      ? 'border-[#16A34A] bg-[#DCFCE7]/60 shadow-xs ring-2 ring-[#16A34A]/30'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase text-[#16A34A]">
                    Stylists
                  </span>
                  <span className="text-xl font-black text-[#15803D] tabular-nums block mt-0.5">
                    {count(o.people.shopBarbers + o.people.independentBarbers)}
                  </span>
                  <span className="block text-[10px] font-semibold text-[#64748B] mt-1">
                    {o.people.shopBarbers} shop · {o.people.independentBarbers} individual
                  </span>
                </button>

                {/* 5. Super Admins */}
                <button
                  type="button"
                  onClick={() => selectRole('SUPER_ADMIN')}
                  className={`cursor-pointer rounded-2xl p-3.5 text-left transition-all border ${
                    roleFilter === 'SUPER_ADMIN'
                      ? 'border-[#8B5CF6] bg-[#EDE9FE]/60 shadow-xs ring-2 ring-[#8B5CF6]/30'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase text-[#6D28D9]">
                    Admins
                  </span>
                  <span className="text-xl font-black text-[#6D28D9] tabular-nums block mt-0.5">
                    {count(o.people.admins)}
                  </span>
                  <span className="block text-[10px] font-semibold text-[#64748B] mt-1">
                    Super admins
                  </span>
                </button>

                {/* 6. Unverified Accounts */}
                <button
                  type="button"
                  onClick={() => selectStatus('unverified')}
                  className={`cursor-pointer rounded-2xl p-3.5 text-left transition-all border ${
                    statusFilter === 'unverified'
                      ? 'border-[#F59E0B] bg-[#FEF3C7]/60 shadow-xs ring-2 ring-[#F59E0B]/30'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase text-[#B45309]">
                    Unverified
                  </span>
                  <span className="text-xl font-black text-[#B45309] tabular-nums block mt-0.5">
                    {count(o.people.unverified)}
                  </span>
                  <span className="block text-[10px] font-bold text-[#B45309] mt-1">
                    Needs email OTP
                  </span>
                </button>

                {/* 7. Banned Accounts */}
                <button
                  type="button"
                  onClick={() => selectStatus('banned')}
                  className={`cursor-pointer rounded-2xl p-3.5 text-left transition-all border ${
                    statusFilter === 'banned'
                      ? 'border-[#EF4444] bg-[#FEE2E2]/60 shadow-xs ring-2 ring-[#EF4444]/30'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs'
                  }`}
                >
                  <span className="block text-[10px] font-extrabold uppercase text-[#EF4444]">
                    Suspended
                  </span>
                  <span className="text-xl font-black text-[#BE123C] tabular-nums block mt-0.5">
                    {count(o.people.banned)}
                  </span>
                  <span className="block text-[10px] font-bold text-[#EF4444] mt-1">
                    Banned access
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Users Directory Table & Search Console */}
          <Panel
            flush
            title={`Accounts Directory (${count(totalUsersCount)} accounts)`}
            note={
              statusFilter !== 'ALL'
                ? `Filtered by ${statusFilter} status`
                : roleFilter !== 'ALL'
                ? `Filtered by ${roleFilter.toLowerCase()} role`
                : 'All registered platform accounts'
            }
            actions={
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email, phone, or ID..."
                    aria-label="Search users"
                    className="w-[260px] rounded-xl border border-[#E2E8F0] bg-white py-1.5 pr-8 pl-8 text-[12px] font-semibold text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-all"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B]"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Sort Option Dropdown */}
                <div className="flex items-center gap-1.5 text-[12px]">
                  <ArrowUpDown className="h-3.5 w-3.5 text-[#94A3B8]" />
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="rounded-xl border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Page Size Selector */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-2 py-1.5 text-[12px] font-bold text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#635BFF]"
                >
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            }
          >
            {/* Filter Tabs & Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] bg-[#FAFBFD] px-5 py-3 text-[12px]">
              {/* Role Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-[#64748B] uppercase mr-1">Role:</span>
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

              {/* Status & Affiliation Filter Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-[#64748B] uppercase mr-1">Status:</span>
                  <button
                    type="button"
                    onClick={() => selectStatus('verified')}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      statusFilter === 'verified'
                        ? 'bg-[#16A34A] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Verified
                  </button>
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

                <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[#E2E8F0]">
                  <span className="text-[11px] font-extrabold text-[#64748B] uppercase mr-1">Affiliation:</span>
                  <button
                    type="button"
                    onClick={() => setAffiliationFilter('ALL')}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      affiliationFilter === 'ALL'
                        ? 'bg-[#1E293B] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setAffiliationFilter('with_shop')}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      affiliationFilter === 'with_shop'
                        ? 'bg-[#0284C7] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    With Salon
                  </button>
                  <button
                    type="button"
                    onClick={() => setAffiliationFilter('independent')}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      affiliationFilter === 'independent'
                        ? 'bg-[#64748B] text-white shadow-2xs'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    Individual Barber
                  </button>
                </div>
              </div>
            </div>

            {/* Multi-Selection Banner */}
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#EEF2FF] px-5 py-2.5 text-[12px] border-b border-[#C7D2FE]">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#635BFF] text-white text-[10px] font-black">
                    {selectedIds.size}
                  </span>
                  <span className="font-extrabold text-[#4338CA]">
                    {selectedIds.size} account{selectedIds.size > 1 ? 's' : ''} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copySelectedEmails}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#4338CA] border border-[#C7D2FE] hover:bg-[#E0E7FF] transition-all cursor-pointer shadow-2xs"
                  >
                    <Mail className="h-3 w-3" /> Copy Emails
                  </button>
                  <button
                    type="button"
                    onClick={copySelectedIds}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#4338CA] border border-[#C7D2FE] hover:bg-[#E0E7FF] transition-all cursor-pointer shadow-2xs"
                  >
                    <Copy className="h-3 w-3" /> Copy IDs
                  </button>
                  <Link
                    href={`/notify?userIds=${Array.from(selectedIds).join(',')}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#635BFF] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#4F46E5] transition-all shadow-2xs"
                  >
                    <Sparkles className="h-3 w-3" /> Broadcast
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-lg p-1 text-[#64748B] hover:text-[#1E293B]"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Table Content States */}
            {usersApi.error ? (
              <div className="p-8">
                <Failed message={usersApi.error} onRetry={usersApi.refresh} />
              </div>
            ) : usersApi.loading && !rows.length ? (
              <div className="p-8">
                <Loading label="Querying platform accounts directory..." />
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center">
                <Empty
                  title="No accounts match current filters"
                  hint={
                    query
                      ? `No accounts found matching "${query}". Try adjusting keywords or clearing filters.`
                      : 'No users found matching current category, status, or affiliation criteria.'
                  }
                />
                {hasActiveFilters && (
                  <div className="mt-4">
                    <Button onClick={resetAllFilters} variant="outline">
                      Reset All Filters
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Scroll>
                <Table>
                  <thead>
                    <Tr className="border-b border-[#E2E8F0] bg-[#FAFBFD] text-[11px] font-extrabold uppercase text-[#64748B]">
                      <Th className="py-3 pl-4 w-10">
                        <input
                          type="checkbox"
                          checked={rows.length > 0 && selectedIds.size === rows.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          aria-label="Select all accounts"
                          className="h-4 w-4 rounded border-[#CBD5E1] text-[#635BFF] focus:ring-[#635BFF] cursor-pointer"
                        />
                      </Th>
                      <Th className="py-3">Account & Profile</Th>
                      <Th className="py-3">Role</Th>
                      <Th className="py-3">Salon Affiliation</Th>
                      <Th className="py-3">Verification & Health</Th>
                      <Th className="py-3 text-right">Registered</Th>
                      <Th className="py-3 text-right pr-4">Quick Governance</Th>
                    </Tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[13px]">
                    {rows.map((u) => {
                      const displayName = u.name || u.email.split('@')[0];
                      const affiliatedShop = u.tenantId ? shopNameMap.get(u.tenantId) : null;
                      const isCustomer = (u.role || '').toUpperCase() === 'CUSTOMER';
                      const isOwner = (u.role || '').toUpperCase() === 'OWNER';
                      const isBarber =
                        (u.role || '').toUpperCase() === 'BARBER' ||
                        (u.role || '').toUpperCase() === 'STAFF';

                      const profileLink = isCustomer
                        ? `/customers/${encodeURIComponent(u.id)}`
                        : isOwner
                        ? `/owners/${encodeURIComponent(u.id)}`
                        : isBarber
                        ? `/barbers/${encodeURIComponent(u.id)}`
                        : `/users/${encodeURIComponent(u.id)}`;

                      const isSelected = selectedIds.has(u.id);

                      return (
                        <Tr
                          key={u.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-[#EEF2FF]/40' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          {/* Row Selection Checkbox */}
                          <Td className="py-3 pl-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRow(u.id)}
                              aria-label={`Select ${displayName}`}
                              className="h-4 w-4 rounded border-[#CBD5E1] text-[#635BFF] focus:ring-[#635BFF] cursor-pointer"
                            />
                          </Td>

                          {/* Account & Profile */}
                          <Td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#F1F5F9] to-[#E2E8F0] text-[12px] font-black text-[#1E293B] border border-[#CBD5E1] shadow-2xs">
                                  {initials(u.name || u.email)}
                                </span>
                                <span
                                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${
                                    u.isBanned
                                      ? 'bg-[#EF4444]'
                                      : u.emailVerified
                                      ? 'bg-[#16A34A]'
                                      : 'bg-[#F59E0B]'
                                  }`}
                                  title={
                                    u.isBanned
                                      ? 'Suspended / Banned'
                                      : u.emailVerified
                                      ? 'Email Verified'
                                      : 'Pending Email Verification'
                                  }
                                />
                              </div>

                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setInspectUser(u)}
                                  className="text-left font-black text-[#1E293B] hover:text-[#635BFF] transition-colors truncate block max-w-[200px] cursor-pointer"
                                >
                                  {displayName}
                                </button>
                                <span className="block truncate text-[11px] text-[#64748B] max-w-[200px]">
                                  {u.email}
                                </span>
                                <span className="block font-mono text-[10px] text-[#94A3B8]">
                                  {shortId(u.id)}
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
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1E293B] hover:text-[#635BFF] hover:underline"
                              >
                                <Store className="h-3.5 w-3.5 text-[#0284C7] shrink-0" />
                                <span className="truncate max-w-[170px]">
                                  {affiliatedShop || shortId(u.tenantId)}
                                </span>
                                <ArrowUpRight className="h-3 w-3 text-[#94A3B8]" />
                              </Link>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#94A3B8]">
                                  {u.role === 'BARBER'
                                    ? 'Individual Barber'
                                    : u.role === 'OWNER'
                                    ? 'No salon yet'
                                    : 'Individual User'}
                                </span>
                            )}
                          </Td>

                          {/* Verification & Health Status */}
                          <Td className="py-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {u.isBanned ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-bold text-[#EF4444] border border-[#FECDD3]">
                                  <ShieldAlert className="h-3 w-3" />
                                  Suspended
                                </span>
                              ) : u.emailVerified ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-bold text-[#15803D] border border-[#BBF7D0]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-bold text-[#B45309] border border-[#FDE68A]">
                                  <Clock className="h-3 w-3" />
                                  Pending OTP
                                </span>
                              )}
                            </div>
                          </Td>

                          {/* Registered Date */}
                          <Td className="py-3 text-right tabular-nums text-[12px] text-[#64748B]">
                            <span title={date(u.createdAt)} className="font-medium">
                              {since(u.createdAt)}
                            </span>
                          </Td>

                          {/* Direct Actions */}
                          <Td className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick View Inspector Trigger */}
                              <button
                                type="button"
                                onClick={() => setInspectUser(u)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[11px] font-bold text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all cursor-pointer shadow-2xs"
                                title="Quick Inspect Drawer"
                              >
                                <Eye className="h-3 w-3 text-[#635BFF]" />
                                <span>Inspect</span>
                              </button>

                              {/* Profile Link */}
                              <Link
                                href={profileLink}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-[11px] font-bold text-[#635BFF] hover:bg-[#635BFF] hover:text-white hover:border-[#635BFF] transition-all shadow-2xs"
                                title="Open Full 360 Profile"
                              >
                                <span>{isCustomer ? '360' : isOwner ? 'Owner' : isBarber ? 'Stylist' : 'Profile'}</span>
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>

                              {/* Ban / Unban Direct Toggle */}
                              {u.role !== 'SUPER_ADMIN' && (
                                <>
                                  {u.isBanned ? (
                                    <button
                                      type="button"
                                      onClick={() => setUnbanTargetUser(u)}
                                      className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-1 text-[#16A34A] hover:bg-[#DCFCE7] transition-all cursor-pointer"
                                      title="Reactivate Account"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setBanTargetUser(u)}
                                      className="rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-1 text-[#E11D48] hover:bg-[#FFE4E6] transition-all cursor-pointer"
                                      title="Suspend Account"
                                    >
                                      <ShieldAlert className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </>
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

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between border-t border-[#F1F5F9] bg-[#FAFBFD] px-5 py-3.5 text-[12px] text-[#64748B]">
              <span className="font-medium">
                Page <b className="text-[#1E293B]">{page}</b> of <b className="text-[#1E293B]">{totalPages}</b> &middot; Showing{' '}
                <b className="text-[#1E293B]">{rows.length}</b> of <b className="text-[#1E293B]">{count(totalUsersCount)}</b> accounts
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || usersApi.loading}
                  variant="outline"
                  className="text-[12px] font-bold"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || usersApi.loading}
                  variant="outline"
                  className="text-[12px] font-bold"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </Canvas>

      {/* Slide-over Inspection Drawer */}
      <UserInspectionDrawer
        user={inspectUser}
        shopName={inspectUser?.tenantId ? shopNameMap.get(inspectUser.tenantId) : null}
        onClose={() => setInspectUser(null)}
        onBanClick={(u) => setBanTargetUser(u)}
        onUnbanClick={(u) => setUnbanTargetUser(u)}
      />

      {/* Ban Confirmation Modal */}
      <BanUserModal
        user={banTargetUser}
        isOpen={Boolean(banTargetUser)}
        onClose={() => setBanTargetUser(null)}
        onConfirmBan={handleConfirmBan}
      />

      {/* Unban Confirmation Modal */}
      <UnbanUserModal
        user={unbanTargetUser}
        isOpen={Boolean(unbanTargetUser)}
        onClose={() => setUnbanTargetUser(null)}
        onConfirmUnban={handleConfirmUnban}
      />
    </>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<Loading label="Loading users directory and account governance..." />}>
      <UsersPageInner />
    </Suspense>
  );
}
