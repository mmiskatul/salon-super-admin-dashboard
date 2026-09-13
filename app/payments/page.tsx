'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import type { Tenant } from '@/lib/api/tenants';
import { listTransactions, type Transaction } from '@/lib/api/finance';
import { useTenantSweep } from '@/lib/useTenantSweep';
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
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Ranked } from '@/components/chart/Chart';
import Mark from '@/components/ui/Mark';

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
            <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
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
              <p className="border border-signal/25 bg-signal-soft px-4 py-2.5 text-[12px] text-signal">
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
                    className="rounded-[3px] border border-rule bg-surface px-2 py-[6px] text-[12px] focus:border-ink focus:outline-none"
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
                        <Th align="right">Amount</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.slice(0, 250).map(({ row, tenant }) => (
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
                            {SETTLED.includes(String(row.status).toUpperCase()) ? (
                              <Badge tone="live">{String(row.status).toLowerCase()}</Badge>
                            ) : (
                              <Badge>{String(row.status).toLowerCase()}</Badge>
                            )}
                          </Td>
                          <Td mono muted>{shortId(row.appointmentId)}</Td>
                          <Td align="right" mono>{money(row.amount)}</Td>
                        </Tr>
                      ))}
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
    </>
  );
}
