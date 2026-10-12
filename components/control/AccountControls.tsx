'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Pencil, Trash2 } from 'lucide-react';
import { useMutation } from '@/lib/useApi';
import { adminDeleteAccount, adminSignOut, adminUpdateAccount } from '@/lib/api/control';
import { Badge, Button, Panel } from '@/components/ui/primitives';
import { Field, FormError, Modal, TextInput } from '@/components/ui/Form';
import { NotifyButton } from './NotifyDialog';

interface AccountLike {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  name?: string | null;
  phone?: string | null;
  deletedAt?: string | null;
}

/** Edit an account's details, sign it out everywhere, notify it, or delete it. */
export default function AccountControls({ user, onChanged }: { user: AccountLike; onChanged: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: user.name ?? '', phone: user.phone ?? '', email: user.email, emailVerified: user.emailVerified });
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const save = useMutation(adminUpdateAccount);
  const signOut = useMutation(adminSignOut);
  const remove = useMutation(adminDeleteAccount);
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  const deleted = !!user.deletedAt || user.email.endsWith('@deleted.invalid');

  async function submitEdit() {
    const body: { name?: string; phone?: string; email?: string; emailVerified?: boolean } = {};
    if (form.name.trim() !== (user.name ?? '')) body.name = form.name.trim();
    if (form.phone.trim() !== (user.phone ?? '')) body.phone = form.phone.trim();
    if (form.email.trim().toLowerCase() !== user.email) body.email = form.email.trim();
    if (form.emailVerified !== user.emailVerified) body.emailVerified = form.emailVerified;
    if (!Object.keys(body).length) return setEditing(false);
    const done = await save.mutate(user.id, body);
    if (done) {
      setEditing(false);
      setMessage('Account details saved.');
      onChanged();
    }
  }

  async function submitDelete() {
    const done = await remove.mutate(user.id, note.trim() || undefined);
    if (done) {
      setDeleting(false);
      setMessage(done.shopClosed ? `Account deleted. ${done.shopClosed} was closed and ${done.bookingsCancelled} upcoming booking(s) cancelled.` : 'Account deleted.');
      onChanged();
      router.refresh();
    }
  }

  return (
    <Panel title="Account controls" note="Every change here is recorded in the audit log" actions={deleted ? <Badge tone="signal">Deleted</Badge> : null}>
      {message && <p className="mb-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-[13px] font-semibold text-[#15803D]">{message}</p>}
      <FormError message={signOut.error} />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)} disabled={deleted}><Pencil className="h-4 w-4" /> Edit details</Button>
        <NotifyButton target={{ userIds: [user.id] }} targetLabel={user.name || user.email} label="Send notification" />
        <Button
          variant="outline"
          disabled={deleted || signOut.pending}
          onClick={async () => {
            if (!window.confirm('Sign this person out on every device? They will need to sign in again.')) return;
            const r = await signOut.mutate(user.id);
            if (r) setMessage(`Signed out of ${r.sessionsEnded} session${r.sessionsEnded === 1 ? '' : 's'}.`);
          }}>
          <LogOut className="h-4 w-4" /> Sign out everywhere
        </Button>
        {!isAdmin && (
          <Button variant="danger" onClick={() => setDeleting(true)} disabled={deleted}><Trash2 className="h-4 w-4" /> Delete account</Button>
        )}
      </div>

      {editing && (
        <Modal title="Edit account" note="Name and phone are shown in the apps. Changing the email changes how they sign in." onClose={() => setEditing(false)}>
          <div className="space-y-4">
            <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></Field>
            <Field label="Phone" hint="11 digits, e.g. 01711000000. Leave empty to remove."><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" maxLength={14} /></Field>
            <Field label="Email (sign-in)"><TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-[13px] font-semibold text-[#475569]">
              <input type="checkbox" checked={form.emailVerified} onChange={(e) => setForm({ ...form, emailVerified: e.target.checked })} />
              Email verified
            </label>
            <FormError message={save.error} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => void submitEdit()} disabled={save.pending}>{save.pending ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal
          title="Delete this account?"
          note={
            user.role === 'OWNER'
              ? 'Their shop is closed too: hidden and suspended, upcoming bookings cancelled (customers are told), and its barbers released to work on their own. This cannot be undone.'
              : 'Their profile, photos, contact details, favourites and sign-ins are removed and their upcoming bookings cancelled. Shops keep past booking records as "Deleted user". This cannot be undone.'
          }
          onClose={() => setDeleting(false)}>
          <div className="space-y-4">
            <Field label="Note (optional)" hint="Kept with the account record and the audit log."><TextInput value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Asked by phone on 12 Oct" /></Field>
            <FormError message={remove.error} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => void submitDelete()} disabled={remove.pending}>{remove.pending ? 'Deleting…' : 'Delete account'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
