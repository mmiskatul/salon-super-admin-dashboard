'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHead } from '@/components/ui/primitives';
import BookingsBoard from '@/components/bookings/BookingsBoard';
import DayManager from '@/components/bookings/DayManager';
import type { CancelGroup } from '@/lib/api/insights';

const CANCEL_GROUPS: CancelGroup[] = ['CUSTOMER', 'SHOP', 'SYSTEM', 'ADMIN'];
type Tab = 'board' | 'day';

function BookingsPageInner() {
  const params = useSearchParams();
  const linked = params.get('cancelledBy');
  const initialCancelledBy = CANCEL_GROUPS.includes(linked as CancelGroup) ? (linked as CancelGroup) : undefined;
  const [tab, setTab] = useState<Tab>('board');
  return (
    <>
      <PageHead
        eyebrow="Bookings"
        title="Bookings"
        lede="Every booking on SalunBD: charts of what happened, who cancelled, when and why, how shops and services compare, and the full list with each booking's timeline. Use Day view to manage a booking."
        actions={
          <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5" role="tablist" aria-label="Bookings view">
            {([
              ['board', 'Analytics & all bookings'],
              ['day', 'Day view & manage'],
            ] as const).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${tab === key ? 'bg-[#635BFF] text-white' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
                {label}
              </button>
            ))}
          </div>
        }
      />
      {tab === 'board' ? (
        <div className="space-y-5 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full font-manrope">
          <BookingsBoard initialCancelledBy={initialCancelledBy} />
        </div>
      ) : (
        <DayManager />
      )}
    </>
  );
}

export default function BookingsPage() {
  // useSearchParams needs a Suspense boundary when the page is prerendered.
  return (
    <Suspense fallback={null}>
      <BookingsPageInner />
    </Suspense>
  );
}
