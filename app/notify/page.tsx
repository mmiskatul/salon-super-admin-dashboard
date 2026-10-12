'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, Search, X } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { NOTIFY_GROUP_LABELS, previewNotify, sendNotify, type NotifyGroup, type NotifyTarget } from '@/lib/api/control';
import { listUsers, type PlatformUser } from '@/lib/api/users';
import { listTenants } from '@/lib/api/tenants';
import { Badge, Button, Canvas, PageHead, Panel } from '@/components/ui/primitives';
import { Field, FormError, TextArea, TextInput } from '@/components/ui/Form';

type Mode = 'people' | 'shop' | 'group' | 'everyone';
type Person = Pick<PlatformUser, 'id' | 'email' | 'role'> & { name?: string | null };

/** Send an in-app (and push) notification to anyone: chosen people, a shop's team, a group or everyone. */
export default function NotifyPage() {
  const [mode, setMode] = useState<Mode>('people');
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<Person[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [group, setGroup] = useState<NotifyGroup>('CUSTOMERS');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [push, setPush] = useState(true);
  const [reach, setReach] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const shops = useApi(() => listTenants(), [], 'tenants');
  const send = useMutation(sendNotify);

  const target: NotifyTarget | null =
    mode === 'everyone' ? { everyone: true } : mode === 'group' ? { group } : mode === 'shop' ? (tenantId ? { tenantId } : null) : people.length ? { userIds: people.map((p) => p.id) } : null;
  const targetKey = JSON.stringify(target);

  // People search, after a pause in typing.
  useEffect(() => {
    if (search.trim().length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      listUsers({ search: search.trim(), limit: 8 })
        .then((page) => live && setFound((Array.isArray(page) ? page : page.data) as Person[]))
        .catch(() => live && setFound([]));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [search]);

  // How many people the current choice reaches.
  useEffect(() => {
    const chosen = JSON.parse(targetKey) as NotifyTarget | null;
    if (!chosen) return;
    let live = true;
    previewNotify(chosen)
      .then((r) => live && setReach(r.recipients))
      .catch(() => live && setReach(null));
    return () => {
      live = false;
    };
  }, [targetKey]);

  async function submit() {
    if (!target || !title.trim() || !body.trim()) return;
    if ((mode === 'everyone' || mode === 'group') && !window.confirm(`Send "${title.trim()}" to ${reach ?? 'all'} people?`)) return;
    const r = await send.mutate({ ...target, title: title.trim(), body: body.trim(), push });
    if (r) {
      setResult(`Sent to ${r.sent} ${r.sent === 1 ? 'person' : 'people'}${push ? `. ${r.pushDevices} phone${r.pushDevices === 1 ? '' : 's'} registered for push` : ''}.`);
      setTitle('');
      setBody('');
    }
  }

  const modes: { key: Mode; label: string }[] = [
    { key: 'people', label: 'Specific people' },
    { key: 'shop', label: "A shop's team" },
    { key: 'group', label: 'A group' },
    { key: 'everyone', label: 'Everyone' },
  ];
  const shown = search.trim().length >= 2 ? found : [];
  return (
    <>
      <PageHead
        eyebrow="Messaging"
        title="Notify people"
        lede="Send a notification to anyone on SalunBD. It appears in their app's notifications and, if they allowed it, on their phone. Every send is recorded in the audit log."
        actions={<Link href="/broadcasts"><Button variant="outline">Past announcements</Button></Link>}
      />
      <Canvas>
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="1. Who" note={target ? (reach === null ? 'Counting…' : `Reaches ${reach} ${reach === 1 ? 'person' : 'people'}`) : 'Choose who to notify'}>
            <div className="mb-4 flex flex-wrap gap-2">
              {modes.map((m) => (
                <Button key={m.key} variant={mode === m.key ? 'primary' : 'outline'} onClick={() => setMode(m.key)}>{m.label}</Button>
              ))}
            </div>
            {mode === 'people' && (
              <div className="space-y-3">
                <label className="relative block">
                  <span className="sr-only">Search people</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone" className="w-full rounded-lg border border-[#E2E8F0] py-2 pl-9 pr-3 text-[13px]" />
                </label>
                {shown.length > 0 && (
                  <ul className="max-h-60 divide-y divide-[#F1F5F9] overflow-y-auto rounded-lg border border-[#E2E8F0]">
                    {shown.map((u) => (
                      <li key={u.id}>
                        <button type="button" className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-[#F8FAFC]"
                          onClick={() => setPeople((p) => (p.some((x) => x.id === u.id) ? p : [...p, u]))}>
                          <span><b>{u.name || u.email}</b> <span className="text-[#94A3B8]">{u.email}</span></span>
                          <Badge tone="quiet">{u.role}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {people.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[12px] font-bold text-[#635BFF]">
                      {p.name || p.email}
                      <button type="button" aria-label={`Remove ${p.name || p.email}`} onClick={() => setPeople((list) => list.filter((x) => x.id !== p.id))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  {people.length === 0 && <span className="text-[12px] text-[#94A3B8]">Nobody chosen yet.</span>}
                </div>
              </div>
            )}
            {mode === 'shop' && (
              <Field label="Shop" hint="The owner and every barber on the team">
                <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-[13px]">
                  <option value="">Choose a shop</option>
                  {(shops.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Field>
            )}
            {mode === 'group' && (
              <Field label="Group">
                <select value={group} onChange={(e) => setGroup(e.target.value as NotifyGroup)} className="mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-[13px]">
                  {(Object.keys(NOTIFY_GROUP_LABELS) as NotifyGroup[]).map((g) => <option key={g} value={g}>{NOTIFY_GROUP_LABELS[g]}</option>)}
                </select>
              </Field>
            )}
            {mode === 'everyone' && <p className="text-[13px] font-semibold text-[#64748B]">Every customer, shop owner and barber (not banned or deleted).</p>}
          </Panel>

          <Panel title="2. Message">
            <div className="space-y-4">
              {result && <p className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-[13px] font-semibold text-[#15803D]">{result}</p>}
              <Field label="Title"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. New: book with any barber" /></Field>
              <Field label="Message" hint={`${body.length}/1000`}><TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={6} maxLength={1000} /></Field>
              <label className="flex items-center gap-2 text-[13px] font-semibold text-[#475569]">
                <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />
                Also send to their phones (push notification)
              </label>
              <FormError message={send.error} />
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => void submit()} disabled={!target || !title.trim() || !body.trim() || send.pending || reach === 0}>
                  <BellRing className="h-4 w-4" /> {send.pending ? 'Sending…' : `Send${reach ? ` to ${reach}` : ''}`}
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </Canvas>
    </>
  );
}
