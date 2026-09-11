'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCw, Search, ExternalLink } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import {
  getUserWallet,
  getUserWalletEntries,
  listUsers,
  type PlatformUser,
} from '@/lib/api/users';
import { count, date, initials, money, shortId, since } from '@/lib/format';
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
import { Modal } from '@/components/ui/Form';

const ROLES = ['ALL', 'CUSTOMER', 'BARBER', 'STAFF', 'OWNER', 'SUPER_ADMIN'] as const;
type RoleFilter = (typeof ROLES)[number];

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const users = useApi(
    () => listUsers({ role: roleFilter === 'ALL' ? undefined : roleFilter }),
    [roleFilter],
  );

  const needle = query.trim().toLowerCase();
  const visible = (users.data ?? []).filter((u) => {
    if (!needle) return true;
    return (
      u.email.toLowerCase().includes(needle) ||
      u.id.toLowerCase().includes(needle) ||
      (u.tenantId && u.tenantId.toLowerCase().includes(needle))
    );
  });

  const total = users.data?.length ?? 0;
  const customers = (users.data ?? []).filter((u) => u.role === 'CUSTOMER').length;
  const barbers = (users.data ?? []).filter((u) => u.role === 'BARBER' || u.role === 'STAFF').length;
  const owners = (users.data ?? []).filter((u) => u.role === 'OWNER').length;
  const admins = (users.data ?? []).filter((u) => u.role === 'SUPER_ADMIN').length;

  return (
    <>
      <PageHead
        eyebrow="Platform"
        title="Users & Accounts"
        lede="Registered accounts across all apps on the platform. Inspect account roles, verification state, and tenant links."
        actions={
          <Button onClick={users.refresh} disabled={users.loading}>
            <RotateCw size={12} className={users.loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <Canvas>
        {users.error && <Failed message={users.error} onRetry={users.refresh} />}
        {users.loading && !users.data && <Loading label="Loading accounts directory" />}

        {users.data && !users.error && (
          <>
            <div className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-5">
              <Stat label="Total accounts" value={count(total)} pending={users.loading} />
              <Stat label="Customers" value={count(customers)} tone="plain" />
              <Stat label="Barbers & Staff" value={count(barbers)} />
              <Stat label="Shop Owners" value={count(owners)} tone="live" />
              <Stat
                label="Super Admins"
                value={count(admins)}
                tone={admins > 1 ? 'signal' : 'plain'}
                sub="Platform operators"
              />
            </div>

            <Panel
              flush
              title={`${count(visible.length)} account${visible.length === 1 ? '' : 's'}`}
              note={roleFilter !== 'ALL' ? `Filtered by ${roleFilter.toLowerCase()}` : undefined}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 border-r border-rule-soft pr-2">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoleFilter(r)}
                        className={`rounded-[2px] px-2 py-1 text-[11px] font-medium transition-colors ${
                          roleFilter === r
                            ? 'bg-ink text-white'
                            : 'text-ink-2 hover:bg-ground hover:text-ink'
                        }`}
                      >
                        {r === 'ALL' ? 'All' : r.toLowerCase()}
                      </button>
                    ))}
                  </div>

                  <label className="relative">
                    <Search
                      size={13}
                      className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search email or ID"
                      aria-label="Search users"
                      className="w-[180px] rounded-[3px] border border-rule bg-surface py-[5px] pr-2.5 pl-7 text-[12px] placeholder:text-ink-3 focus:border-ink focus:outline-none"
                    />
                  </label>
                </div>
              }
            >
              {visible.length === 0 ? (
                <div className="p-8">
                  <Empty
                    title="No accounts match"
                    hint={query ? 'Try clearing your search query.' : 'No users found in this role.'}
                  />
                </div>
              ) : (
                <Scroll>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Account</Th>
                        <Th>Role</Th>
                        <Th>Linked shop</Th>
                        <Th>Verified</Th>
                        <Th align="right">Joined</Th>
                        <Th align="right">Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((u) => (
                        <Tr key={u.id}>
                          <Td>
                            <div className="flex items-center gap-2.5">
                              <span
                                aria-hidden
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-ground text-[11px] font-semibold text-ink"
                              >
                                {initials(u.email)}
                              </span>
                              <div className="min-w-0">
                                <span className="block truncate font-medium text-ink">
                                  {u.email}
                                </span>
                                <span className="tabular font-mono text-[11px] text-ink-3">
                                  {shortId(u.id)}
                                </span>
                              </div>
                            </div>
                          </Td>
                          <Td>
                            <UserRoleBadge role={u.role} />
                          </Td>
                          <Td>
                            {u.tenantId ? (
                              <Link
                                href={`/shops/${u.tenantId}`}
                                className="inline-flex items-center gap-1 font-mono text-[12px] text-ink hover:underline"
                              >
                                {shortId(u.tenantId)}
                                <ExternalLink size={10} className="text-ink-3" />
                              </Link>
                            ) : (
                              <span className="text-[12px] text-ink-3">None / Solo</span>
                            )}
                          </Td>
                          <Td>
                            {u.emailVerified ? (
                              <Badge tone="live">Verified</Badge>
                            ) : (
                              <Badge tone="signal">Pending</Badge>
                            )}
                          </Td>
                          <Td align="right" mono muted>
                            <span title={date(u.createdAt)}>{since(u.createdAt)}</span>
                          </Td>
                          <Td align="right">
                            <button
                              type="button"
                              onClick={() => setSelectedUser(u)}
                              className="text-[12px] font-medium text-ink-2 hover:text-ink"
                            >
                              Inspect
                            </button>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </Scroll>
              )}
            </Panel>
          </>
        )}
      </Canvas>

      {selectedUser && (
        <Modal title="User Account Details" onClose={() => setSelectedUser(null)}>
          <div className="space-y-4 text-[13px]">
            <div className="flex items-center gap-3 border-b border-rule-soft pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-ground font-bold text-ink">
                {initials(selectedUser.email)}
              </span>
              <div>
                <p className="font-semibold">{selectedUser.email}</p>
                <p className="tabular font-mono text-[11px] text-ink-3">{selectedUser.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="eyebrow !text-[10px]">Role</p>
                <div className="mt-1">
                  <UserRoleBadge role={selectedUser.role} />
                </div>
              </div>
              <div>
                <p className="eyebrow !text-[10px]">Email Status</p>
                <p className="mt-1 text-ink-2">
                  {selectedUser.emailVerified ? 'Verified' : 'Unverified'}
                </p>
              </div>
              <div>
                <p className="eyebrow !text-[10px]">Linked Tenant</p>
                <p className="mt-1 font-mono text-[12px]">
                  {selectedUser.tenantId ? (
                    <Link
                      href={`/shops/${selectedUser.tenantId}`}
                      className="text-ink hover:underline"
                    >
                      {selectedUser.tenantId}
                    </Link>
                  ) : (
                    'No shop (Independent / Customer)'
                  )}
                </p>
              </div>
              <div>
                <p className="eyebrow !text-[10px]">Created At</p>
                <p className="mt-1 tabular text-ink-2">{date(selectedUser.createdAt)}</p>
              </div>
            </div>

            <UserWalletSection userId={selectedUser.id} />

            <div className="flex justify-end border-t border-rule-soft pt-4">
              <Button onClick={() => setSelectedUser(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function UserWalletSection({ userId }: { userId: string }) {
  const walletApi = useApi(() => getUserWallet(userId), [userId]);
  const entriesApi = useApi(() => getUserWalletEntries(userId), [userId]);

  if (walletApi.loading) {
    return (
      <div className="rounded border border-rule bg-surface p-3 text-xs text-ink-3">
        Loading wallet information…
      </div>
    );
  }

  if (walletApi.error) {
    return (
      <div className="rounded border border-rule bg-ground p-3 text-xs text-ink-3">
        No active wallet registered for this user account.
      </div>
    );
  }

  const wallet = walletApi.data;
  const entries = entriesApi.data ?? [];

  return (
    <div className="space-y-3 rounded border border-rule bg-surface p-3">
      <div className="flex items-center justify-between border-b border-rule-soft pb-2">
        <div>
          <span className="eyebrow !text-[10px]">Digital Wallet</span>
          <div className="font-mono text-base font-bold text-ink">
            {money(wallet?.balance ?? 0)}{' '}
            <span className="text-xs font-normal text-ink-3">{wallet?.currency ?? 'BDT'}</span>
          </div>
        </div>
        <Badge tone="live">Active</Badge>
      </div>

      <div>
        <span className="eyebrow !text-[10px] mb-1.5 block">
          Recent Transactions ({entries.length})
        </span>
        {entries.length === 0 ? (
          <p className="text-xs text-ink-3">No ledger entries recorded yet.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {entries.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border-b border-rule-soft py-1.5 text-xs last:border-0"
              >
                <div>
                  <span className="font-medium text-ink">{entry.label || entry.type}</span>
                  <span className="block font-mono text-[10px] text-ink-3">
                    {date(entry.createdAt)}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono font-medium ${
                      entry.type === 'CREDIT' || entry.type === 'REFUND' || entry.type === 'TOP_UP'
                        ? 'text-signal'
                        : 'text-ink'
                    }`}
                  >
                    {entry.type === 'DEBIT' ? '-' : '+'}
                    {money(entry.amount)}
                  </span>
                  <span className="block font-mono text-[10px] text-ink-3">
                    bal: {money(entry.balanceAfter)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRoleBadge({ role }: { role: string }) {
  const normalized = role.toUpperCase();
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
      return <Badge tone="quiet">{role}</Badge>;
  }
}
