'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Check,
  CheckCircle2,
  ExternalLink,
  Filter,
  Megaphone,
  Plus,
  RotateCw,
  Search,
  Store,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { NOTIFY_GROUP_LABELS, previewNotify, sendNotify, type NotifyGroup, type NotifyTarget } from '@/lib/api/control';
import { deleteBroadcast, listRecentBroadcasts } from '@/lib/api/broadcasts';
import { getUser, listUsers, type PlatformUser } from '@/lib/api/users';
import { listTenants, type Tenant } from '@/lib/api/tenants';
import { date, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, PageHead, Panel } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Field, FormError, TextArea, TextInput } from '@/components/ui/Form';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

type Mode = 'people' | 'shop' | 'group' | 'everyone';
type Person = Pick<PlatformUser, 'id' | 'email' | 'role'> & { name?: string | null; phone?: string | null };

const ROLE_BADGES: Record<string, 'primary' | 'signal' | 'live' | 'quiet' | 'warning' | 'plain'> = {
  CUSTOMER: 'primary',
  BARBER: 'signal',
  OWNER: 'warning',
  STAFF: 'live',
  SUPER_ADMIN: 'quiet',
};

/** Send an in-app (and push) notification to anyone: chosen people, a shop's team, a group or everyone. */
export default function NotifyPage() {
  const [mode, setMode] = useState<Mode>('people');

  // Specific people state
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [found, setFound] = useState<Person[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualIdError, setManualIdError] = useState<string | null>(null);
  const [manualIdPending, setManualIdPending] = useState(false);

  // Shop selection state
  const [tenantId, setTenantId] = useState('');
  const [shopSearch, setShopSearch] = useState('');
  const [manualShopId, setManualShopId] = useState('');
  const [manualShopError, setManualShopError] = useState<string | null>(null);

  // Group & message state
  const [group, setGroup] = useState<NotifyGroup>('CUSTOMERS');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [push, setPush] = useState(true);
  const [reach, setReach] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Broadcast deletion dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const shops = useApi(() => listTenants(), [], 'tenants');
  const broadcastsApi = useApi(() => listRecentBroadcasts(), [], 'broadcasts');
  const send = useMutation(sendNotify);

  const allShops: Tenant[] = useMemo(() => shops.data ?? [], [shops.data]);
  const selectedShop = useMemo(() => allShops.find((s) => s.id === tenantId), [allShops, tenantId]);

  const tenantsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of allShops) {
      map.set(t.id, t.name);
    }
    return map;
  }, [allShops]);

  // Filter shops by name or ID
  const filteredShops = useMemo(() => {
    const q = shopSearch.trim().toLowerCase();
    if (!q) return allShops;
    return allShops.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.businessType && s.businessType.toLowerCase().includes(q))
    );
  }, [allShops, shopSearch]);

  const target: NotifyTarget | null =
    mode === 'everyone' ? { everyone: true } : mode === 'group' ? { group } : mode === 'shop' ? (tenantId ? { tenantId } : null) : people.length ? { userIds: people.map((p) => p.id) } : null;
  const targetKey = JSON.stringify(target);

  // People search with debounced backend query
  useEffect(() => {
    if (search.trim().length < 2 && !roleFilter) {
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      setSearchLoading(true);
      listUsers({ search: search.trim() || undefined, role: roleFilter || undefined, limit: 12 })
        .then((page) => {
          if (!live) return;
          const list = (Array.isArray(page) ? page : page.data) as Person[];
          setFound(list);
        })
        .catch(() => live && setFound([]))
        .finally(() => live && setSearchLoading(false));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [search, roleFilter]);

  // Calculate live audience reach
  useEffect(() => {
    const chosen = JSON.parse(targetKey) as NotifyTarget | null;
    if (!chosen) {
      return;
    }
    let live = true;
    previewNotify(chosen)
      .then((r) => live && setReach(r.recipients))
      .catch(() => live && setReach(null));
    return () => {
      live = false;
    };
  }, [targetKey]);

  // Direct Add User by ID
  async function handleAddUserById() {
    const cleanId = manualUserId.trim();
    if (!cleanId) return;
    setManualIdError(null);

    // If comma/space-separated IDs are entered, support bulk entry
    const ids = cleanId.split(/[\s,]+/).filter((x) => x.length > 0);
    setManualIdPending(true);

    try {
      const added: Person[] = [];
      for (const id of ids) {
        if (people.some((p) => p.id === id)) continue; // already added
        try {
          const u = await getUser(id);
          added.push(u);
        } catch {
          // If direct get fails, try search fallback
          const page = await listUsers({ search: id, limit: 5 });
          const match = ((Array.isArray(page) ? page : page.data) as Person[]).find(
            (p) => p.id.toLowerCase() === id.toLowerCase() || p.id.startsWith(id.toLowerCase())
          );
          if (match && !people.some((p) => p.id === match.id)) {
            added.push(match);
          } else {
            throw new Error(`User with ID "${id}" could not be found.`);
          }
        }
      }

      if (added.length === 0 && ids.length > 0) {
        setManualIdError('This account is already in the recipient list.');
      } else {
        setPeople((prev) => [...prev, ...added]);
        setManualUserId('');
      }
    } catch (err) {
      setManualIdError((err as Error).message || 'Invalid user ID or user not found');
    } finally {
      setManualIdPending(false);
    }
  }

  // Direct Select Shop by ID
  function handleSelectShopById() {
    const cleanId = manualShopId.trim();
    if (!cleanId) return;
    setManualShopError(null);

    const match = allShops.find(
      (s) => s.id.toLowerCase() === cleanId.toLowerCase() || s.id.toLowerCase().startsWith(cleanId.toLowerCase())
    );

    if (match) {
      setTenantId(match.id);
      setManualShopId('');
    } else {
      setManualShopError(`No shop found matching ID "${cleanId}".`);
    }
  }

  async function submit() {
    if (!target || !title.trim() || !body.trim()) return;
    if ((mode === 'everyone' || mode === 'group') && !window.confirm(`Send "${title.trim()}" to ${reach ?? 'all'} people?`)) return;
    const r = await send.mutate({ ...target, title: title.trim(), body: body.trim(), push });
    if (r) {
      setResult(`Notification sent successfully to ${r.sent} ${r.sent === 1 ? 'person' : 'people'}${push ? ` (${r.pushDevices} phone${r.pushDevices === 1 ? '' : 's'} registered for push)` : ''}.`);
      setTitle('');
      setBody('');
      await broadcastsApi.refresh();
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      setDeletePending(true);
      setDeleteError(null);
      await deleteBroadcast(deleteTarget.id);
      await broadcastsApi.refresh();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError((err instanceof Error && err.message) || 'Could not retract announcement. Please try again.');
    } finally {
      setDeletePending(false);
    }
  }

  function handleRefreshAll() {
    shops.refresh();
    broadcastsApi.refresh();
  }

  const modes: { key: Mode; label: string; icon: typeof Users }[] = [
    { key: 'people', label: 'Specific people', icon: Users },
    { key: 'shop', label: "A shop's team", icon: Store },
    { key: 'group', label: 'A user group', icon: UserPlus },
    { key: 'everyone', label: 'Everyone', icon: Megaphone },
  ];

  const shown = search.trim().length >= 2 || roleFilter ? found : [];
  const broadcasts = broadcastsApi.data ?? [];

  return (
    <>
      <PageHead
        eyebrow="Messaging"
        title="Notify people"
        lede="Send an in-app and push notification to anyone on SalunBD. Pick specific accounts with ID lookup, a whole shop, an entire user group, or everyone across the platform."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/broadcasts">
              <Button variant="outline"><Megaphone className="h-4 w-4" /> Broadcasts console</Button>
            </Link>
            <Button onClick={handleRefreshAll} disabled={broadcastsApi.loading || shops.loading}>
              <RotateCw className={`h-4 w-4 ${broadcastsApi.loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        }
      />
      <Canvas>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Panel 1: Target Audience */}
          <Panel
            title="1. Target audience"
            note={target ? (reach === null ? 'Calculating reach…' : `Reaches ${reach} ${reach === 1 ? 'person' : 'people'}`) : 'Choose who to notify'}
          >
            {/* Mode selection buttons */}
            <div className="mb-5 flex flex-wrap gap-2">
              {modes.map((m) => {
                const Icon = m.icon;
                return (
                  <Button
                    key={m.key}
                    variant={mode === m.key ? 'primary' : 'outline'}
                    onClick={() => {
                      setMode(m.key);
                      setResult(null);
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {m.label}
                  </Button>
                );
              })}
            </div>

            {/* Mode: Specific People */}
            {mode === 'people' && (
              <div className="space-y-4">
                {/* Search with role filter */}
                <div className="space-y-1.5">
                  <span className="text-[12px] font-bold text-[#1E293B]">Search accounts by Name, Email, Phone, or ID</span>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <label className="relative flex-1 font-manrope">
                      <span className="sr-only">Search people</span>
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Type name, email, phone, or user ID..."
                        className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2 pl-9 pr-3 text-[13px] shadow-xs focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                      />
                    </label>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Filter className="h-4 w-4 text-[#94A3B8]" />
                      <select
                        aria-label="Role filter"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-2 text-[12px] font-semibold text-[#475569] shadow-xs focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                      >
                        <option value="">All roles</option>
                        <option value="CUSTOMER">Customer</option>
                        <option value="BARBER">Barber</option>
                        <option value="OWNER">Shop Owner</option>
                        <option value="STAFF">Staff</option>
                        <option value="SUPER_ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Direct User ID Input Section */}
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#1E293B] flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-[#635BFF]" />
                      Add specific user directly by ID
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">Full or partial UUID</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualUserId}
                      onChange={(e) => {
                        setManualUserId(e.target.value);
                        setManualIdError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleAddUserById();
                        }
                      }}
                      placeholder="Paste User ID (e.g. 94d368f8-32ae-438f...)"
                      className="flex-1 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 font-mono text-[12px] shadow-xs focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                    />
                    <Button
                      variant="primary"
                      onClick={() => void handleAddUserById()}
                      disabled={!manualUserId.trim() || manualIdPending}
                    >
                      {manualIdPending ? 'Checking…' : 'Add by ID'}
                    </Button>
                  </div>
                  {manualIdError && (
                    <p className="text-[12px] font-semibold text-[#EF4444]">{manualIdError}</p>
                  )}
                </div>

                {/* Search results dropdown/list */}
                {searchLoading ? (
                  <p className="py-2 text-center text-[12px] text-[#94A3B8]">Searching accounts…</p>
                ) : shown.length > 0 ? (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Matching accounts ({shown.length})</span>
                    <ul className="max-h-56 divide-y divide-[#F1F5F9] overflow-y-auto rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
                      {shown.map((u) => {
                        const isSelected = people.some((p) => p.id === u.id);
                        return (
                          <li key={u.id}>
                            <button
                              type="button"
                              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition-colors ${
                                isSelected ? 'bg-[#EEF2FF] text-[#635BFF]' : 'hover:bg-[#F8FAFC]'
                              }`}
                              onClick={() => {
                                setPeople((prev) => (isSelected ? prev.filter((x) => x.id !== u.id) : [...prev, u]));
                              }}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#1E293B]">{u.name || u.email}</span>
                                  {u.name && <span className="text-[11px] text-[#94A3B8]">{u.email}</span>}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-[#94A3B8] font-mono">
                                  <span>ID: {u.id}</span>
                                  {u.phone && <span className="font-sans">· {u.phone}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge tone={ROLE_BADGES[u.role] ?? 'plain'}>{u.role}</Badge>
                                {isSelected ? (
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#635BFF] text-white">
                                    <Check className="h-3 w-3" />
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-[#635BFF]">Add</span>
                                )}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : search.trim().length >= 2 ? (
                  <p className="py-2 text-center text-[12px] text-[#94A3B8]">No accounts match &ldquo;{search}&rdquo;. You can also enter the exact ID above.</p>
                ) : null}

                {/* Selected People List */}
                <div className="space-y-1.5 border-t border-[#F1F5F9] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#1E293B]">
                      Selected recipients ({people.length})
                    </span>
                    {people.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPeople([])}
                        className="text-[11px] font-semibold text-[#EF4444] hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {people.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] py-1 pl-3 pr-1.5 text-[12px] font-bold text-[#635BFF] shadow-xs"
                      >
                        <span>{p.name || p.email}</span>
                        <span className="font-mono text-[10px] text-[#818CF8]">({p.id.slice(0, 6)}…)</span>
                        <button
                          type="button"
                          aria-label={`Remove ${p.name || p.email}`}
                          onClick={() => setPeople((list) => list.filter((x) => x.id !== p.id))}
                          className="rounded-full p-0.5 hover:bg-[#E0E7FF]"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {people.length === 0 && (
                      <span className="text-[12px] text-[#94A3B8]">
                        Nobody chosen yet. Search by name/email/ID or paste an ID above.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mode: Shop Selection */}
            {mode === 'shop' && (
              <div className="space-y-4">
                {/* Search or Paste Shop ID */}
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#1E293B] flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-[#635BFF]" />
                      Select shop by ID directly
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">UUID or prefix</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualShopId}
                      onChange={(e) => {
                        setManualShopId(e.target.value);
                        setManualShopError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSelectShopById();
                        }
                      }}
                      placeholder="Paste Shop ID (tenantId)..."
                      className="flex-1 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 font-mono text-[12px] shadow-xs focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                    />
                    <Button
                      variant="primary"
                      onClick={handleSelectShopById}
                      disabled={!manualShopId.trim()}
                    >
                      Select ID
                    </Button>
                  </div>
                  {manualShopError && (
                    <p className="text-[12px] font-semibold text-[#EF4444]">{manualShopError}</p>
                  )}
                </div>

                {/* Filterable Shop Dropdown / Search */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#1E293B]">Or search by shop name / business</span>
                    <span className="text-[11px] text-[#94A3B8]">{allShops.length} shops registered</span>
                  </div>
                  <label className="relative block font-manrope">
                    <span className="sr-only">Search shops</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden />
                    <input
                      value={shopSearch}
                      onChange={(e) => setShopSearch(e.target.value)}
                      placeholder="Filter shop list by name or type..."
                      className="w-full rounded-lg border border-[#E2E8F0] bg-white py-1.5 pl-9 pr-3 text-[13px] shadow-xs focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                    />
                  </label>
                  <select
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] shadow-xs focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                  >
                    <option value="">Choose from {filteredShops.length} shops</option>
                    {filteredShops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.businessType ? `(${s.businessType})` : ''} — ID: {s.id.slice(0, 8)}…
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Shop Card */}
                {selectedShop ? (
                  <div className="rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1E293B] text-[14px]">{selectedShop.name}</span>
                          <Badge tone="live">Selected Shop</Badge>
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-[#4F46E5]">
                          tenantId: {selectedShop.id}
                        </p>
                        {selectedShop.businessType && (
                          <p className="text-[12px] text-[#64748B]">Type: {selectedShop.businessType}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setTenantId('')}
                        className="rounded-md p-1 text-[#64748B] hover:bg-[#E0E7FF] hover:text-[#EF4444]"
                        title="Remove selection"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#C7D2FE]/60 pt-2 text-[12px]">
                      <span className="text-[#475569]">
                        Audience: Shop owner &amp; all active barbers/staff
                      </span>
                      <Link
                        href={`/shops/${selectedShop.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-semibold text-[#635BFF] hover:underline"
                      >
                        View shop <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-[#94A3B8]">
                    No shop selected. Use the search input or paste a Shop ID above.
                  </p>
                )}
              </div>
            )}

            {/* Mode: User Group */}
            {mode === 'group' && (
              <Field label="User Group" hint="Broadcasts to all accounts matching this role">
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as NotifyGroup)}
                  className="mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-[13px] shadow-xs focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                >
                  {(Object.keys(NOTIFY_GROUP_LABELS) as NotifyGroup[]).map((g) => (
                    <option key={g} value={g}>
                      {NOTIFY_GROUP_LABELS[g]}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Mode: Everyone */}
            {mode === 'everyone' && (
              <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-[13px] font-medium text-[#475569] space-y-1">
                <p className="font-bold text-[#1E293B]">Platform-wide announcement</p>
                <p>Delivers to every customer, shop owner and barber on SalunBD (excluding banned or deleted accounts).</p>
              </div>
            )}
          </Panel>

          {/* Panel 2: Message Composer */}
          <Panel title="2. Notification message">
            <div className="space-y-4">
              {result && (
                <div className="flex items-start gap-2 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-[13px] font-semibold text-[#15803D]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{result}</span>
                </div>
              )}
              <Field label="Notification title">
                <TextInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Special Holiday Hours / New Update"
                />
              </Field>
              <Field label="Message body" hint={`${body.length}/1000`}>
                <TextArea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  placeholder="Type the notification message to display on user phones and feeds..."
                />
              </Field>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-[#475569]">
                <input
                  type="checkbox"
                  checked={push}
                  onChange={(e) => setPush(e.target.checked)}
                  className="rounded border-[#CBD5E1] text-[#635BFF] focus:ring-[#635BFF]"
                />
                Also send push notification to registered phones
              </label>
              <FormError message={send.error} />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => void submit()}
                  disabled={!target || !title.trim() || !body.trim() || send.pending || reach === 0}
                >
                  <BellRing className="h-4 w-4" />
                  {send.pending ? 'Sending…' : `Send notification${reach ? ` (${reach})` : ''}`}
                </Button>
              </div>
            </div>
          </Panel>
        </div>

        {/* Panel 3: Recent Platform Announcements Table */}
        <Panel
          flush
          title="Recent platform announcements"
          note="Broadcasts and system-wide announcements currently visible in user feeds"
          actions={
            <Button variant="outline" onClick={broadcastsApi.refresh} disabled={broadcastsApi.loading}>
              <RotateCw className={`h-3.5 w-3.5 ${broadcastsApi.loading ? 'animate-spin' : ''}`} /> Refresh list
            </Button>
          }
        >
          {broadcasts.length === 0 ? (
            <Empty title="No recent platform announcements" hint="Announcements sent platform-wide or shop-wide will be listed here." />
          ) : (
            <Scroll>
              <Table>
                <thead>
                  <Tr>
                    <Th align="left">Announcement</Th>
                    <Th align="left">Audience</Th>
                    <Th align="left">Category</Th>
                    <Th align="left">Sent</Th>
                    <Th align="right">Actions</Th>
                  </Tr>
                </thead>
                <tbody>
                  {broadcasts.map((b) => {
                    const shopName = b.tenantName || (b.tenantId ? tenantsMap.get(b.tenantId) ?? b.tenantId : null);
                    return (
                      <Tr key={b.id}>
                        <Td align="left">
                          <div className="max-w-md space-y-0.5">
                            <div className="font-bold text-[#1E293B]">{b.title}</div>
                            <div className="text-[12px] text-[#64748B] line-clamp-2">{b.body}</div>
                          </div>
                        </Td>
                        <Td align="left">
                          {b.tenantId ? (
                            <div className="flex flex-col gap-0.5">
                              <Link
                                href={`/shops/${b.tenantId}`}
                                className="group inline-flex items-center gap-1 font-bold text-[#1E293B] hover:text-[#635BFF]"
                              >
                                <span>{shopName}</span>
                                <ExternalLink size={10} className="text-[#94A3B8] group-hover:text-[#635BFF]" />
                              </Link>
                              <span className="text-[10px] text-[#94A3B8]">Shop scoped</span>
                            </div>
                          ) : (
                            <Badge tone="live">All platform users</Badge>
                          )}
                        </Td>
                        <Td align="left">
                          <Badge tone="plain">{b.category || 'SYSTEM'}</Badge>
                        </Td>
                        <Td align="left">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[12px] text-[#64748B]">{since(b.createdAt)}</span>
                            <span className="text-[10px] text-[#94A3B8]">{date(b.createdAt)}</span>
                          </div>
                        </Td>
                        <Td align="right">
                          <Button
                            variant="outline"
                            onClick={() => setDeleteTarget({ id: b.id, title: b.title })}
                            disabled={deletePending && deleteTarget?.id === b.id}
                            className="text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEE2E2]"
                          >
                            <Trash2 size={12} /> Retract
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </Scroll>
          )}
        </Panel>
      </Canvas>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Retract announcement"
        description={
          <p>
            Are you sure you want to retract and delete broadcast{' '}
            <strong className="text-[#1E293B] font-bold">&ldquo;{deleteTarget?.title}&rdquo;</strong>? This will permanently remove it from user notification feeds.
          </p>
        }
        confirmLabel="Confirm retract"
        variant="danger"
        pending={deletePending}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deletePending) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      />
    </>
  );
}
