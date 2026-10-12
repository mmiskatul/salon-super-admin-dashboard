'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCw, Trash2, X } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { adminDeleteAccount, declineDeletion, getDeletions, type DeletionRequest } from '@/lib/api/control';
import { count, dateTime, since } from '@/lib/format';
import { Badge, Button, Canvas, Empty, Failed, Loading, PageHead, Panel, Stat } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Field, FormError, Modal, TextArea, TextInput } from '@/components/ui/Form';

const ROLE_LABEL: Record<string, string> = { CUSTOMER: 'Customer', BARBER: 'Barber', OWNER: 'Shop owner', STAFF: 'Shop staff' };

/**
 * Account deletion requests and every deleted account. Customers and barbers delete their own
 * account straight away in the app; a shop owner's request comes here, because their shop has to
 * be closed with it.
 */
export default function DeletionsPage() {
  const data = useApi(getDeletions, [], 'deletions');
  const remove = useMutation(adminDeleteAccount);
  const decline = useMutation(declineDeletion);
  const [approving, setApproving] = useState<DeletionRequest | null>(null);
  const [declining, setDeclining] = useState<DeletionRequest | null>(null);
  const [note, setNote] = useState('');
  const [reply, setReply] = useState('');
  const [role, setRole] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const d = data.data;

  async function approve() {
    if (!approving) return;
    const r = await remove.mutate(approving.owner.id, note.trim() || 'Owner asked to delete their account and shop');
    if (r) {
      setDone(`${approving.owner.name ?? approving.owner.email} deleted${r.shopClosed ? `, ${r.shopClosed} closed and ${r.bookingsCancelled} booking(s) cancelled` : ''}.`);
      setApproving(null);
      setNote('');
      await data.refresh();
    }
  }

  async function sendDecline() {
    if (!declining || !reply.trim()) return;
    const r = await decline.mutate(declining.ticketId, reply.trim());
    if (r) {
      setDone('Request closed and the owner was told.');
      setDeclining(null);
      setReply('');
      await data.refresh();
    }
  }

  const pending = d?.requests.filter((r) => r.status === 'PENDING') ?? [];
  const history = d?.requests.filter((r) => r.status !== 'PENDING') ?? [];
  const deleted = (d?.deleted ?? []).filter((u) => !role || u.role === role);
  return (
    <>
      <PageHead
        eyebrow="People"
        title="Account deletions"
        lede="Shop owners' requests to delete their account and shop wait here for you: closing it hides the shop, cancels its upcoming bookings (customers are told) and frees its barbers. Below is every account that has been deleted, by its owner in the app or by SalunBD."
        actions={<Button onClick={data.refresh} disabled={data.loading}><RotateCw className="h-4 w-4" /> Refresh</Button>}
      />
      <Canvas>
        {done && <p className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-[13px] font-semibold text-[#15803D]">{done}</p>}
        {data.error ? (
          <Failed message={data.error} onRetry={data.refresh} />
        ) : !d ? (
          <Loading label="Loading deletion requests" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Requests waiting" value={count(d.pending)} tone={d.pending ? 'signal' : 'live'} />
              <Stat label="Accounts deleted" value={count(d.totals.deleted)} sub={`${d.totals.deletedLast30Days} in the last 30 days`} />
              {d.totals.byRole.filter((r) => r.count).slice(0, 2).map((r) => (
                <Stat key={r.role} label={`${ROLE_LABEL[r.role] ?? r.role}s deleted`} value={count(r.count)} />
              ))}
            </div>

            <Panel title="Waiting for you" note="Shop owners who confirmed with their password that they want their account and shop deleted (promised within 7 days)">
              {pending.length === 0 ? (
                <Empty title="No requests waiting" hint="When a shop owner deletes their account in the app, it appears here." />
              ) : (
                <ul className="divide-y divide-[#F1F5F9]">
                  {pending.map((r) => (
                    <li key={r.ticketId} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[13px]">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/users/${r.owner.id}`} className="font-bold hover:text-[#635BFF]">{r.owner.name ?? r.owner.email}</Link>
                          <Badge tone="warning">Waiting {since(r.requestedAt)}</Badge>
                        </div>
                        <p className="text-[#64748B]">{r.owner.email}{r.owner.phone ? ` · ${r.owner.phone}` : ''}</p>
                        {r.shop && (
                          <p className="text-[#64748B]">
                            Shop: <Link href={`/shops/${r.shop.id}`} className="font-semibold hover:text-[#635BFF]">{r.shop.name}</Link> · {r.upcomingBookings} upcoming booking{r.upcomingBookings === 1 ? '' : 's'} · {r.teamMembers} on the team
                          </p>
                        )}
                        <p className="text-[12px] text-[#94A3B8]">Requested {dateTime(r.requestedAt)} · <Link href="/support" className="underline">support ticket</Link></p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setDeclining(r)}><X className="h-4 w-4" /> Decline</Button>
                        <Button variant="danger" onClick={() => setApproving(r)}><Trash2 className="h-4 w-4" /> Close shop &amp; delete</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {history.length > 0 && (
              <Panel title="Earlier owner requests">
                <ul className="divide-y divide-[#F1F5F9] text-[13px]">
                  {history.map((r) => (
                    <li key={r.ticketId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span><b>{r.owner.name ?? r.owner.email}</b>{r.shop ? ` · ${r.shop.name}` : ''}</span>
                      <span className="flex items-center gap-2">
                        {r.status === 'DONE' ? <Badge tone="live">Deleted</Badge> : <Badge tone="quiet">Declined / closed</Badge>}
                        <span className="text-[#94A3B8]">{dateTime(r.requestedAt)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel
              title={`Deleted accounts (${deleted.length})`}
              note="Their personal data is gone; shops keep past bookings as “Deleted user”"
              actions={
                <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[12px] font-semibold">
                  <option value="">Every role</option>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              }
              flush>
              {deleted.length === 0 ? (
                <Empty title="No deleted accounts" />
              ) : (
                <Scroll>
                  <Table>
                    <thead><tr><Th>Account</Th><Th>Role</Th><Th>Deleted by</Th><Th align="right">Deleted</Th><Th align="right">Joined</Th><Th>Note</Th></tr></thead>
                    <tbody>
                      {deleted.map((u) => (
                        <Tr key={u.id}>
                          <Td mono><Link href={`/users/${u.id}`} className="hover:text-[#635BFF]">{u.id.slice(0, 8)}</Link></Td>
                          <Td>{ROLE_LABEL[u.role] ?? u.role}</Td>
                          <Td>{u.by === 'admin' ? <Badge tone="primary">SalunBD admin</Badge> : <Badge tone="quiet">Themselves (in the app)</Badge>}</Td>
                          <Td align="right" nowrap>{dateTime(u.deletedAt)}</Td>
                          <Td align="right" nowrap muted>{dateTime(u.joinedAt)}</Td>
                          <Td muted>{u.note && u.by === 'admin' ? u.note.replace(/^Account deleted by SalunBD:?\s*/, '') || '—' : '—'}</Td>
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

      {approving && (
        <Modal title={`Close ${approving.shop?.name ?? 'the shop'} and delete ${approving.owner.name ?? 'the owner'}?`} note="The shop is hidden and suspended, its upcoming bookings are cancelled (customers get a notification), its barbers are released, and the owner's personal data is removed. This cannot be undone." onClose={() => setApproving(null)}>
          <div className="space-y-4">
            <Field label="Note (optional)"><TextInput value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Owner asked to delete their account and shop" /></Field>
            <FormError message={remove.error} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApproving(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => void approve()} disabled={remove.pending}>{remove.pending ? 'Working…' : 'Close shop & delete'}</Button>
            </div>
          </div>
        </Modal>
      )}
      {declining && (
        <Modal title="Decline this request?" note="The request is closed and the owner gets your message as a notification and in their support ticket." onClose={() => setDeclining(null)}>
          <div className="space-y-4">
            <Field label="Message to the owner"><TextArea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} maxLength={1000} placeholder="e.g. As discussed on the phone, we kept your shop open. Reply here if you change your mind." /></Field>
            <FormError message={decline.error} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeclining(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => void sendDecline()} disabled={decline.pending || !reply.trim()}>{decline.pending ? 'Sending…' : 'Decline and tell them'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
