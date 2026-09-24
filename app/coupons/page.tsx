'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Plus, RotateCw, Search, Tag, Trash2 } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from '@/lib/api/coupons';
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
import { Field, FormError, Modal, Select, TextInput } from '@/components/ui/Form';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function CouponsPage() {
  const [query, setQuery] = useState('');
  const [filterShop, setFilterShop] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    type: 'delete' | 'toggle';
    couponId: string;
    code: string;
    active?: boolean;
    pending: boolean;
    error: string | null;
  }>({
    open: false,
    type: 'delete',
    couponId: '',
    code: '',
    pending: false,
    error: null,
  });

  const coupons = useApi(() => listCoupons(), []);
  const tenants = useApi(() => listTenants(), []);

  const tenantsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tenants.data ?? []) {
      map.set(t.id, t.name);
    }
    return map;
  }, [tenants.data]);

  const allCoupons = coupons.data ?? [];
  const needle = query.trim().toLowerCase();
  const filtered = allCoupons.filter((c) => {
    if (filterShop !== 'ALL' && c.tenantId !== filterShop) return false;
    if (!needle) return true;
    const shopName = (c.shopName || (c.tenantId && tenantsMap.get(c.tenantId)) || '').toLowerCase();
    return (
      c.code.toLowerCase().includes(needle) ||
      (c.title && c.title.toLowerCase().includes(needle)) ||
      (c.tenantId ?? c.ownerUserId ?? '').toLowerCase().includes(needle) ||
      shopName.includes(needle)
    );
  });
  const visible = filtered;

  const totalCoupons = allCoupons.length;
  const activeCoupons = allCoupons.filter((c) => {
    if (!c.active) return false;
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
    if (c.usageLimit != null && c.usageCount >= c.usageLimit) return false;
    return true;
  }).length;
  const totalRedemptions = allCoupons.reduce((sum, c) => sum + (c.usageCount ?? 0), 0);

  function promptDelete(couponId: string, code: string) {
    setConfirmAction({
      open: true,
      type: 'delete',
      couponId,
      code,
      pending: false,
      error: null,
    });
  }

  function promptToggle(couponId: string, code: string, currentActive: boolean) {
    setConfirmAction({
      open: true,
      type: 'toggle',
      couponId,
      code,
      active: currentActive,
      pending: false,
      error: null,
    });
  }

  async function handleConfirmedAction() {
    const { type, couponId, active } = confirmAction;
    if (!couponId) return;
    setConfirmAction((prev) => ({ ...prev, pending: true, error: null }));
    try {
      if (type === 'delete') {
        await deleteCoupon(couponId);
      } else {
        await updateCoupon(couponId, { active: !active });
      }
      await coupons.refresh();
      setConfirmAction((prev) => ({ ...prev, open: false, pending: false }));
    } catch (err: any) {
      setConfirmAction((prev) => ({
        ...prev,
        pending: false,
        error: err?.message || 'Operation failed. Please try again.',
      }));
    }
  }

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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                    className="w-[200px] rounded-lg border border-[#E2E8F0] bg-white py-1.5 pr-3 pl-8 text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all shadow-xs"
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
                        <Th>Shop / Salon</Th>
                        <Th align="right">Discount</Th>
                        <Th align="right">Usage count</Th>
                        <Th align="right">Min spend</Th>
                        <Th align="right">Expires</Th>
                        <Th align="right">State</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((c) => {
                        const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                        const isExhausted = c.usageLimit != null && c.usageCount >= c.usageLimit;
                        const isLive = c.active && !isExpired && !isExhausted;
                        // An independent barber's coupon has no shop; it belongs to the barber.
                        const ownerId = c.tenantId ?? c.ownerUserId ?? null;
                        const shopName =
                          c.shopName || (c.tenantId && tenantsMap.get(c.tenantId)) || (c.tenantId ? c.tenantId : 'Independent barber');
                        const ownerHref = c.tenantId ? `/shops/${c.tenantId}` : c.ownerUserId ? `/barbers/${c.ownerUserId}` : null;
                        const isBusy = busyId === c.id;

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
                              <div className="flex flex-col gap-0.5">
                                {ownerHref ? (
                                  <Link
                                    href={ownerHref}
                                    className="inline-flex items-center gap-1 font-medium text-[12px] text-ink hover:text-accent"
                                  >
                                    <span>{shopName}</span>
                                    <ExternalLink size={10} className="text-ink-3" />
                                  </Link>
                                ) : (
                                  <span className="font-medium text-[12px] text-ink">{shopName}</span>
                                )}
                                <span className="font-mono text-[10px] text-ink-3">
                                  {c.tenantId ? shortId(ownerId) : `Barber · ${shortId(ownerId)}`}
                                </span>
                              </div>
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
                            <Td align="right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  onClick={() => promptToggle(c.id, c.code, c.active)}
                                  disabled={confirmAction.pending && confirmAction.couponId === c.id}
                                  className={c.active ? 'text-[#EF4444] hover:bg-[#FEE2E2]' : 'text-[#10B981] hover:bg-[#D1FAE5]'}
                                >
                                  {c.active ? 'Disable' : 'Enable'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => promptDelete(c.id, c.code)}
                                  disabled={confirmAction.pending && confirmAction.couponId === c.id}
                                  className="text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEE2E2]"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
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

      <ConfirmDialog
        open={confirmAction.open}
        title={
          confirmAction.type === 'delete'
            ? 'Delete promotional coupon'
            : confirmAction.active
            ? 'Disable promotional coupon'
            : 'Enable promotional coupon'
        }
        description={
          confirmAction.type === 'delete' ? (
            <p>
              Are you sure you want to permanently delete coupon code{' '}
              <strong className="text-[#1E293B] font-bold">&ldquo;{confirmAction.code}&rdquo;</strong>? This
              action cannot be undone and customers will no longer be able to apply it.
            </p>
          ) : confirmAction.active ? (
            <p>
              Disable coupon <strong className="text-[#1E293B] font-bold">&ldquo;{confirmAction.code}&rdquo;</strong>? Customers
              will not be able to apply it until it is enabled again.
            </p>
          ) : (
            <p>
              Enable coupon <strong className="text-[#1E293B] font-bold">&ldquo;{confirmAction.code}&rdquo;</strong>? It will
              immediately become active for customer checkouts and appointments.
            </p>
          )
        }
        confirmLabel={
          confirmAction.type === 'delete'
            ? 'Confirm Delete'
            : confirmAction.active
            ? 'Confirm Disable'
            : 'Confirm Enable'
        }
        variant={confirmAction.type === 'delete' || confirmAction.active ? 'danger' : 'primary'}
        pending={confirmAction.pending}
        error={confirmAction.error}
        onConfirm={handleConfirmedAction}
        onClose={() => {
          if (!confirmAction.pending) {
            setConfirmAction((prev) => ({ ...prev, open: false, error: null }));
          }
        }}
      />
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
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, pending, error } = useMutation(createCoupon);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    if (!tenantId) {
      setValidationError('Please select a salon storefront.');
      return;
    }

    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      setValidationError('Please enter a valid discount value greater than 0.');
      return;
    }

    await mutate({
      tenantId,
      code: code.trim().toUpperCase(),
      discountPercent: discountType === 'percent' ? val : undefined,
      discountAmount: discountType === 'amount' ? val : undefined,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
      minOrderAmount: minOrder ? parseFloat(minOrder) : undefined,
      title: title.trim() || undefined,
    });

    onCreated();
  }

  return (
    <Modal title="Create Promotional Coupon" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {(validationError || error) && <FormError message={validationError || error} />}

        <Field label="Shop assignment" hint="Coupon will apply to this salon's catalog">
          <Select value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Coupon code" hint="e.g. WELCOME20, SUMMER50">
            <TextInput
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              required
            />
          </Field>
          <Field label="Title / campaign name (optional)">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summer Discount 20%"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Discount format">
            <Select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
            >
              <option value="percent">Percentage discount (%)</option>
              <option value="amount">Fixed price discount ($)</option>
            </Select>
          </Field>
          <Field label={discountType === 'percent' ? 'Percentage off (%)' : 'Amount off ($)'}>
            <TextInput
              type="number"
              min="1"
              max={discountType === 'percent' ? '100' : undefined}
              step="any"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Global usage limit" hint="Leave blank for unlimited">
            <TextInput
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="e.g. 100"
            />
          </Field>
          <Field label="Minimum cart order ($)" hint="Minimum required booking total">
            <TextInput
              type="number"
              min="0"
              step="any"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="e.g. 50"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4 mt-2">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} variant="primary">
            {pending ? 'Creating...' : 'Create coupon'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
