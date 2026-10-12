'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Phone,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { banUser, getUser, unbanUser } from '@/lib/api/users';
import { date, initials, since } from '@/lib/format';
import {
  Badge,
  Button,
  Canvas,
  Failed,
  Loading,
  PageHead,
  Panel,
} from '@/components/ui/primitives';
import { Field, FormError, TextInput } from '@/components/ui/Form';
import WalletPanel from '@/components/ui/WalletPanel';
import LoyaltyPanel from '@/components/ui/LoyaltyPanel';
import CustomerInsights from '@/components/insights/CustomerInsights';

export function UserRoleBadge({ role }: { role?: string }) {
  const normalized = (role || '').toUpperCase();
  switch (normalized) {
    case 'SUPER_ADMIN':
      return <Badge tone="signal">Super Admin</Badge>;
    case 'OWNER':
      return <Badge tone="live">Owner</Badge>;
    case 'STAFF':
      return <Badge>Staff</Badge>;
    case 'BARBER':
      return <Badge>Barber</Badge>;
    case 'CUSTOMER':
      return <Badge tone="quiet">Customer</Badge>;
    default:
      return <Badge tone="quiet">{role || 'Unknown'}</Badge>;
  }
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? decodeURIComponent(params.id) : '';

  const [banning, setBanning] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const ban = useMutation(banUser);
  const unban = useMutation(unbanUser);

  const userApi = useApi(
    () => (id ? getUser(id) : Promise.reject(new Error('Missing user ID'))),
    [id], 'user'
  );

  const user = userApi.data;

  function copyUserId() {
    if (!id) return;
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to Users Directory
        </Link>
      </div>

      {userApi.error && <Failed message={userApi.error} onRetry={userApi.refresh} />}
      {userApi.loading && !user && <Loading label="Loading user profile…" />}

      {user && (
        <>
          <PageHead
            eyebrow={`User Details · ${user.role}`}
            title={user.email}
            lede={
              user.name
                ? `${user.name} · Account created ${since(user.createdAt)} (${date(user.createdAt)})`
                : `Account created ${since(user.createdAt)} (${date(user.createdAt)})`
            }
            actions={
              <div className="flex items-center gap-2">
                <Button onClick={userApi.refresh} disabled={userApi.loading}>
                  <RotateCw size={12} className={userApi.loading ? 'animate-spin' : ''} />
                  Refresh
                </Button>
              </div>
            }
          />

          <Canvas>
            {/* Status header banner if banned */}
            {user.isBanned && (
              <div className="rounded-xl border border-signal/30 bg-signal-soft/40 p-4 text-signal">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={20} className="mt-0.5 shrink-0 text-signal" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">This Account Is Suspended</h3>
                    <p className="mt-1 text-xs text-ink-2">
                      {user.bannedReason
                        ? `Reason: ${user.bannedReason}`
                        : 'No suspension reason provided.'}
                    </p>
                    {user.bannedAt && (
                      <p className="mt-1 font-mono text-[11px] text-ink-3">
                        Suspended on {date(user.bannedAt)} ({since(user.bannedAt)})
                      </p>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    disabled={unban.pending}
                    onClick={async () => {
                      const res = await unban.mutate(user.id);
                      if (res) {
                        void userApi.refresh();
                      }
                    }}
                  >
                    <ShieldCheck size={14} />
                    {unban.pending ? 'Restoring…' : 'Restore Account Access'}
                  </Button>
                </div>
              </div>
            )}

            {/* Profile Overview Card */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left 2 Cols: Main Info */}
              <div className="space-y-6 lg:col-span-2">
                <Panel title="Account Overview">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-rule-soft pb-6">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-alt font-display text-xl font-bold text-ink shadow-sm border border-rule">
                        {initials(user.name || user.email)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-ink">
                            {user.name || user.email}
                          </h2>
                          <UserRoleBadge role={user.role} />
                          {user.emailVerified ? (
                            <Badge tone="live">Email Verified</Badge>
                          ) : (
                            <Badge tone="signal">Unverified</Badge>
                          )}
                          {user.isBanned && <Badge tone="signal">Suspended</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-3">
                          <span className="flex items-center gap-1">
                            <Mail size={12} />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border border-rule-soft bg-ground/50 p-3">
                        <span className="eyebrow !text-[10px] block text-ink-3">User ID</span>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-ink truncate select-all">{user.id}</span>
                          <button
                            type="button"
                            onClick={copyUserId}
                            className="p-1 text-ink-3 hover:text-ink transition-colors"
                            title="Copy full ID"
                          >
                            {copiedId ? <Check size={13} className="text-live" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-rule-soft bg-ground/50 p-3">
                        <span className="eyebrow !text-[10px] block text-ink-3">Account Role</span>
                        <div className="mt-1">
                          <UserRoleBadge role={user.role} />
                        </div>
                      </div>

                      <div className="rounded-lg border border-rule-soft bg-ground/50 p-3">
                        <span className="eyebrow !text-[10px] block text-ink-3">Linked Salon / Tenant</span>
                        <div className="mt-1 text-xs">
                          {user.tenantId ? (
                            <Link
                              href={`/shops/${user.tenantId}`}
                              className="inline-flex items-center gap-1.5 font-mono font-medium text-ink hover:underline"
                            >
                              <Store size={12} className="text-ink-3" />
                              {user.tenantId}
                              <ExternalLink size={10} className="text-ink-3" />
                            </Link>
                          ) : (
                            <span className="text-ink-3">None (Customer or Solo)</span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-rule-soft bg-ground/50 p-3">
                        <span className="eyebrow !text-[10px] block text-ink-3">Registration Date</span>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-ink">
                          <Calendar size={12} className="text-ink-3" />
                          <span>{date(user.createdAt)}</span>
                          <span className="text-ink-3">({since(user.createdAt)})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>

                {/* Suspension & Ban Moderation Card */}
                {user.role !== 'SUPER_ADMIN' && (
                  <Panel title="Account Moderation & Access Control">
                    <div className="p-6">
                      <FormError message={ban.error ?? unban.error} />

                      {user.isBanned ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-ink">Account is currently banned</h4>
                            <p className="text-xs text-ink-3 mt-0.5">
                              Unbanning will restore login capability and allow token generation.
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            disabled={unban.pending}
                            onClick={async () => {
                              const res = await unban.mutate(user.id);
                              if (res) {
                                void userApi.refresh();
                              }
                            }}
                          >
                            <ShieldCheck size={14} />
                            {unban.pending ? 'Unbanning…' : 'Unban Account'}
                          </Button>
                        </div>
                      ) : banning ? (
                        <div className="space-y-4 rounded-lg border border-signal/20 bg-signal-soft/20 p-4">
                          <h4 className="text-sm font-semibold text-signal">Suspend User Account</h4>
                          <p className="text-xs text-ink-2">
                            This will immediately revoke all active refresh tokens and block the user
                            from signing in or refreshing sessions on any platform application.
                          </p>
                          <Field
                            label="Reason for suspension (optional)"
                            hint="Logged to the super admin audit ledger."
                          >
                            <TextInput
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                              placeholder="e.g. Terms violation, abusive behavior, fraud"
                              // eslint-disable-next-line jsx-a11y/no-autofocus -- first field of a dialog the admin just opened
                              autoFocus
                            />
                          </Field>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button onClick={() => setBanning(false)}>Cancel</Button>
                            <Button
                              variant="danger"
                              disabled={ban.pending}
                              onClick={async () => {
                                const res = await ban.mutate(user.id, banReason.trim() || undefined);
                                if (res) {
                                  setBanning(false);
                                  setBanReason('');
                                  void userApi.refresh();
                                }
                              }}
                            >
                              <ShieldAlert size={14} />
                              {ban.pending ? 'Suspending…' : 'Confirm Suspension'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-ink">Account is in good standing</h4>
                            <p className="text-xs text-ink-3 mt-0.5">
                              Suspend this user to revoke session tokens and block platform access.
                            </p>
                          </div>
                          <Button variant="danger" onClick={() => setBanning(true)}>
                            <ShieldAlert size={14} />
                            Suspend Account
                          </Button>
                        </div>
                      )}
                    </div>
                  </Panel>
                )}
              </div>

              {/* Right Col: Wallet & Loyalty */}
              <div className="space-y-6">
                <Panel title="Digital Wallet">
                  <div className="p-4">
                    <WalletPanel userId={user.id} />
                  </div>
                </Panel>

                <Panel title="Loyalty & Rewards">
                  <div className="p-4">
                    <LoyaltyPanel userId={user.id} />
                  </div>
                </Panel>

                {user.tenantId && (
                  <Panel title="Tenant Association">
                    <div className="p-4 space-y-3 text-xs">
                      <p className="text-ink-2">
                        This user is registered under salon tenant{' '}
                        <strong className="text-ink font-mono">{user.tenantId}</strong>.
                      </p>
                      <Link
                        href={`/shops/${user.tenantId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline"
                      >
                        Inspect Salon Workspace <ExternalLink size={12} />
                      </Link>
                    </div>
                  </Panel>
                )}
              </div>
            </div>
            {user.role === 'CUSTOMER' && (
              <section className="space-y-3">
                <h2 className="text-[17px] font-extrabold text-[#1E293B]">Customer activity</h2>
                <CustomerInsights userId={id} />
              </section>
            )}
          </Canvas>
        </>
      )}
    </>
  );
}
