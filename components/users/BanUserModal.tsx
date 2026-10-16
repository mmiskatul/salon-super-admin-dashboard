'use client';

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { Modal, FormError } from '@/components/ui/Form';
import { Button } from '@/components/ui/primitives';
import type { PlatformUser } from '@/lib/api/users';

const BAN_REASON_PRESETS = [
  'Repeated no-shows and fraudulent appointments',
  'Terms of Service / Acceptable Use Policy violation',
  'Harassment or abusive conduct reported against users/stylists',
  'Suspicious transaction / payment fraud',
  'Impersonation or falsified profile details',
];

interface BanUserModalProps {
  user: PlatformUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBan: (userId: string, reason: string) => Promise<void>;
}

export function BanUserModal({ user, isOpen, onClose, onConfirmBan }: BanUserModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  async function handleBan() {
    if (!user) return;
    try {
      setSubmitting(true);
      setError(null);
      await onConfirmBan(user.id, reason.trim() || 'Terms of Service violation');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to ban user account.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={`Suspend / Ban Account: ${user.name || user.email}`}
      note="Suspending an account revokes access across customer, barber, and salon apps immediately."
      onClose={submitting ? () => {} : onClose}
    >
      <div className="space-y-4 font-manrope">
        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3]">
          <ShieldAlert className="h-5 w-5 text-[#E11D48] shrink-0 mt-0.5" />
          <div className="text-[13px] text-[#9F1239]">
            <p className="font-bold">Are you sure you want to suspend this account?</p>
            <p className="mt-0.5 text-[12px] text-[#BE123C]">
              User <b className="text-[#9F1239]">{user.email}</b> will be logged out of all active sessions and prohibited from logging in or booking services.
            </p>
          </div>
        </div>

        {error && <FormError message={error} />}

        <div className="space-y-2">
          <label className="block text-[12px] font-bold text-[#1E293B]">
            Reason for Suspension:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify reason for account audit trail and user notice..."
            rows={3}
            className="w-full rounded-xl border border-[#CBD5E1] p-3 text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
          />

          <div className="pt-1">
            <span className="block text-[11px] font-bold uppercase text-[#64748B] mb-1.5">
              Or pick common reason:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {BAN_REASON_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="rounded-lg border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-1 text-[11px] font-semibold text-[#475569] hover:bg-[#EEF2FF] hover:border-[#635BFF]/40 hover:text-[#635BFF] transition-all cursor-pointer text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#E2E8F0] pt-4">
          <Button onClick={onClose} disabled={submitting} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleBan}
            disabled={submitting}
            className="bg-[#EF4444] text-white hover:bg-[#DC2626] cursor-pointer"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {submitting ? 'Suspending...' : 'Confirm Suspension'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface UnbanUserModalProps {
  user: PlatformUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmUnban: (userId: string) => Promise<void>;
}

export function UnbanUserModal({ user, isOpen, onClose, onConfirmUnban }: UnbanUserModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  async function handleUnban() {
    if (!user) return;
    try {
      setSubmitting(true);
      setError(null);
      await onConfirmUnban(user.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unban user account.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={`Reactivate / Unban Account: ${user.name || user.email}`}
      note="Reinstating an account restores platform access and allows the user to log in again."
      onClose={submitting ? () => {} : onClose}
    >
      <div className="space-y-4 font-manrope">
        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
          <ShieldCheck className="h-5 w-5 text-[#16A34A] shrink-0 mt-0.5" />
          <div className="text-[13px] text-[#14532D]">
            <p className="font-bold">Reactivate user access</p>
            <p className="mt-0.5 text-[12px] text-[#15803D]">
              This will remove the ban on <b className="text-[#14532D]">{user.email}</b>. They will be able to log in, book appointments, or manage salons normally.
            </p>
          </div>
        </div>

        {error && <FormError message={error} />}

        <div className="flex items-center justify-end gap-2.5 border-t border-[#E2E8F0] pt-4">
          <Button onClick={onClose} disabled={submitting} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleUnban}
            disabled={submitting}
            className="bg-[#16A34A] text-white hover:bg-[#15803D] cursor-pointer"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {submitting ? 'Reactivating...' : 'Reactivate Account'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
