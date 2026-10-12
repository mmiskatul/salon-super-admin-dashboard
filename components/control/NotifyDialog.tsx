'use client';

import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useMutation } from '@/lib/useApi';
import { previewNotify, sendNotify, type NotifyTarget } from '@/lib/api/control';
import { Button } from '@/components/ui/primitives';
import { Field, FormError, Modal, TextArea, TextInput } from '@/components/ui/Form';

/** Write and send an in-app (and push) notification to a fixed target: a person, a shop's team,
 *  a group or everyone. Shows how many people it will reach before sending. */
export function NotifyDialog({ target, targetLabel, onClose }: { target: NotifyTarget; targetLabel: string; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [push, setPush] = useState(true);
  const [reach, setReach] = useState<number | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const send = useMutation(sendNotify);
  const targetKey = JSON.stringify(target);

  useEffect(() => {
    let live = true;
    previewNotify(JSON.parse(targetKey) as NotifyTarget)
      .then((r) => live && setReach(r.recipients))
      .catch(() => live && setReach(null));
    return () => {
      live = false;
    };
  }, [targetKey]);

  async function submit() {
    if (!title.trim() || !body.trim()) return;
    const result = await send.mutate({ ...target, title: title.trim(), body: body.trim(), push });
    if (result) setDone(`Sent to ${result.sent} ${result.sent === 1 ? 'person' : 'people'}${push ? ` · ${result.pushDevices} phone${result.pushDevices === 1 ? '' : 's'} can receive push` : ''}.`);
  }

  return (
    <Modal title="Send a notification" note={`To: ${targetLabel}${reach !== null ? ` (${reach} ${reach === 1 ? 'person' : 'people'})` : ''}`} onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <p className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-[13px] font-semibold text-[#15803D]">{done}</p>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Title">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Your shop is almost ready" />
          </Field>
          <Field label="Message">
            <TextArea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={5} placeholder="What do you want them to know?" />
          </Field>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#475569]">
            <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} />
            Also send to their phones (push notification)
          </label>
          <FormError message={send.error} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={() => void submit()} disabled={send.pending || !title.trim() || !body.trim() || reach === 0}>
              <BellRing className="h-4 w-4" /> {send.pending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** A button that opens NotifyDialog for a fixed target. */
export function NotifyButton({ target, targetLabel, label = 'Notify', variant = 'outline' }: { target: NotifyTarget; targetLabel: string; label?: string; variant?: 'primary' | 'secondary' | 'outline' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <BellRing className="h-4 w-4" /> {label}
      </Button>
      {open && <NotifyDialog target={target} targetLabel={targetLabel} onClose={() => setOpen(false)} />}
    </>
  );
}
