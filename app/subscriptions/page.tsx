'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, RotateCw, Search, XCircle } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import {
  cancelSubscription,
  listSubscriptions,
  reactivateSubscription,
  updateSubscription,
  type Subscription,
} from '@/lib/api/subscriptions';
import { listTenants } from '@/lib/api/tenants';
import { count, date, shortId } from '@/lib/format';
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

export default function SubscriptionsPage() {
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const subsApi = useApi(() => listSubscriptions(), []);
  const tenantsApi = useApi(() => listTenants(), []);

  const tenantsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tenantsApi.data ?? []) {
      map.set(t.id, t.name);
    }
    return map;
  }, [tenantsApi.data]);

  const allSubs = subsApi.data ?? [];
  const needle = query.trim().toLowerCase();

  const filtered = allSubs.filter((s) => {
    if (planFilter !== 'ALL' && s.plan !== planFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (!needle) return true;
    const shopName = (s.tenantName || (tenantsMap.get(s.tenantId) ?? '')).toLowerCase();
    return (
      s.tenantId.toLowerCase().includes(needle) ||
      s.plan.toLowerCase().includes(needle) ||
      s.status.toLowerCase().includes(needle) ||
      shopName.includes(needle)
    );
  });

  const totalSubs = allSubs.length;
  const activeSubs = allSubs.filter((s) => s.status === 'ACTIVE').length;
  const trialingSubs = allSubs.filter((s) => s.status === 'TRIALING').length;
  const pastDueSubs = allSubs.filter((s) => s.status === 'PAST_DUE' || s.status === 'CANCELLED').length;

  async function handleCancel(tenantId: string) {
    if (!confirm('Are you sure you want to cancel this shop subscription?')) return;
    try {
      setActionLoadingId(tenantId);
      await cancelSubscription(tenantId, false);
      await subsApi.refresh();
    } catch (err: any) {
      alert(`Could not cancel subscription: ${err.message || err}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReactivate(tenantId: string) {
    try {
      setActionLoadingId(tenantId);
      await reactivateSubscription(tenantId);
      await subsApi.refresh();
    } catch (err: any) {
      alert(`Could not reactivate subscription: ${err.message || err}`);
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <>
      <PageHead
        eyebrow="Activity"
        title="Shop subscriptions"
        lede="Platform SaaS tiers, recurring billing cycles, and subscription statuses across all salon storefronts."
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={subsApi.refresh} disabled={subsApi.loading}>
              <RotateCw size={12} className={subsApi.loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        }
      />

      <Canvas>
        {subsApi.error && <Failed message={subsApi.error} onRetry={subsApi.refresh} />}
        {subsApi.loading && !subsApi.data && <Loading label="Loading shop subscriptions" />}

        {subsApi.data && !subsApi.error && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Total subscriptions" value={count(totalSubs)} pending={subsApi.loading} />
              <Stat
                label="Active subscriptions"
                value={count(activeSubs)}
                tone="live"
                sub="Active billing cycle"
              />
              <Stat
                label="In trial period"
                value={count(trialingSubs)}
                sub="Evaluation phase"
              />
              <Stat
                label="Past due / cancelled"
                value={count(pastDueSubs)}
                tone={pastDueSubs > 0 ? 'signal' : 'plain'}
                sub="Attention required"
              />
            </div>

            <Panel
              flush
              title={`${count(filtered.length)} subscription${filtered.length === 1 ? '' : 's'}`}
              actions={
                <div className="flex flex-wrap items-center gap-2.5 font-manrope">
                  <label className="relative">
                    <Search
                      size={14}
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]"
                    />
                    <input
                      type="text"
                      placeholder="Search shop or tenant..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 py-1.5 text-[12px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all shadow-xs"
                    />
                  </label>

                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all shadow-xs"
                  >
                    <option value="ALL">All plans</option>
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all shadow-xs"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="TRIALING">Trialing</option>
                    <option value="PAST_DUE">Past due</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              }
            >
              {filtered.length === 0 ? (
                <Empty
                  title="No subscriptions match your query"
                  hint="Try adjusting your search criteria or filter options."
                />
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <Tr>
                        <Th align="left">Shop / Salon</Th>
                        <Th align="left">Plan Tier</Th>
                        <Th align="left">Billing & Price</Th>
                        <Th align="left">Status</Th>
                        <Th align="left">Period ends</Th>
                        <Th align="right">Actions</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {filtered.map((sub) => {
                        const shopName = sub.tenantName || tenantsMap.get(sub.tenantId) || sub.tenantId;
                        const cycle = sub.billingCycle || 'MONTHLY';
                        const amount = sub.amount ?? (sub.plan === 'PRO' ? 79 : sub.plan === 'ENTERPRISE' ? 199 : 29);
                        const isCanceling = sub.cancelAtPeriodEnd;
                        const isActionLoading = actionLoadingId === sub.tenantId;

                        return (
                          <Tr key={sub.id}>
                            <Td align="left">
                              <div className="flex flex-col gap-0.5">
                                <Link
                                  href={`/shops/${sub.tenantId}`}
                                  className="group inline-flex items-center gap-1 font-medium text-ink hover:text-accent"
                                >
                                  <span>{shopName}</span>
                                  <ExternalLink
                                    size={11}
                                    className="text-ink-3 group-hover:text-accent"
                                  />
                                </Link>
                                <span className="font-mono text-[10px] text-ink-3">
                                  {shortId(sub.tenantId)}
                                </span>
                              </div>
                            </Td>
                            <Td align="left">
                              <div className="flex items-center gap-1.5">
                                <PlanBadge plan={sub.plan} />
                                {sub.planTitle && (
                                  <span className="text-[11px] text-ink-3">({sub.planTitle})</span>
                                )}
                              </div>
                            </Td>
                            <Td align="left">
                              <span className="font-medium text-ink text-xs">
                                ${amount}
                              </span>
                              <span className="text-[11px] text-ink-3"> / {cycle.toLowerCase()}</span>
                            </Td>
                            <Td align="left">
                              <div className="flex flex-col gap-1 items-start">
                                <StatusBadge status={sub.status} />
                                {isCanceling && (
                                  <span className="text-[10px] text-[#EF4444] font-medium">
                                    Cancels at period end
                                  </span>
                                )}
                              </div>
                            </Td>
                            <Td align="left">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-ink-2">
                                  {sub.currentPeriodEnd ? date(sub.currentPeriodEnd) : '—'}
                                </span>
                                {sub.daysRemaining != null && (
                                  <span className="text-[10px] text-ink-3">
                                    {sub.daysRemaining} days remaining
                                  </span>
                                )}
                              </div>
                            </Td>
                            <Td align="right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="secondary"
                                  onClick={() => setEditingSub(sub)}
                                >
                                  Edit plan
                                </Button>
                                {sub.status === 'ACTIVE' || sub.status === 'TRIALING' ? (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleCancel(sub.tenantId)}
                                    disabled={isActionLoading}
                                    className="text-[#EF4444] hover:bg-[#FEE2E2]"
                                  >
                                    <XCircle size={12} />
                                    Cancel
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleReactivate(sub.tenantId)}
                                    disabled={isActionLoading}
                                    className="text-[#10B981] hover:bg-[#D1FAE5]"
                                  >
                                    <CheckCircle2 size={12} />
                                    Reactivate
                                  </Button>
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
            </Panel>
          </>
        )}
      </Canvas>

      {editingSub && (
        <EditSubscriptionModal
          sub={editingSub}
          shopName={editingSub.tenantName || tenantsMap.get(editingSub.tenantId) || editingSub.tenantId}
          onClose={() => setEditingSub(null)}
          onSuccess={() => {
            setEditingSub(null);
            subsApi.refresh();
          }}
        />
      )}
    </>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  switch (plan) {
    case 'ENTERPRISE':
      return <Badge tone="live">Enterprise</Badge>;
    case 'PRO':
      return <Badge tone="signal">Pro</Badge>;
    case 'STARTER':
      return <Badge tone="plain">Starter</Badge>;
    default:
      return <Badge tone="plain">{plan}</Badge>;
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':
      return <Badge tone="live">Active</Badge>;
    case 'TRIALING':
      return <Badge tone="signal">Trialing</Badge>;
    case 'PAST_DUE':
      return <Badge tone="signal">Past due</Badge>;
    case 'CANCELLED':
      return <Badge tone="plain">Cancelled</Badge>;
    default:
      return <Badge tone="plain">{status}</Badge>;
  }
}

interface EditModalProps {
  sub: Subscription;
  shopName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EditSubscriptionModal({ sub, shopName, onClose, onSuccess }: EditModalProps) {
  const [plan, setPlan] = useState(sub.plan);
  const [status, setStatus] = useState(sub.status);
  const [billingCycle, setBillingCycle] = useState(sub.billingCycle || 'MONTHLY');
  const [amount, setAmount] = useState(
    sub.amount ? String(sub.amount) : plan === 'PRO' ? '79' : plan === 'ENTERPRISE' ? '199' : '29',
  );
  const [periodEnd, setPeriodEnd] = useState(
    sub.currentPeriodEnd ? sub.currentPeriodEnd.slice(0, 10) : '',
  );

  const mutation = useMutation(async () => {
    await updateSubscription(sub.tenantId, {
      plan,
      status,
      billingCycle,
      amount: amount ? Number(amount) : undefined,
      currentPeriodEnd: periodEnd ? new Date(periodEnd).toISOString() : undefined,
    });
    onSuccess();
  });

  return (
    <Modal
      title="Modify shop subscription"
      note={`Adjust billing tier or state for ${shopName}`}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-3.5"
      >
        {mutation.error && <FormError message={mutation.error} />}

        <Field label="Target plan tier">
          <Select
            value={plan}
            onChange={(e) => {
              const nextPlan = e.target.value;
              setPlan(nextPlan);
              if (billingCycle === 'YEARLY') {
                setAmount(nextPlan === 'PRO' ? '790' : nextPlan === 'ENTERPRISE' ? '1990' : '290');
              } else {
                setAmount(nextPlan === 'PRO' ? '79' : nextPlan === 'ENTERPRISE' ? '199' : '29');
              }
            }}
          >
            <option value="STARTER">Starter Plan ($29/mo)</option>
            <option value="PRO">Pro Plan ($79/mo)</option>
            <option value="ENTERPRISE">Enterprise Plan ($199/mo)</option>
          </Select>
        </Field>

        <Field label="Billing cycle">
          <Select
            value={billingCycle}
            onChange={(e) => {
              const nextCycle = e.target.value;
              setBillingCycle(nextCycle);
              if (nextCycle === 'YEARLY') {
                setAmount(plan === 'PRO' ? '790' : plan === 'ENTERPRISE' ? '1990' : '290');
              } else {
                setAmount(plan === 'PRO' ? '79' : plan === 'ENTERPRISE' ? '199' : '29');
              }
            }}
          >
            <option value="MONTHLY">Monthly Billing</option>
            <option value="YEARLY">Yearly Billing (Save 17%)</option>
          </Select>
        </Field>

        <Field label="Subscription amount ($)" hint="Billing charge per cycle">
          <TextInput
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>

        <Field label="Billing status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="PAST_DUE">Past due</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </Field>

        <Field label="Current period renewal date" hint="End date of currently paid cycle">
          <TextInput
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2 border-t border-rule-soft pt-4">
          <Button onClick={onClose} disabled={mutation.pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.pending} variant="primary">
            {mutation.pending ? 'Updating…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
