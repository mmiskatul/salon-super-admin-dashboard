'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RotateCw,
  Search,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Scissors,
  Eye,
  Copy,
  Check,
  Store,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { listOwnerDashboards, type OwnerDashboardSummary } from '@/lib/api/owners';
import { suspendTenant, unsuspendTenant } from '@/lib/api/tenants';
import { banUser, unbanUser } from '@/lib/api/users';
import { brandColor, count, date, money, shortId, since } from '@/lib/format';
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
import Mark from '@/components/ui/Mark';

type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';
type SortKey = 'revenue' | 'barbers' | 'clients' | 'bookings' | 'newest' | 'name';

export default function OwnerDashboardsPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals state
  const [suspendingTarget, setSuspendingTarget] = useState<OwnerDashboardSummary | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [banningTarget, setBanningTarget] = useState<OwnerDashboardSummary | null>(null);
  const [banReason, setBanReason] = useState('');

  const suspend = useMutation(suspendTenant);
  const unsuspend = useMutation(unsuspendTenant);
  const ban = useMutation(banUser);
  const unban = useMutation(unbanUser);

  const { data: dashboards, loading, error, refresh } = useApi(() => listOwnerDashboards(), []);

  function copyText(txt: string) {
    navigator.clipboard.writeText(txt);
    setCopiedCode(txt);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const rows = dashboards ?? [];

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

  // Filtering and sorting
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows
      .filter((d) => {
        if (statusFilter === 'ACTIVE' && (d.isSuspended || d.isBanned)) return false;
        if (statusFilter === 'SUSPENDED' && !d.isSuspended) return false;
        if (statusFilter === 'BANNED' && !d.isBanned) return false;

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
  }, [rows, query, statusFilter, sortKey]);

  return (
    <>
      <PageHead
        eyebrow="Platform Management"
        title="Owner Dashboards"
        lede="Oversee and control all salon owner dashboards. Inspect how many barbers and clients are connected, track real-time bookings and turnover, and administer shop operational permissions."
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
          <>
            {/* Top Stat Counters */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              <Stat label="Owner Dashboards" value={count(totals.totalDashboards)} tone="plain" />
              <Stat label="Active Salons" value={count(totals.activeCount)} tone="live" />
              <Stat label="Suspended" value={count(totals.suspendedCount)} tone={totals.suspendedCount > 0 ? 'signal' : 'plain'} />
              <Stat label="Connected Barbers" value={count(totals.totalBarbers)} tone="plain" />
              <Stat label="Connected Clients" value={count(totals.totalClients)} tone="plain" />
              <Stat label="Total Bookings" value={count(totals.totalBookings)} tone="plain" />
              <Stat label="Platform Revenue" value={money(totals.totalRevenue)} tone="live" />
            </div>

            {/* Filter and Control Bar */}
            <Panel flush>
              <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between bg-[#F8FAFC]/50 font-manrope">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search by owner, salon name, or join code..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-2 text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all"
                    />
                  </div>

                  {/* Status Filter buttons */}
                  <div className="flex items-center gap-1.5">
                    {(['ALL', 'ACTIVE', 'SUSPENDED', 'BANNED'] as StatusFilter[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`rounded-full px-3 py-1 text-[12px] font-manrope transition-all cursor-pointer ${
                          statusFilter === st
                            ? 'bg-[#635BFF] text-white shadow-sm shadow-[#635BFF]/20 font-bold'
                            : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] font-semibold'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 text-[12px] text-[#64748B] font-semibold font-manrope">
                  <span>Sort by:</span>
                  <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-[#1E293B] font-manrope focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-all"
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

              {/* Data Table */}
              <Scroll>
                <Table>
                  <thead>
                    <Tr>
                      <Th>Salon Owner</Th>
                      <Th>Salon</Th>
                      <Th>Connected Network</Th>
                      <Th>Total Revenue</Th>
                      <Th>Join Code</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Dashboard Controls</Th>
                    </Tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const color = brandColor(row.brandColor);
                      const isOwnerBanned = row.isBanned;
                      const isShopSuspended = row.isSuspended;

                      return (
                        <Tr key={`${row.ownerId}-${row.tenantId}`} className="hover:bg-ground/50 transition-colors">
                          {/* Owner Identity */}
                          <Td>
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-sm"
                                style={{ backgroundColor: color }}
                              >
                                {row.ownerName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/owners/${row.tenantId || row.ownerId}`}
                                  className="font-medium text-[13px] text-ink hover:text-primary transition-colors block truncate"
                                >
                                  {row.ownerName}
                                </Link>
                                <div className="flex items-center gap-1.5 text-[11px] text-ink-2">
                                  <span>{row.ownerEmail}</span>
                                  {isOwnerBanned && (
                                    <span className="rounded bg-signal-soft px-1 text-[9px] font-bold text-signal">
                                      BANNED
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-ink-3">
                                  Registered {since(row.ownerCreatedAt)}
                                </div>
                              </div>
                            </div>
                          </Td>

                          {/* Salon / Tenant */}
                          <Td>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="inline-block h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <Link
                                  href={`/shops/${row.tenantId}`}
                                  className="font-medium text-[13px] text-ink hover:underline truncate max-w-[180px]"
                                >
                                  {row.tenantName}
                                </Link>
                              </div>
                              <div className="text-[10px] text-ink-2 mt-0.5">
                                {row.businessType}
                              </div>
                            </div>
                          </Td>

                          {/* Connected Metrics */}
                          <Td>
                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                              <span
                                className="inline-flex items-center gap-1 rounded bg-ground px-2 py-0.5 text-[11px] font-medium text-ink border border-rule-soft"
                                title="Connected Barbers"
                              >
                                <Scissors size={11} className="text-primary" />
                                <strong>{row.barbersCount}</strong> barbers
                              </span>

                              <span
                                className="inline-flex items-center gap-1 rounded bg-ground px-2 py-0.5 text-[11px] font-medium text-ink border border-rule-soft"
                                title="Connected Clients"
                              >
                                <Users size={11} className="text-live" />
                                <strong>{row.clientsCount}</strong> clients
                              </span>

                              <span
                                className="inline-flex items-center gap-1 rounded bg-ground px-2 py-0.5 text-[11px] font-medium text-ink border border-rule-soft"
                                title="Catalog Services"
                              >
                                <strong>{row.servicesCount}</strong> services
                              </span>

                              <span
                                className="inline-flex items-center gap-1 rounded bg-ground px-2 py-0.5 text-[11px] font-medium text-ink border border-rule-soft"
                                title="Total Appointments"
                              >
                                <Calendar size={11} className="text-ink-2" />
                                <strong>{row.appointmentsCount}</strong> bookings
                              </span>
                            </div>
                          </Td>

                          {/* Revenue */}
                          <Td>
                            <div className="tabular font-semibold text-[13px] text-ink">
                              {money(row.revenueTotal)}
                            </div>
                            <div className="text-[10px] text-ink-3">settled total</div>
                          </Td>

                          {/* Join Code */}
                          <Td>
                            {row.joinCode ? (
                              <button
                                onClick={() => copyText(row.joinCode!)}
                                className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold text-ink bg-ground hover:bg-surface border border-rule px-2 py-0.5 rounded transition-colors"
                                title="Click to copy join code"
                              >
                                {row.joinCode}
                                {copiedCode === row.joinCode ? (
                                  <Check size={11} className="text-live" />
                                ) : (
                                  <Copy size={11} className="text-ink-3" />
                                )}
                              </button>
                            ) : (
                              <span className="text-[11px] text-ink-3 italic">None</span>
                            )}
                          </Td>

                          {/* Operational Status */}
                          <Td>
                            {isShopSuspended ? (
                              <Badge tone="signal">SUSPENDED</Badge>
                            ) : isOwnerBanned ? (
                              <Badge tone="signal">OWNER BANNED</Badge>
                            ) : (
                              <Badge tone="live">ACTIVE</Badge>
                            )}
                          </Td>

                          {/* Dashboard Actions */}
                          <Td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Owner Dashboard Detail */}
                              <Link
                                href={`/owners/${row.tenantId || row.ownerId}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                title="Open Owner Dashboard Inspection"
                              >
                                <Eye size={12} />
                                View Details
                              </Link>

                              {/* Suspend / Unsuspend Shop */}
                              {isShopSuspended ? (
                                <button
                                  onClick={async () => {
                                    await unsuspend.mutate(row.tenantId);
                                    refresh();
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-rule bg-surface text-live hover:bg-live-soft transition-colors"
                                  title="Unsuspend shop"
                                >
                                  <Unlock size={11} />
                                  Unsuspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSuspendingTarget(row);
                                    setSuspendReason('');
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-rule bg-surface text-ink-2 hover:text-signal hover:bg-signal-soft transition-colors"
                                  title="Suspend shop"
                                >
                                  <Lock size={11} />
                                  Suspend
                                </button>
                              )}

                              {/* Ban / Unban Owner Account */}
                              {isOwnerBanned ? (
                                <button
                                  onClick={async () => {
                                    await unban.mutate(row.ownerId);
                                    refresh();
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-rule bg-surface text-live hover:bg-live-soft transition-colors"
                                  title="Unban owner account"
                                >
                                  <ShieldCheck size={11} />
                                  Unban
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setBanningTarget(row);
                                    setBanReason('');
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-rule bg-surface text-ink-2 hover:text-signal hover:bg-signal-soft transition-colors"
                                  title="Ban owner account"
                                >
                                  <ShieldAlert size={11} />
                                  Ban
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

              {filteredRows.length === 0 && (
                <Empty
                  title="No owner dashboards match your filter"
                  hint="Try adjusting your search keywords or resetting status filters."
                />
              )}
            </Panel>
          </>
        )}

        {/* Suspend Shop Modal */}
        {suspendingTarget && (
          <Modal
            title={`Suspend ${suspendingTarget.tenantName}`}
            onClose={() => setSuspendingTarget(null)}
          >
            <div className="space-y-4">
              <p className="text-[13px] text-ink-2 leading-relaxed">
                Suspending this shop freezes all customer bookings platform-wide. Existing data and roster
                remain intact, but customers will no longer be able to checkout.
              </p>

              <Field label="Suspension Reason (Optional)">
                <TextInput
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g., Non-payment, violation of terms, owner requested freeze"
                />
              </Field>

              {suspend.error && <FormError message={suspend.error} />}

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setSuspendingTarget(null)}>Cancel</Button>
                <Button
                  variant="danger"
                  disabled={suspend.pending}
                  onClick={async () => {
                    await suspend.mutate(suspendingTarget.tenantId, suspendReason.trim() || undefined);
                    setSuspendingTarget(null);
                    refresh();
                  }}
                >
                  {suspend.pending ? 'Suspending...' : 'Confirm Suspension'}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Ban Owner Modal */}
        {banningTarget && (
          <Modal
            title={`Ban Owner: ${banningTarget.ownerName}`}
            onClose={() => setBanningTarget(null)}
          >
            <div className="space-y-4">
              <p className="text-[13px] text-ink-2 leading-relaxed">
                Banning this owner disables login access across the entire platform. Their linked shops,
                barbers, and bookings will remain in the database for auditing.
              </p>

              <Field label="Ban Reason (Required)">
                <TextInput
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g., Fraudulent activity, chargeback abuse"
                />
              </Field>

              {ban.error && <FormError message={ban.error} />}

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setBanningTarget(null)}>Cancel</Button>
                <Button
                  variant="danger"
                  disabled={ban.pending || !banReason.trim()}
                  onClick={async () => {
                    await ban.mutate(banningTarget.ownerId, banReason.trim());
                    setBanningTarget(null);
                    refresh();
                  }}
                >
                  {ban.pending ? 'Banning...' : 'Confirm Ban'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </Canvas>
    </>
  );
}
