'use client';

import { useEffect } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-ink/45" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full rounded-lg border border-rule bg-surface shadow-xl ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">
          <div>
            <h2 className="font-display text-[17px] font-bold tracking-[-0.02em]">{title}</h2>
            {note && <p className="mt-1 max-w-[52ch] text-[12px] leading-relaxed text-ink-2">{note}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="mt-0.5 text-ink-3 hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
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
    <label className="block">
      <span className="eyebrow !text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-relaxed text-ink-3">{hint}</span>}
    </label>
  );
}

const CONTROL =
  'mt-1.5 w-full rounded-lg border border-rule bg-surface px-2.5 py-2 text-[13px] text-ink placeholder:text-ink-3 focus:border-primary focus:outline-none';

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
    <p role="alert" className="rounded-lg border border-signal/25 bg-signal-soft px-3 py-2 text-[12px] text-signal">
      {message}
    </p>
  );
}
