'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { RotateCw, Undo2 } from 'lucide-react';
import type { Tenant } from '@/lib/api/tenants';
import { listTransactions, refundTransaction, type Transaction } from '@/lib/api/finance';
import { useTenantSweep } from '@/lib/useTenantSweep';
import { useMutation } from '@/lib/useApi';
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

/** Refunding a PAYOUT/TIP/COMMISSION/REFUND row makes no sense as a support action even though the
 *  backend's refund() technically accepts any type — PAYMENT is the only real "money owed back". */
const REFUNDABLE_TYPE = 'PAYMENT';

const SETTLED = ['COMPLETED', 'PAID', 'SUCCEEDED', 'CAPTURED'];

/**
 * The platform's takings, gathered per shop.
 *
 * Settled and unsettled are kept apart throughout rather than added together. `Transaction` rows
 * are written as PENDING on create and moved on afterwards, so a single "total" would count charges
 * that never completed — the difference between what the platform earned and what it merely
 * attempted to bill.
 */
export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refunding, setRefunding] = useState<{ row: Transaction; tenant: Tenant } | null>(null);

  const fetcher = useCallback((tenant: Tenant) => listTransactions(tenant.id), []);
  const { tenants, rows, loading, error, failedShops, reload } = useTenantSweep<Transaction>(fetcher);

  const ordered = useMemo(
    () =>
      [...rows].sort(
        (a, b) => new Date(b.row.createdAt).getTime() - new Date(a.row.createdAt).getTime(),
      ),
    [rows],
  );

  const stats = useMemo(() => {
    let settled = 0;
    let settledCount = 0;
    let pending = 0;
    let pendingCount = 0;
    const byShop = new Map<string, number>();

    for (const { row, tenant } of rows) {
      const amount = toNumber(row.amount);
      if (SETTLED.includes(String(row.status).toUpperCase())) {
        settled += amount;
        settledCount += 1;
        byShop.set(tenant.id, (byShop.get(tenant.id) ?? 0) + amount);
      } else {
        pending += amount;
        pendingCount += 1;
      }
    }
    return { settled, settledCount, pending, pendingCount, byShop };
  }, [rows]);

  const statuses = useMemo(
    () => ['ALL', ...Array.from(new Set(rows.map((r) => String(r.row.status).toUpperCase()))).sort()],
    [rows],
  );

  const visible = useMemo(
    () =>
      statusFilter === 'ALL'
        ? ordered
        : ordered.filter((r) => String(r.row.status).toUpperCase() === statusFilter),
    [ordered, statusFilter],
  );

  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="Payments"
        lede="Every transaction recorded against a shop, newest first. Settled and pending are counted separately."
        actions={
          <Button onClick={reload} disabled={loading}>
            <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <Canvas>
        {error && <Failed message={error} onRetry={reload} />}
        {loading && !error && <Loading label={`Reading ${tenants?.length ?? 0} shops`} />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat
                label="Settled"
                value={money(stats.settled)}
                tone="live"
                sub={`${count(stats.settledCount)} transactions`}
              />
              <Stat
                label="Not settled"
                value={money(stats.pending)}
                tone={stats.pending > 0 ? 'signal' : 'plain'}
                sub={`${count(stats.pendingCount)} transactions`}
              />
              <Stat label="Transactions" value={count(rows.length)} />
              <Stat
                label="Shops taking money"
                value={count(stats.byShop.size)}
                sub={`of ${count(tenants?.length ?? 0)} on the platform`}
              />
            </div>

            {failedShops > 0 && (
              <p className="rounded-lg border border-signal/25 bg-signal-soft px-4 py-2.5 text-[12px] text-signal">
                {count(failedShops)} shop{failedShops === 1 ? '' : 's'} did not answer, so these
                totals are short by whatever those hold.
              </p>
            )}

            {stats.byShop.size > 0 && tenants && (
              <Panel title="Settled revenue by shop">
                <Ranked
                  format={(v) => money(v)}
                  rows={Array.from(stats.byShop.entries())
                    .map(([id, value]) => {
                      const tenant = tenants.find((t) => t.id === id);
                      return {
                        key: id,
                        label: tenant?.name ?? id,
                        value,
                        color: brandColor(tenant?.brandColor),
                      };
                    })
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 8)}
                />
              </Panel>
            )}

            <Panel
              flush
              title={`${count(visible.length)} transaction${visible.length === 1 ? '' : 's'}`}
              actions={
                statuses.length > 2 ? (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by status"
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-manrope text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent transition-all shadow-xs"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s === 'ALL' ? 'All statuses' : s.toLowerCase()}
                      </option>
                    ))}
                  </select>
                ) : null
              }
            >
              {visible.length === 0 ? (
                <div className="p-4">
                  <Empty
                    title={
                      rows.length === 0 ? 'No transactions on the platform yet' : 'No transactions match'
                    }
                    hint={
                      rows.length === 0
                        ? 'Transactions are written when a booking is paid for. Until a shop takes a payment, there is nothing to show here.'
                        : 'Choose a different status.'
                    }
                  />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Recorded</Th>
                        <Th>Shop</Th>
                        <Th>Type</Th>
                        <Th>Status</Th>
                        <Th>Booking</Th>
                        <Th>Customer</Th>
                        <Th align="right">Amount</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.slice(0, 250).map(({ row, tenant }) => {
                        const status = String(row.status).toUpperCase();
                        const canRefund = row.type === REFUNDABLE_TYPE && status !== 'REFUNDED';
                        return (
                          <Tr key={row.id} accent={brandColor(tenant.brandColor)}>
                            <Td mono>{dateTime(row.createdAt)}</Td>
                            <Td nowrap={false}>
                              <Link
                                href={`/shops/${tenant.id}`}
                                className="flex items-center gap-2 hover:opacity-70"
                              >
                                <Mark
                                  name={tenant.name}
                                  logoUrl={tenant.logoUrl}
                                  color={tenant.brandColor}
                                  size={20}
                                />
                                <span className="truncate">{tenant.name}</span>
                              </Link>
                            </Td>
                            <Td muted>{row.type}</Td>
                            <Td>
                              {SETTLED.includes(status) ? (
                                <Badge tone="live">{status.toLowerCase()}</Badge>
                              ) : (
                                <Badge>{status.toLowerCase()}</Badge>
                              )}
                            </Td>
                            <Td nowrap={false} muted>
                              {row.serviceName ?? (row.appointmentId ? shortId(row.appointmentId) : '—')}
                              {row.staffName && <span className="block text-[11px] text-ink-3">with {row.staffName}</span>}
                            </Td>
                            <Td muted nowrap={false}>{row.customerName ?? '—'}</Td>
                            <Td align="right" mono>{money(row.amount)}</Td>
                            <Td align="right">
                              {canRefund && (
                                <button
                                  type="button"
                                  onClick={() => setRefunding({ row, tenant })}
                                  className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-2 hover:text-signal"
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
                    <p className="px-3 py-3 text-[12px] text-ink-2">
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
          tenant={refunding.tenant}
          onClose={() => setRefunding(null)}
          onRefunded={() => {
            setRefunding(null);
            reload();
          }}
        />
      )}
    </>
  );
}

/**
 * Refunding a transaction.
 *
 * Not typed-confirm like deleting a shop — this reverses one payment rather than orphaning
 * records across services, so a clear statement of what's being refunded is enough friction.
 */
function RefundDialog({
  row,
  tenant,
  onClose,
  onRefunded,
}: {
  row: Transaction;
  tenant: Tenant;
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
      <div className="space-y-4">
        <p className="max-w-[56ch] text-[13px] leading-relaxed">
          Refund <strong>{money(row.amount)}</strong> from <strong>{tenant.name}</strong>&apos;s
          books, recorded {dateTime(row.createdAt)}
          {row.serviceName && (
            <>
              {' '}for <strong>{row.serviceName}</strong>
            </>
          )}
          {row.customerName && (
            <>
              {' '}booked by <strong>{row.customerName}</strong>
            </>
          )}
          ? If this payment was funded from a customer wallet, the balance is credited back. This
          cannot be undone.
        </p>

        <FormError message={error} />

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={confirm} disabled={pending}>
            {pending ? 'Refunding' : 'Refund'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
