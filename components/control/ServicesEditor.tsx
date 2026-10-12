'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useApi, useMutation } from '@/lib/useApi';
import { listAdminServices, updateAdminService, type AdminService } from '@/lib/api/control';
import { money } from '@/lib/format';
import { Badge, Button, Empty, Failed, Loading, Panel } from '@/components/ui/primitives';
import { Scroll, Table, Td, Th, Tr } from '@/components/ui/Table';
import { Field, FormError, Modal, TextArea, TextInput } from '@/components/ui/Form';

/** Every service of a shop or an independent barber (hidden ones too), editable by an admin. */
export default function ServicesEditor({ tenantId, barberId }: { tenantId?: string; barberId?: string }) {
  const list = useApi(() => listAdminServices({ tenantId, barberId }), [tenantId, barberId], 'admin-services');
  const save = useMutation(updateAdminService);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [form, setForm] = useState({ name: '', price: '', duration: '', description: '' });

  function open(s: AdminService) {
    setEditing(s);
    setForm({ name: s.name, price: String(Number(s.price)), duration: String(s.durationMinutes), description: s.description ?? '' });
  }

  async function submit() {
    if (!editing) return;
    const done = await save.mutate(editing.id, {
      name: form.name.trim(),
      price: Number(form.price),
      durationMinutes: Number(form.duration),
      description: form.description.trim() || null,
    });
    if (done) {
      setEditing(null);
      await list.refresh();
    }
  }

  async function toggle(s: AdminService) {
    const verb = s.isActive ? 'Hide' : 'Show';
    if (!window.confirm(`${verb} "${s.name}" ${s.isActive ? 'from' : 'to'} customers?`)) return;
    const done = await save.mutate(s.id, { isActive: !s.isActive });
    if (done) await list.refresh();
  }

  const rows = list.data ?? [];
  return (
    <Panel title="Services (admin edit)" note={`${rows.filter((r) => r.isActive).length} shown to customers · ${rows.filter((r) => !r.isActive).length} hidden · changes go in the audit log`} flush>
      {save.error && <div className="px-5 pt-4"><Failed message={save.error} /></div>}
      {list.loading && !list.data ? (
        <Loading label="Loading services" />
      ) : list.error ? (
        <Failed message={list.error} onRetry={list.refresh} />
      ) : rows.length === 0 ? (
        <Empty title="No services yet" />
      ) : (
        <Scroll>
          <Table>
            <thead><tr><Th>Service</Th><Th>Category</Th><Th align="right">Price</Th><Th align="right">Duration</Th><Th>Shown</Th><Th /></tr></thead>
            <tbody>
              {rows.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <b>{s.name}</b>
                    {s.description && <p className="max-w-[40ch] truncate text-[12px] text-[#94A3B8]">{s.description}</p>}
                  </Td>
                  <Td muted>{s.category?.name ?? '—'}</Td>
                  <Td align="right" nowrap>{money(s.price)}</Td>
                  <Td align="right">{s.durationMinutes} min</Td>
                  <Td>{s.isActive ? <Badge tone="live">Shown</Badge> : <Badge tone="quiet">Hidden</Badge>}</Td>
                  <Td align="right" nowrap>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" onClick={() => open(s)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                      <Button variant={s.isActive ? 'danger' : 'secondary'} onClick={() => void toggle(s)} disabled={save.pending}>{s.isActive ? 'Hide' : 'Show'}</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Scroll>
      )}
      {editing && (
        <Modal title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (৳)"><TextInput type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
              <Field label="Duration (minutes)"><TextInput type="number" min={5} max={600} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
            </div>
            <Field label="Description"><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} maxLength={1000} /></Field>
            <FormError message={save.error} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => void submit()} disabled={save.pending || !form.name.trim()}>{save.pending ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
