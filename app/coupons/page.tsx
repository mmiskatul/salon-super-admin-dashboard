'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, RotateCw, Search, Tag } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { createCoupon, listCoupons } from '@/lib/api/coupons';
import { listTenants } from '@/lib/api/tenants';
import { count, date, money, shortId, since } from '@/lib/format';
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

export default function CouponsPage() {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const coupons = useApi(() => listCoupons(), []);
  const tenants = useApi(() => listTenants(), []);

  const allCoupons = coupons.data ?? [];
  const needle = query.trim().toLowerCase();
  const visible = allCoupons.filter((c) => {
    if (!needle) return true;
    return (
      c.code.toLowerCase().includes(needle) ||
      (c.title && c.title.toLowerCase().includes(needle)) ||
      c.tenantId.toLowerCase().includes(needle)
    );
  });

  const totalCoupons = allCoupons.length;
  const activeCoupons = allCoupons.filter((c) => {
    if (!c.active) return false;
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
    if (c.usageLimit != null && c.usageCount >= c.usageLimit) return false;
    return true;
  }).length;
  const totalRedemptions = allCoupons.reduce((sum, c) => sum + (c.usageCount ?? 0), 0);

  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="Coupons & promotions"
        lede="Platform-wide discount campaigns and shop offers. Inspect redemption counts, expiration dates, and issue new promotional codes."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreating(true)} variant="primary">
              <Plus size={12} />
              New coupon
            </Button>
            <Button onClick={coupons.refresh} disabled={coupons.loading}>
              <RotateCw size={12} className={coupons.loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {coupons.error && <Failed message={coupons.error} onRetry={coupons.refresh} />}
        {coupons.loading && !coupons.data && <Loading label="Loading promotional coupons" />}

        {coupons.data && !coupons.error && (
          <>
            <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-3">
              <Stat label="Total coupons" value={count(totalCoupons)} pending={coupons.loading} />
              <Stat
                label="Currently active"
                value={count(activeCoupons)}
                tone="live"
                sub="Available for customer bookings"
              />
              <Stat
                label="Total redemptions"
                value={count(totalRedemptions)}
                sub="Times discounts applied"
              />
            </div>

            <Panel
              flush
              title={`${count(visible.length)} promotion${visible.length === 1 ? '' : 's'}`}
              actions={
                <label className="relative">
                  <Search
                    size={13}
                    className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search code or shop..."
                    aria-label="Search coupons"
                    className="w-[180px] rounded-[3px] border border-rule bg-surface py-[5px] pr-2.5 pl-7 text-[12px] placeholder:text-ink-3 focus:border-ink focus:outline-none"
                  />
                </label>
              }
            >
              {visible.length === 0 ? (
                <div className="p-8">
                  <Empty
                    title="No coupons match"
                    hint={query ? 'Try clearing your search term.' : 'Click "New coupon" to create one.'}
                  />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Code</Th>
                        <Th>Shop</Th>
                        <Th align="right">Discount</Th>
                        <Th align="right">Usage count</Th>
                        <Th align="right">Min spend</Th>
                        <Th align="right">Expires</Th>
                        <Th align="right">State</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((c) => {
                        const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                        const isExhausted = c.usageLimit != null && c.usageCount >= c.usageLimit;
                        const isLive = c.active && !isExpired && !isExhausted;

                        return (
                          <Tr key={c.id}>
                            <Td>
                              <div className="flex items-center gap-2">
                                <Tag size={13} className="text-ink-3 shrink-0" />
                                <div>
                                  <span className="font-mono font-bold text-ink">{c.code}</span>
                                  {c.title && (
                                    <span className="block text-[11px] text-ink-2 truncate max-w-[200px]">
                                      {c.title}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Td>
                            <Td>
                              <Link
                                href={`/shops/${c.tenantId}`}
                                className="inline-flex items-center gap-1 font-mono text-[12px] text-ink hover:underline"
                              >
                                {shortId(c.tenantId)}
                                <ExternalLink size={10} className="text-ink-3" />
                              </Link>
                            </Td>
                            <Td align="right" mono>
                              {c.discountPercent != null
                                ? `${c.discountPercent}% OFF`
                                : c.discountAmount != null
                                ? money(c.discountAmount)
                                : '—'}
                            </Td>
                            <Td align="right" mono muted>
                              {c.usageCount}
                              {c.usageLimit != null ? ` / ${c.usageLimit}` : ' (unlimited)'}
                            </Td>
                            <Td align="right" mono muted>
                              {c.minOrderAmount != null ? money(c.minOrderAmount) : 'None'}
                            </Td>
                            <Td align="right" mono muted>
                              {c.expiresAt ? (
                                <span title={date(c.expiresAt)}>{since(c.expiresAt)}</span>
                              ) : (
                                'Never'
                              )}
                            </Td>
                            <Td align="right">
                              {isLive ? (
                                <Badge tone="live">Active</Badge>
                              ) : isExpired ? (
                                <Badge tone="signal">Expired</Badge>
                              ) : isExhausted ? (
                                <Badge tone="signal">Exhausted</Badge>
                              ) : (
                                <Badge tone="quiet">Disabled</Badge>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Scroll>
              )}
            </Panel>
          </>
        )}
      </Canvas>

      {creating && (
        <CreateCouponDialog
          tenants={tenants.data ?? []}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            void coupons.refresh();
          }}
        />
      )}
    </>
  );
}

function CreateCouponDialog({
  tenants,
  onClose,
  onCreated,
}: {
  tenants: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? '');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [usageLimit, setUsageLimit] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [title, setTitle] = useState('');

  const { mutate, pending, error } = useMutation(createCoupon);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantId || !code.trim()) return;

    const res = await mutate({
      tenantId,
      code: code.trim().toUpperCase(),
      discountPercent: discountType === 'percent' ? Number(discountValue) : undefined,
      discountAmount: discountType === 'amount' ? Number(discountValue) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      minOrderAmount: minOrder ? Number(minOrder) : undefined,
      title: title.trim() || undefined,
    });

    if (res) onCreated();
  }

  return (
    <Modal title="Create Promotional Coupon" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4 text-[13px]">
        <FormError message={error} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Shop assignment" hint="Coupon will apply to this salon's catalog">
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full rounded-[3px] border border-rule bg-surface p-2 text-[13px] focus:border-ink focus:outline-none"
              required
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({shortId(t.id)})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Coupon code" hint="e.g. WELCOME20, SUMMER50">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="DISCOUNT10"
              className="font-mono font-bold uppercase"
              required
            />
          </Field>

          <Field label="Discount type">
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`flex-1 rounded-[3px] border py-1.5 text-[12px] font-medium transition-colors ${
                  discountType === 'percent'
                    ? 'border-ink bg-ink text-white'
                    : 'border-rule bg-surface text-ink-2'
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('amount')}
                className={`flex-1 rounded-[3px] border py-1.5 text-[12px] font-medium transition-colors ${
                  discountType === 'amount'
                    ? 'border-ink bg-ink text-white'
                    : 'border-rule bg-surface text-ink-2'
                }`}
              >
                Fixed Amount (BDT)
              </button>
            </div>
          </Field>

          <Field label={discountType === 'percent' ? 'Discount percent (%)' : 'Discount amount (BDT)'}>
            <TextInput
              type="number"
              min={1}
              max={discountType === 'percent' ? 100 : 100000}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
            />
          </Field>

          <Field label="Usage limit" hint="Leave blank for unlimited redemptions">
            <TextInput
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="e.g. 100"
            />
          </Field>

          <Field label="Minimum spend (BDT)" hint="Optional minimum booking order value">
            <TextInput
              type="number"
              min={0}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="e.g. 500"
            />
          </Field>
        </div>

        <Field label="Campaign Title" hint="Optional short marketing headline">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Special Weekend Discount"
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={pending || !code.trim() || !tenantId}>
            {pending ? 'Creating...' : 'Create coupon'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
