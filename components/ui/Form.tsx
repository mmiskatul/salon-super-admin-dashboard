'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  title,
  note,
  onClose,
  children,
  wide,
}: {
  title: string;
  note?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  // Escape closes, and the page behind stops scrolling while a dialog is up.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8 font-manrope">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 bg-[#1E293B]/50 backdrop-blur-xs transition-opacity"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full rounded-xl border border-[#E2E8F0] bg-white shadow-2xl overflow-hidden my-auto ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5 bg-[#F8F9FE]">
          <div>
            <h2 className="text-[18px] font-extrabold text-[#1E293B] tracking-tight font-manrope">{title}</h2>
            {note && <p className="mt-1 max-w-[52ch] text-[13px] text-[#64748B] font-medium leading-relaxed">{note}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#E2E8F0]/50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block font-manrope">
      <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] font-medium text-[#94A3B8]">{hint}</span>}
    </label>
  );
}

const CONTROL =
  'mt-1.5 w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-[13px] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all shadow-xs';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${CONTROL} ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${CONTROL} ${props.className ?? ''}`} />;
}

/** Inline error text for a form that failed to submit. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-[12px] font-semibold text-[#EF4444] font-manrope">
      {message}
    </p>
  );
}

