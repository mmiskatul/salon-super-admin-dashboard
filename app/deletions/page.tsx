'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  Trash2,
  X,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Store,
  Users,
  Calendar,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Filter,
  Search,
  HelpCircle,
  Scissors,
  User,
  Zap,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import {
  adminDeleteAccount,
  declineDeletion,
  getDeletions,
  purgeExpiredDeletions,
  type DeletionRequest,
} from '@/lib/api/control';
import { count, dateTime, date, since } from '@/lib/format';
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
import { Field, FormError, Modal, TextArea, TextInput } from '@/components/ui/Form';

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Customer',
  BARBER: 'Barber',
  OWNER: 'Shop Owner',
};

function getUserRole(r: DeletionRequest): string {
  return r.user?.role || r.owner?.role || (r.shop ? 'OWNER' : 'CUSTOMER');
}

type FilterSegment = 'all' | 'expiring_soon' | 'overdue' | 'owners' | 'barbers' | 'customers';

export default function DeletionsPage() {
  const data = useApi(getDeletions, [], 'deletions');
  const remove = useMutation(adminDeleteAccount);
  const decline = useMutation(declineDeletion);
  const purgeMutation = useMutation(purgeExpiredDeletions);

  const [approving, setApproving] = useState<DeletionRequest | null>(null);
  const [declining, setDeclining] = useState<DeletionRequest | null>(null);
  const [note, setNote] = useState('');
  const [reply, setReply] = useState('');
  const [role, setRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [segment, setSegment] = useState<FilterSegment>('all');
  const [done, setDone] = useState<string | null>(null);

  const d = data.data;

  async function approve() {
    if (!approving) return;
    const targetUser = approving.user ?? approving.owner;
    const targetName = targetUser.name ?? targetUser.email;

    const r = await remove.mutate(
      targetUser.id,
      note.trim() || `User requested account deletion. Reason: ${approving.reason || 'None specified'}`,
    );

    if (r) {
      setDone(
        `Account ${targetName} was deleted immediately${
          r.shopClosed ? `, shop "${r.shopClosed}" was closed, and ${r.bookingsCancelled} booking(s) were cancelled` : ''
        }.`,
      );
      setApproving(null);
      setNote('');
      await data.refresh();
    }
  }

  async function sendDecline() {
    if (!declining || !reply.trim()) return;
    const r = await decline.mutate(declining.ticketId, reply.trim());
    if (r) {
      setDone('The deletion request was declined and the account was kept active.');
      setDeclining(null);
      setReply('');
      await data.refresh();
    }
  }

  async function handleManualPurge() {
    try {
      const res = await purgeMutation.mutate();
      if (res && res.purgedCount > 0) {
        setDone(`Auto-purge complete: purged ${res.purgedCount} account(s) that exceeded the 14-day grace period.`);
      } else {
        setDone('Auto-purge check complete: no accounts are currently overdue past 14 days.');
      }
      await data.refresh();
    } catch {
      // Handled by useMutation
    }
  }

  const allRequests = d?.requests ?? [];
  const pendingRequests = useMemo(() => allRequests.filter((r) => r.status === 'PENDING'), [allRequests]);
  const historyRequests = useMemo(() => allRequests.filter((r) => r.status !== 'PENDING'), [allRequests]);
  const deletedAccounts = useMemo(() => {
    return (d?.deleted ?? []).filter((u) => !role || u.role === role);
  }, [d?.deleted, role]);

  // Filtered pending requests
  const filteredPending = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return pendingRequests.filter((r) => {
      const user = r.user ?? r.owner;
      const days = r.daysRemaining ?? 14;
      const isOverdue = r.isOverdue || days <= 0;

      const userRole = getUserRole(r);

      // Segment filter
      if (segment === 'expiring_soon' && (days > 3 || isOverdue)) return false;
      if (segment === 'overdue' && !isOverdue) return false;
      if (segment === 'owners' && userRole !== 'OWNER') return false;
      if (segment === 'barbers' && userRole !== 'BARBER') return false;
      if (segment === 'customers' && userRole !== 'CUSTOMER') return false;

      // Search query
      if (!q) return true;
      const name = user.name?.toLowerCase() || '';
      const email = user.email.toLowerCase();
      const phone = user.phone?.toLowerCase() || '';
      const shop = r.shop?.name.toLowerCase() || '';
      const reason = r.reason?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || phone.includes(q) || shop.includes(q) || reason.includes(q);
    });
  }, [pendingRequests, segment, searchQuery]);

  // Metrics
  const expiringSoonCount = useMemo(() => {
    return pendingRequests.filter((r) => (r.daysRemaining ?? 14) <= 3 && !r.isOverdue).length;
  }, [pendingRequests]);

  const overdueCount = useMemo(() => {
    return pendingRequests.filter((r) => r.isOverdue || (r.daysRemaining ?? 14) <= 0).length;
  }, [pendingRequests]);

  return (
    <>
      <PageHead
        eyebrow="Data Privacy & Account Lifecycle"
        title="Account Deletions"
        lede="Super-admin moderation of account deletion requests. Users submit their deletion request with their rationale and enter a 14-day automatic deletion grace period. Immediate admin approval deletes the account on the spot; unhandled requests automatically purge at 14 days."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleManualPurge}
              disabled={purgeMutation.pending || data.loading}
              title="Sweep and purge any requests older than 14 days"
            >
              <Zap size={14} className={purgeMutation.pending ? 'animate-pulse text-amber-500' : 'text-amber-500'} />
              <span>Sweep 14-Day Purge</span>
              {overdueCount > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {overdueCount}
                </span>
              )}
            </Button>
            <Button onClick={data.refresh} disabled={data.loading}>
              <RotateCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {done && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-manrope text-sm font-semibold text-emerald-800 shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{done}</span>
            </div>
            <button
              onClick={() => setDone(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !d ? (
          <Loading label="Loading account deletion requests & purge queue..." />
        ) : (
          <div className="space-y-6 font-manrope">
            {/* Top KPI Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Requests Waiting</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-extrabold tabular-nums ${
                      d.pending > 0 ? 'text-amber-600' : 'text-[#1E293B]'
                    }`}
                  >
                    {count(d.pending)}
                  </span>
                  {d.pending > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Pending admin or auto-purge</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Expiring Soon</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-extrabold tabular-nums ${
                      expiringSoonCount > 0 ? 'text-amber-600' : 'text-[#1E293B]'
                    }`}
                  >
                    {count(expiringSoonCount)}
                  </span>
                  <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-full">
                    ≤ 3 days
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Nearing 14-day cutoff</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Overdue For Purge</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-2xl font-extrabold tabular-nums ${
                      overdueCount > 0 ? 'text-rose-600' : 'text-[#1E293B]'
                    }`}
                  >
                    {count(overdueCount)}
                  </span>
                  {overdueCount > 0 && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full">
                      Auto-due
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Past 14 days without response</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Accounts Deleted</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums">{count(d.totals.deleted)}</span>
                  <span className="text-[10px] font-bold text-[#635BFF] bg-[#635BFF]/10 px-1.5 py-0.5 rounded-full">
                    All-time
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">{d.totals.deletedLast30Days} in last 30 days</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Shop Owners</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums">
                    {count(d.totals.byRole.find((r) => r.role === 'OWNER')?.count || 0)}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
                    Shops Closed
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Owner accounts wiped</span>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Customers & Solos</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-[#1E293B] tabular-nums">
                    {count(
                      (d.totals.byRole.find((r) => r.role === 'CUSTOMER')?.count || 0) +
                        (d.totals.byRole.find((r) => r.role === 'BARBER')?.count || 0),
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    Purged
                  </span>
                </div>
                <span className="text-[11px] text-[#94A3B8] mt-1">Personal data erased</span>
              </div>
            </div>

            {/* 14-Day Automated Deletion Policy Banner */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <Clock size={16} />
                </span>
                <div className="space-y-1 text-xs">
                  <h4 className="text-sm font-extrabold text-[#1E293B]">
                    14-Day Automated Deletion & Immediate Admin Purge Rules
                  </h4>
                  <p className="text-[#475569] leading-relaxed">
                    When someone confirms account deletion in the app or website, their verbatim{' '}
                    <strong>reason why they want to delete</strong> is captured and the request enters this queue with a{' '}
                    <strong>14-day grace window</strong>. If the user does not cancel and you do not decline, our
                    system sweeper <strong>automatically deletes the account permanently after 14 days</strong>.
                    Clicking <strong>&ldquo;Accept &amp; Delete Immediately&rdquo;</strong> bypasses the 14-day wait and
                    erases the account and closes any linked shop on the spot.
                  </p>
                </div>
              </div>
            </div>

            {/* Segment Filter Pills & Search Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Waiting', count: pendingRequests.length },
                  { id: 'expiring_soon', label: 'Expiring Soon (≤ 3d)', count: expiringSoonCount },
                  { id: 'overdue', label: 'Overdue (≥ 14d)', count: overdueCount },
                  {
                    id: 'owners',
                    label: 'Shop Owners',
                    count: pendingRequests.filter((r) => getUserRole(r) === 'OWNER').length,
                  },
                  {
                    id: 'barbers',
                    label: 'Barbers / Stylists',
                    count: pendingRequests.filter((r) => getUserRole(r) === 'BARBER').length,
                  },
                  {
                    id: 'customers',
                    label: 'Customers',
                    count: pendingRequests.filter((r) => getUserRole(r) === 'CUSTOMER').length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSegment(tab.id as FilterSegment)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      segment === tab.id
                        ? 'bg-[#1E293B] text-white shadow-xs'
                        : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-white hover:text-[#1E293B]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                        segment === tab.id ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#475569]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <label className="relative min-w-[240px]">
                <Search
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, reason, email, shop..."
                  aria-label="Search requests"
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-1.5 pr-3 pl-8 text-xs text-[#1E293B] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#1E293B]"
                  >
                    ✕
                  </button>
                )}
              </label>
            </div>

            {/* Waiting Requests Panel */}
            <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
              <div className="border-b border-[#F1F5F9] p-5 bg-[#F8FAFC]/50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#1E293B] flex items-center gap-2">
                    <span>Pending Deletion Queue</span>
                    <Badge tone={filteredPending.length > 0 ? 'warning' : 'live'}>
                      {count(filteredPending.length)} Request{filteredPending.length === 1 ? '' : 's'}
                    </Badge>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Users waiting for administrative review or awaiting the 14-day automated expiration
                  </p>
                </div>
              </div>

              {filteredPending.length === 0 ? (
                <div className="p-8">
                  <Empty
                    title={pendingRequests.length === 0 ? 'No deletion requests waiting' : 'No requests match filters'}
                    hint={
                      pendingRequests.length === 0
                        ? 'When a customer, stylist, or shop owner initiates account deletion, it will appear here.'
                        : 'Try adjusting your segment tab or clearing your search query.'
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9]">
                  {filteredPending.map((r) => {
                    const user = r.user ?? r.owner;
                    const days = r.daysRemaining ?? 14;
                    const isOverdue = r.isOverdue || days <= 0;
                    const percentElapsed = Math.min(100, Math.max(0, Math.round(((14 - days) / 14) * 100)));

                    return (
                      <div
                        key={r.ticketId}
                        className="p-5 transition-colors hover:bg-[#F8FAFC]/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        {/* Left Details: User Info, Reason, Impact */}
                        <div className="space-y-3 flex-1 min-w-0">
                          {/* User Name, Role, Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/users/${user.id}`}
                              className="text-base font-extrabold text-[#1E293B] hover:text-[#635BFF] transition-colors"
                            >
                              {user.name || user.email}
                            </Link>

                            <Badge tone="plain">{ROLE_LABEL[getUserRole(r)] ?? getUserRole(r)}</Badge>

                            {/* 14-Day Status Countdown Badge */}
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800">
                                <AlertTriangle size={12} className="text-rose-600" />
                                Overdue: Auto-Purge Ready
                              </span>
                            ) : days <= 3 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 animate-pulse">
                                <Clock size={12} className="text-amber-600" />
                                Auto-deletes in {days} day{days === 1 ? '' : 's'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-700">
                                <Clock size={12} className="text-blue-600" />
                                Auto-deletes in {days} days
                              </span>
                            )}

                            <span className="text-xs text-[#94A3B8]">Requested {since(r.requestedAt)}</span>
                          </div>

                          {/* Contact Info */}
                          <div className="flex flex-wrap items-center gap-x-4 text-xs text-[#64748B]">
                            <span>{user.email}</span>
                            {user.phone && <span>· Phone: {user.phone}</span>}
                            {r.expiresAt && (
                              <span>
                                · Scheduled auto-purge deadline:{' '}
                                <strong className="text-[#1E293B]">{date(r.expiresAt)}</strong>
                              </span>
                            )}
                          </div>

                          {/* REASON BOX: Why someone tried to delete */}
                          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs">
                            <div className="flex items-start gap-2">
                              <MessageSquare size={14} className="text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-900 block uppercase tracking-wider text-[10px]">
                                  Why they want to delete (Reason Given):
                                </span>
                                <p className="text-[#1E293B] font-medium mt-0.5 italic">
                                  &ldquo;{r.reason || 'No specific explanation provided by user.'}&rdquo;
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Connected Shop & Bookings Impact */}
                          {r.shop && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] bg-[#F1F5F9]/60 rounded-xl px-3 py-2 border border-[#E2E8F0]">
                              <Store size={14} className="text-[#64748B]" />
                              <span>
                                Connected Salon:{' '}
                                <Link
                                  href={`/shops/${r.shop.id}`}
                                  className="font-bold text-[#1E293B] hover:text-[#635BFF]"
                                >
                                  {r.shop.name}
                                </Link>
                              </span>
                              <span>· {r.upcomingBookings} upcoming booking(s) will be cancelled & refunded</span>
                              <span>· {r.teamMembers} barber(s) will be released</span>
                            </div>
                          )}

                          {/* 14-Day Progress Bar */}
                          <div className="space-y-1 pt-1 max-w-md">
                            <div className="flex items-center justify-between text-[10px] text-[#64748B] font-semibold">
                              <span>14-Day Grace Window</span>
                              <span>
                                {isOverdue ? '14 of 14 days passed (100%)' : `Day ${14 - days} of 14 (${percentElapsed}%)`}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOverdue ? 'bg-rose-500' : days <= 3 ? 'bg-amber-500' : 'bg-[#635BFF]'
                                }`}
                                style={{ width: `${percentElapsed}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-row lg:flex-col items-end gap-2 shrink-0">
                          <Button
                            variant="danger"
                            onClick={() => setApproving(r)}
                            title="Immediately delete the account without waiting for 14-day expiry"
                          >
                            <Trash2 size={13} className="mr-1" />
                            Accept &amp; Delete Immediately
                          </Button>

                          <div className="flex items-center gap-1.5">
                            <Button variant="outline" onClick={() => setDeclining(r)} title="Decline request & keep account active">
                              <X size={13} className="mr-1" />
                              Decline &amp; Keep
                            </Button>

                            <Link
                              href={`/users/${user.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-bold text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                            >
                              Inspect
                              <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Earlier / Processed Requests History */}
            {historyRequests.length > 0 && (
              <Panel
                title={`Processed Deletion Requests (${historyRequests.length})`}
                note="Archive of earlier deletion requests accepted by admin or auto-purged on the 14-day schedule"
              >
                <div className="divide-y divide-[#F1F5F9]">
                  {historyRequests.slice(0, 15).map((r) => {
                    const user = r.user ?? r.owner;
                    const isDone = r.status === 'DONE';

                    return (
                      <div
                        key={r.ticketId}
                        className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#1E293B]">{user.name || user.email}</span>
                            <Badge tone="plain">{ROLE_LABEL[getUserRole(r)] ?? getUserRole(r)}</Badge>
                            {r.shop && <span className="text-[#64748B]">· {r.shop.name}</span>}
                          </div>
                          {r.reason && (
                            <p className="text-[#64748B] italic max-w-xl truncate">
                              Reason: &ldquo;{r.reason}&rdquo;
                            </p>
                          )}
                          <span className="text-[#94A3B8] text-[11px]">Requested {dateTime(r.requestedAt)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isDone ? (
                            <Badge tone="live">Account Deleted &amp; Purged</Badge>
                          ) : (
                            <Badge tone="quiet">Declined / Account Kept</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* Deleted Accounts Archive Table */}
            <Panel
              title={`Permanently Deleted Accounts Archive (${deletedAccounts.length})`}
              note="All personal data has been erased. Booking and payment history remain anonymised as 'Deleted user' in compliance with accounting and platform terms."
              actions={
                <select
                  aria-label="Filter by Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#1E293B] cursor-pointer"
                >
                  <option value="">All Roles</option>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              }
              flush
            >
              {deletedAccounts.length === 0 ? (
                <div className="p-8">
                  <Empty title="No deleted accounts recorded" />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Account ID</Th>
                        <Th>Role</Th>
                        <Th>Purged By</Th>
                        <Th align="right">Deleted Date</Th>
                        <Th align="right">Joined Date</Th>
                        <Th>Audit Log &amp; Note</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedAccounts.slice(0, 100).map((u) => (
                        <Tr key={u.id}>
                          <Td mono>
                            <Link href={`/users/${u.id}`} className="hover:text-[#635BFF] font-semibold">
                              {u.id.slice(0, 8)}
                            </Link>
                          </Td>
                          <Td>
                            <Badge tone="plain">{ROLE_LABEL[u.role] ?? u.role}</Badge>
                          </Td>
                          <Td>
                            {u.by === 'admin' ? (
                              <Badge tone="primary">SalunBD Admin</Badge>
                            ) : (
                              <Badge tone="quiet">Self-Initiated / Purge</Badge>
                            )}
                          </Td>
                          <Td align="right" nowrap>
                            {dateTime(u.deletedAt)}
                          </Td>
                          <Td align="right" nowrap muted>
                            {dateTime(u.joinedAt)}
                          </Td>
                          <Td muted>
                            <span className="max-w-md truncate block">
                              {u.note ? u.note.replace(/^Account deleted by SalunBD:?\s*/, '') : '—'}
                            </span>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </Scroll>
              )}
            </Panel>
          </div>
        )}
      </Canvas>

      {/* Immediate Approve & Delete Confirmation Modal */}
      {approving && (
        <Modal
          title={`Confirm Immediate Deletion of ${
            approving.user?.name || approving.owner.name || approving.owner.email
          }?`}
          note="Accepting this request executes IMMEDIATE permanent deletion without waiting for the remainder of the 14-day grace period. This action cannot be undone."
          onClose={() => setApproving(null)}
        >
          <div className="space-y-4 font-manrope">
            {approving.reason && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
                <span className="font-bold text-amber-900 block uppercase tracking-wider text-[10px]">
                  User&apos;s Deletion Reason:
                </span>
                <p className="text-[#1E293B] italic mt-0.5">&ldquo;{approving.reason}&rdquo;</p>
              </div>
            )}

            {approving.shop && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 space-y-1">
                <span className="font-bold block uppercase tracking-wider text-[10px]">Connected Shop Impact:</span>
                <p>
                  • Salon <strong>{approving.shop.name}</strong> will be suspended and hidden from public search.
                </p>
                <p>
                  • <strong>{approving.upcomingBookings}</strong> upcoming booking(s) will be automatically cancelled
                  and refunded.
                </p>
                <p>
                  • <strong>{approving.teamMembers}</strong> team member(s) will be released from the shop roster.
                </p>
              </div>
            )}

            <Field label="Administrative Audit Note (optional)">
              <TextInput
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="e.g. Approved deletion request on owner confirmation"
              />
            </Field>

            <FormError message={remove.error} />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setApproving(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void approve()} disabled={remove.pending}>
                <Trash2 size={13} className="mr-1" />
                {remove.pending ? 'Deleting Permanently…' : 'Delete Account Immediately'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Decline Request Modal */}
      {declining && (
        <Modal
          title={`Decline Deletion Request for ${declining.user?.name || declining.owner.name || declining.owner.email}?`}
          note="The deletion request will be cancelled and the account will remain active. The user will receive your message via support ticket and notification."
          onClose={() => setDeclining(null)}
        >
          <div className="space-y-4 font-manrope">
            <Field label="Message to the user">
              <TextArea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="e.g. As discussed, we have kept your account active. Please let us know if you need any assistance."
              />
            </Field>

            <FormError message={decline.error} />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setDeclining(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void sendDecline()} disabled={decline.pending || !reply.trim()}>
                {decline.pending ? 'Sending…' : 'Decline Request & Keep Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
