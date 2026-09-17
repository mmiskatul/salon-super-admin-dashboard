'use client';

import React from 'react';
import { AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';
import { Modal, FormError } from './Form';
import { Button } from './primitives';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  pending = false,
  error = null,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <Modal title={title} onClose={pending ? () => {} : onClose}>
      <div className="space-y-4 font-manrope">
        <div className="flex items-start gap-3.5">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              variant === 'danger'
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : 'bg-indigo-50 text-[#635BFF] border border-indigo-100'
            }`}
          >
            {variant === 'danger' ? (
              <AlertTriangle size={18} strokeWidth={2.2} />
            ) : (
              <HelpCircle size={18} strokeWidth={2.2} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] leading-relaxed text-[#475569] font-medium">
              {description}
            </div>
          </div>
        </div>

        {error && <FormError message={error} />}

        <div className="flex items-center justify-end gap-2.5 border-t border-[#E2E8F0] pt-4">
          <Button onClick={onClose} disabled={pending} variant="outline">
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            disabled={pending}
            className="cursor-pointer"
          >
            {pending && <Loader2 size={13} className="animate-spin" />}
            {pending ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
