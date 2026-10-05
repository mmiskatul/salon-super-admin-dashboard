'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCw, Search, ExternalLink } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { listUsers } from '@/lib/api/users';
import { listTenants } from '@/lib/api/tenants';
import { count, date, initials, shortId, since } from '@/lib/format';
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

const ROLES = ['ALL', 'CUSTOMER', 'BARBER', 'STAFF', 'OWNER', 'SUPER_ADMIN'] as const;
type RoleFilter = (typeof ROLES)[number];

const PAGE_SIZE = 50;

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

// useSearchParams needs a Suspense boundary to build.
export default function UsersPage() {
  return (
    <Suspense>
      <UsersPageInner />
    </Suspense>
  );
}

function UsersPageInner() {
  // ?q= comes from the header's search box.
  const urlQuery = useSearchParams().get('q') ?? '';
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [query, setQuery] = useState(urlQuery);
  const [search, setSearch] = useState(urlQuery.trim());
  const [page, setPage] = useState(1);

  // A new header search while already on this page.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(urlQuery);
    setSearch(urlQuery.trim());
    setPage(1);
  }, [urlQuery]);

  // Searched on the server, across every account. It used to filter only the 50 rows already on
  // screen, so anyone past the first page could not be found.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const users = useApi(
    () =>
      listUsers({
        search: search || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        page,
        limit: PAGE_SIZE,
      }),
    [roleFilter, page, search],
    'users',
  );

  function selectRole(r: RoleFilter) {
    setRoleFilter(r);
    setPage(1);
  }

  // Handle both { data: [...], total } and raw array [...] responses from backends
  const rows = Array.isArray(users.data)
    ? users.data
    : (users.data?.data ?? []);

  // Names for the people and shops on this page: the table showed only emails and shop ids.
  const tenants = useApi(() => listTenants(), [], 'tenants');
  const shopName = new Map((tenants.data ?? []).map((t) => [t.id, t.name]));
  const personName = (id: string) => rows.find((u) => u.id === id)?.name || null;

  const visible = rows;

  const total = Array.isArray(users.data)
    ? users.data.length
    : (users.data?.total ?? rows.length);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const customers = rows.filter((u) => (u?.role || '').toUpperCase() === 'CUSTOMER').length;
  const barbers = rows.filter((u) => {
    const r = (u?.role || '').toUpperCase();
    return r === 'BARBER' || r === 'STAFF';
  }).length;
  const owners = rows.filter((u) => (u?.role || '').toUpperCase() === 'OWNER').length;
  const admins = rows.filter((u) => (u?.role || '').toUpperCase() === 'SUPER_ADMIN').length;

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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <Stat label="Total accounts" value={count(total)} pending={users.loading} />
              <Stat label="Customers" value={count(customers)} tone="plain" sub="This page" />
              <Stat label="Barbers & Staff" value={count(barbers)} sub="This page" />
              <Stat label="Shop Owners" value={count(owners)} tone="live" sub="This page" />
              <Stat
                label="Super Admins"
                value={count(admins)}
                tone={admins > 1 ? 'signal' : 'plain'}
                sub="This page"
              />
            </div>

            <Panel
              flush
              title={`${count(visible.length)} account${visible.length === 1 ? '' : 's'}`}
              note={roleFilter !== 'ALL' ? `Filtered by ${roleFilter.toLowerCase()}` : undefined}
              actions={
                <div className="flex flex-wrap items-center gap-2.5 font-manrope">
                  <div className="flex flex-wrap items-center gap-1.5 border-r border-[#E2E8F0] pr-3">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => selectRole(r)}
                        className={`rounded-full px-3 py-1 text-[12px] font-manrope transition-all cursor-pointer ${
                          roleFilter === r
                            ? 'bg-[#635BFF] text-white shadow-sm shadow-[#635BFF]/20 font-bold'
                            : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B] font-semibold'
                        }`}
                      >
                        {r === 'ALL' ? 'All Roles' : r.toLowerCase()}
                      </button>
                    ))}
                  </div>

                  <label className="relative">
                    <Search
                      size={14}
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]"
                    />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Name, email or account ID"
                      aria-label="Search users"
                      className="w-[200px] rounded-lg border border-[#E2E8F0] bg-white py-1.5 pr-3 pl-8 text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all"
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
                        <Th>Shop / Tenant</Th>
                        <Th>Status</Th>
                        <Th align="right">Registered</Th>
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
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ground text-[11px] font-semibold text-ink"
                              >
                                {initials(u.email)}
                              </span>
                              <div className="min-w-0">
                                <Link
                                  href={`/users/${u.id}`}
                                  className="block truncate font-medium text-ink hover:underline hover:text-signal transition-colors"
                                >
                                  {personName(u.id) || u.email}
                                </Link>
                                <span className="block truncate text-[11px] text-ink-3">
                                  {personName(u.id) ? u.email : shortId(u.id)}
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
                                className="inline-flex items-center gap-1 text-[12px] text-ink hover:underline"
                              >
                                {shopName.get(u.tenantId) || shortId(u.tenantId)}
                                <ExternalLink size={10} className="text-ink-3" />
                              </Link>
                            ) : (
                              <span className="text-[12px] text-ink-3">
                                {u.role === 'BARBER' ? 'Independent' : u.role === 'OWNER' ? 'No shop yet' : '—'}
                              </span>
                            )}
                          </Td>
                          <Td>
                            <div className="flex flex-wrap items-center gap-1">
                              {u.emailVerified ? (
                                <Badge tone="live">Verified</Badge>
                              ) : (
                                <Badge tone="signal">Pending</Badge>
                              )}
                              {u.isBanned && <Badge tone="signal">Banned</Badge>}
                            </div>
                          </Td>
                          <Td align="right" mono muted>
                            <span title={date(u.createdAt)}>{since(u.createdAt)}</span>
                          </Td>
                          <Td align="right">
                            <Link
                              href={`/users/${u.id}`}
                              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium text-ink-2 hover:bg-surface-alt hover:text-ink transition-colors"
                            >
                              Inspect
                              <ExternalLink size={11} className="text-ink-3" />
                            </Link>
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </Scroll>
              )}

              <div className="flex items-center justify-between border-t border-rule-soft px-4 py-2.5 text-[12px] text-ink-2">
                <span>
                  Page {page} of {totalPages} &middot; {count(total)} account{total === 1 ? '' : 's'}{' '}
                  platform-wide
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || users.loading}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || users.loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Panel>
          </>
        )}
      </Canvas>
    </>
  );
}
