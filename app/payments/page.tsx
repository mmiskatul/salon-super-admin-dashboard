'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  RotateCw,
  Undo2,
  Search,
  Building2,
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { listTenants, type Tenant } from '@/lib/api/tenants';
import { listTransactions, refundTransaction, type Transaction } from '@/lib/api/finance';
import { useApi, useMutation } from '@/lib/useApi';
import { brandColor, count, dateTime, money, shortId, toNumber } from '@/lib/format';
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
import { FormError, Modal } from '@/components/ui/Form';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Ranked } from '@/components/chart/Chart';
import Mark from '@/components/ui/Mark';

const REFUNDABLE_TYPE = 'PAYMENT';
const SETTLED_STATUSES = ['COMPLETED', 'PAID', 'SUCCEEDED', 'CAPTURED'];

export default function PaymentsPage() {
  // Filters
  const [shopFilter, setShopFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Refund modal state
  const [refunding, setRefunding] = useState<{ row: Transaction; tenantName: string; brandColor?: string } | null>(null);

  // Load tenants roster for shop filter dropdown & fallback lookup with TanStack caching
  const tenantsApi = useApi(() => listTenants(), [], 'tenants');
  const tenants = tenantsApi.data ?? [];

  // Primary fetch: directly query transactions from backend with TanStack caching
  const transactionsApi = useApi(
    async () => {
      try {
        return await listTransactions({
          tenantId: shopFilter !== 'ALL' ? shopFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
        });
      } catch (err) {
        if ((err as Error)?.message?.includes('tenantId is required') && tenants.length > 0) {
          const results = await Promise.allSettled(
            tenants.map((t) => listTransactions(t.id)),
          );
          const collected: Transaction[] = [];
          for (const res of results) {
            if (res.status === 'fulfilled') {
              collected.push(...res.value);
            }
          }
          return collected;
        }
        throw err;
      }
    },
    [shopFilter, statusFilter, typeFilter, tenants],
    'transactions',
  );

  const transactions = transactionsApi.data ?? [];
  const loading = transactionsApi.loading;
  const error = transactionsApi.error;
  const loadData = transactionsApi.refresh;

  const tenantMap = useMemo(() => {
    const map = new Map<string, Tenant>();
    for (const t of tenants) {
      map.set(t.id, t);
    }
    return map;
  }, [tenants]);

  // Sorted and searched transactions
  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...transactions]
      .filter((tx) => {
        if (!q) return true;
        const tenant = tx.tenantId ? tenantMap.get(tx.tenantId) : undefined;
        const tenantName = tx.tenantName || tenant?.name || '';
        const custName = tx.customerName || '';
        const custPhone = tx.customerPhone || '';
        const srvName = tx.serviceName || '';
        const stfName = tx.staffName || '';
        const txId = tx.id.toLowerCase();
        const apptId = tx.appointmentId?.toLowerCase() || '';

        return (
          custName.toLowerCase().includes(q) ||
          custPhone.toLowerCase().includes(q) ||
          srvName.toLowerCase().includes(q) ||
          stfName.toLowerCase().includes(q) ||
          tenantName.toLowerCase().includes(q) ||
          txId.includes(q) ||
          apptId.includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, searchQuery, tenantMap]);

  // High-level analytics
  const stats = useMemo(() => {
    let settled = 0;
    let settledCount = 0;
    let pending = 0;
    let pendingCount = 0;
    let refunded = 0;
    let refundedCount = 0;
    const byShop = new Map<string, number>();
    const soloNames = new Map<string, string>();

    for (const tx of transactions) {
      const amount = toNumber(tx.amount);
      const status = String(tx.status).toUpperCase();

      if (status === 'REFUNDED') {
        refunded += amount;
        refundedCount += 1;
      } else if (SETTLED_STATUSES.includes(status)) {
        settled += amount;
        settledCount += 1;
        // An independent barber's takings rank as their own "shop of one".
        const key = tx.tenantId ?? `barber:${tx.ownerUserId ?? 'unknown'}`;
        byShop.set(key, (byShop.get(key) ?? 0) + amount);
        if (!tx.tenantId && tx.tenantName) soloNames.set(key, tx.tenantName);
      } else {
        pending += amount;
        pendingCount += 1;
      }
    }
    return { settled, settledCount, pending, pendingCount, refunded, refundedCount, byShop, soloNames };
  }, [transactions]);

  // Available status types in current dataset
  const availableStatuses = useMemo(() => {
    const set = new Set(['ALL', 'COMPLETED', 'PENDING', 'REFUNDED']);
    for (const tx of transactions) {
      if (tx.status) set.add(tx.status.toUpperCase());
    }
    return Array.from(set);
  }, [transactions]);

  const availableTypes = useMemo(() => {
    const set = new Set(['ALL', 'PAYMENT', 'REFUND']);
    for (const tx of transactions) {
      if (tx.type) set.add(tx.type.toUpperCase());
    }
    return Array.from(set);
  }, [transactions]);

  return (
    <>
      <PageHead
        eyebrow="Finance & Activity"
        title="Payments"
        lede="Every transaction recorded across platform shops, newest first. Real-time settled volumes, refunds, and live booking payments."
        actions={
          <Button onClick={loadData} disabled={loading}>
            <RotateCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={loadData} />}
        {loading && !transactions.length && !error && <Loading label="Reading transactions from ledger..." />}

        {(transactions.length > 0 || (!loading && !error)) && (
          <>
            {/* Top KPI Statistics */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label="Settled Volume"
                value={money(stats.settled)}
                tone="live"
                sub={`${count(stats.settledCount)} completed transactions`}
              />
              <Stat
                label="Pending Volume"
                value={money(stats.pending)}
                tone={stats.pending > 0 ? 'signal' : 'plain'}
                sub={`${count(stats.pendingCount)} pending collection`}
              />
              <Stat
                label="Refunded"
                value={money(stats.refunded)}
                tone={stats.refunded > 0 ? 'signal' : 'plain'}
                sub={`${count(stats.refundedCount)} refunded`}
              />
              <Stat
                label="Shops Earning"
                value={count(stats.byShop.size)}
                sub={`of ${count(tenants.length || stats.byShop.size)} on the platform`}
              />
            </div>

            {/* Settled Revenue by Salon Chart */}
            {stats.byShop.size > 0 && (
              <Panel title="Settled revenue by shop">
                <Ranked
                  format={(v) => money(v)}
                  rows={Array.from(stats.byShop.entries())
                    .map(([id, value]) => {
                      const tenant = tenantMap.get(id);
                      return {
                        key: id,
                        label: tenant?.name ?? stats.soloNames.get(id) ?? (id.startsWith('barber:') ? 'Independent barber' : shortId(id)),
                        value,
                        color: brandColor(tenant?.brandColor),
                      };
                    })
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 8)}
                />
              </Panel>
            )}

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule-soft bg-surface-raised p-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[200px] max-w-[360px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input
                    type="text"
                    placeholder="Search customer, barber, salon, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-rule-soft bg-surface pl-9 pr-3 py-1.5 text-[13px] font-manrope text-ink-1 placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-ink-3 hover:text-ink-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Shop Filter */}
                <div className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-ink-3" />
                  <select
                    value={shopFilter}
                    onChange={(e) => setShopFilter(e.target.value)}
                    aria-label="Filter by shop"
                    className="rounded-lg border border-rule-soft bg-surface px-2.5 py-1.5 text-[12px] font-manrope text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-xs"
                  >
                    <option value="ALL">All Salons ({tenants.length})</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter size={13} className="text-ink-3" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by status"
                    className="rounded-lg border border-rule-soft bg-surface px-2.5 py-1.5 text-[12px] font-manrope text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-xs"
                  >
                    {availableStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s === 'ALL' ? 'All Statuses' : s.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  aria-label="Filter by type"
                  className="rounded-lg border border-rule-soft bg-surface px-2.5 py-1.5 text-[12px] font-manrope text-ink-1 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-xs"
                >
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t === 'ALL' ? 'All Types' : t.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[12px] text-ink-3 font-mono">
                {count(visible.length)} of {count(transactions.length)} results
              </div>
            </div>

            {/* Transactions Table Panel */}
            <Panel
              flush
              title={`${count(visible.length)} Transaction${visible.length === 1 ? '' : 's'}`}
            >
              {visible.length === 0 ? (
                <div className="p-8">
                  <Empty
                    title={
                      transactions.length === 0
                        ? 'No transactions on the platform yet'
                        : 'No transactions match filters'
                    }
                    hint={
                      transactions.length === 0
                        ? 'Transactions are automatically recorded when bookings are paid or completed. Until a booking is paid for, nothing appears here.'
                        : 'Try adjusting your search keywords or clearing your filters.'
                    }
                  />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Recorded</Th>
                        <Th>Salon</Th>
                        <Th>Method</Th>
                        <Th>Type</Th>
                        <Th>Status</Th>
                        <Th>Booking Details</Th>
                        <Th>Customer</Th>
                        <Th align="right">Amount</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.slice(0, 250).map((row) => {
                        const tenant = row.tenantId ? tenantMap.get(row.tenantId) : undefined;
                        const tenantName = row.tenantName || tenant?.name || (row.tenantId ? 'Salon' : 'Independent barber');
                        // A shop's payment opens the shop; an independent barber's opens the barber.
                        const ownerHref = row.tenantId ? `/shops/${row.tenantId}` : row.ownerUserId ? `/barbers/${row.ownerUserId}` : null;
                        const tenantColor = row.tenantBrandColor || tenant?.brandColor;
                        const tenantLogo = row.tenantLogoUrl || tenant?.logoUrl;
                        const status = String(row.status).toUpperCase();
                        // Only money actually taken: an unpaid or cancelled payment has nothing to give back.
                        const canRefund = row.type === REFUNDABLE_TYPE && (status === 'COMPLETED' || status === 'PAID');
                        const method = (row.paymentMethod || 'CASH').toUpperCase();

                        return (
                          <Tr key={row.id} accent={brandColor(tenantColor)}>
                            <Td mono>
                              <span className="font-medium text-ink-1">{dateTime(row.createdAt)}</span>
                              <span className="block text-[10px] text-ink-3 font-mono">ID: {shortId(row.id)}</span>
                            </Td>

                            <Td nowrap={false}>
                              {ownerHref ? (
                                <Link href={ownerHref} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                  <Mark name={tenantName} logoUrl={tenantLogo} color={tenantColor} size={22} />
                                  <span className="truncate font-medium text-ink-1">{tenantName}</span>
                                </Link>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <Mark name={tenantName} logoUrl={tenantLogo} color={tenantColor} size={22} />
                                  <span className="truncate font-medium text-ink-1">{tenantName}</span>
                                </span>
                              )}
                            </Td>

                            <Td>
                              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium bg-surface border border-rule-soft text-ink-2">
                                {method === 'WALLET' ? (
                                  <Wallet size={12} className="text-amber-500" />
                                ) : method === 'CARD' || method === 'ONLINE' ? (
                                  <CreditCard size={12} className="text-blue-500" />
                                ) : (
                                  <Banknote size={12} className="text-emerald-500" />
                                )}
                                {method}
                              </span>
                            </Td>

                            <Td muted>
                              <span className="text-[12px] font-mono">{row.type}</span>
                            </Td>

                            <Td>
                              {SETTLED_STATUSES.includes(status) ? (
                                <Badge tone="live">
                                  <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 size={11} />
                                    {status.toLowerCase()}
                                  </span>
                                </Badge>
                              ) : status === 'REFUNDED' ? (
                                <Badge tone="plain">
                                  <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                    <RefreshCw size={11} />
                                    refunded
                                  </span>
                                </Badge>
                              ) : status === 'CANCELLED' || status === 'FAILED' ? (
                                <Badge tone="signal">
                                  <span className="inline-flex items-center gap-1">
                                    <XCircle size={11} />
                                    {status.toLowerCase()}
                                  </span>
                                </Badge>
                              ) : (
                                <Badge tone="plain">
                                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                    <Clock size={11} />
                                    {status.toLowerCase()}
                                  </span>
                                </Badge>
                              )}
                            </Td>

                            <Td nowrap={false} muted>
                              <div className="max-w-[200px]">
                                <span className="font-medium text-ink-1 block truncate">
                                  {row.serviceName ?? (row.appointmentId ? `Booking ${shortId(row.appointmentId)}` : 'Direct Charge')}
                                </span>
                                {row.staffName && (
                                  <span className="block text-[11px] text-ink-3 truncate">
                                    Barber: {row.staffName}
                                  </span>
                                )}
                              </div>
                            </Td>

                            <Td muted nowrap={false}>
                              <div>
                                <span className="font-medium text-ink-1 block">{row.customerName || 'Walk-in Guest'}</span>
                                {row.customerPhone && (
                                  <span className="block text-[11px] text-ink-3 font-mono">{row.customerPhone}</span>
                                )}
                              </div>
                            </Td>

                            <Td align="right" mono>
                              <span className={`font-semibold ${status === 'REFUNDED' ? 'line-through text-ink-3' : 'text-ink-1'}`}>
                                {money(row.amount)}
                              </span>
                            </Td>

                            <Td align="right">
                              {canRefund && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRefunding({
                                      row,
                                      tenantName,
                                      brandColor: tenantColor ?? undefined,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium text-ink-2 hover:text-signal hover:bg-signal-soft/40 transition-colors"
                                >
                                  <Undo2 size={12} />
                                  Refund
                                </button>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  {visible.length > 250 && (
                    <p className="px-4 py-3 text-[12px] text-ink-2 bg-surface-raised border-t border-rule-soft">
                      Showing the 250 most recent of {count(visible.length)}.
                    </p>
                  )}
                </Scroll>
              )}
            </Panel>
          </>
        )}
      </Canvas>

      {refunding && (
        <RefundDialog
          row={refunding.row}
          tenantName={refunding.tenantName}
          onClose={() => setRefunding(null)}
          onRefunded={() => {
            setRefunding(null);
            loadData();
          }}
        />
      )}
    </>
  );
}

/**
 * Refunding a transaction.
 */
function RefundDialog({
  row,
  tenantName,
  onClose,
  onRefunded,
}: {
  row: Transaction;
  tenantName: string;
  onClose: () => void;
  onRefunded: () => void;
}) {
  const { mutate, pending, error } = useMutation(refundTransaction);

  async function confirm() {
    const result = await mutate(row.id);
    if (result !== null) onRefunded();
  }

  return (
    <Modal title="Refund transaction" onClose={onClose}>
      <div className="space-y-4 font-manrope">
        <p className="max-w-[56ch] text-[13px] leading-relaxed text-ink-2">
          Refund <strong className="text-ink-1 font-semibold">{money(row.amount)}</strong> from{' '}
          <strong className="text-ink-1 font-semibold">{tenantName}</strong>&apos;s ledger, recorded{' '}
          {dateTime(row.createdAt)}
          {row.serviceName && (
            <>
              {' '}for <strong className="text-ink-1">{row.serviceName}</strong>
            </>
          )}
          {row.customerName && (
            <>
              {' '}booked by <strong className="text-ink-1">{row.customerName}</strong>
            </>
          )}
          ? If this payment was funded from a customer wallet, the balance is credited back. This cannot be undone.
        </p>

        <FormError message={error} />

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} disabled={pending}>
            {pending ? 'Refunding...' : 'Confirm Refund'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
