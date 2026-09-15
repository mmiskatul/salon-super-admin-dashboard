'use client';

import { ImageOff } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { listGallery } from '@/lib/api/profiles';
import { getScheduleRange, type ScheduleDay } from '@/lib/api/schedule';
import { getWorkingHoursFor } from '@/lib/api/workingHours';
import { date as formatDate } from '@/lib/format';
import { Badge, Loading } from './primitives';
import { Modal } from './Form';
import WalletPanel from './WalletPanel';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function inDaysIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Everything about one barber that was previously scattered or missing entirely: their portfolio
 * (public endpoint, no wiring needed), their next 7 days of schedule (SUPER_ADMIN is explicitly
 * unrestricted on staffId — see schedule.controller.ts), and their wallet (same panel the Users
 * roster uses, since a barber is a User). None of this had anywhere to live before — the shop's
 * Barbers tab and the independent-barbers roster were both flat lists with no drill-down at all.
 */
export default function BarberDetailModal({
  userId,
  name,
  onClose,
}: {
  userId: string;
  name: string;
  onClose: () => void;
}) {
  const gallery = useApi(() => listGallery(userId), [userId]);
  const schedule = useApi(() => getScheduleRange(userId, todayIso(), inDaysIso(6)), [userId]);
  const workingHours = useApi(() => getWorkingHoursFor(userId), [userId]);

  return (
    <Modal title={name} note="Portfolio, upcoming schedule, and wallet." onClose={onClose} wide>
      <div className="space-y-5">
        <section>
          <p className="eyebrow mb-2">Portfolio</p>
          {gallery.loading && <Loading label="Loading portfolio" />}
          {gallery.error && <p className="text-[12px] text-ink-3">Could not load a portfolio for this account.</p>}
          {gallery.data && gallery.data.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-rule bg-ground px-3 py-4 text-[12px] text-ink-3">
              <ImageOff size={14} />
              No portfolio photos uploaded.
            </div>
          )}
          {gallery.data && gallery.data.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {gallery.data.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary/user-supplied host
                <img
                  key={photo.id}
                  src={photo.imageUrl}
                  alt=""
                  className="aspect-square w-full rounded-lg border border-rule object-cover"
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="eyebrow mb-2">Next 7 days</p>
          {schedule.loading && <Loading label="Loading schedule" />}
          {schedule.error && <p className="text-[12px] text-[#94A3B8]">Could not load this barber&apos;s schedule.</p>}
          {schedule.data && (
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {schedule.data.map((day: ScheduleDay) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2"
                >
                  <span className="text-[12px] font-semibold text-[#1E293B]">{formatDate(day.date)}</span>
                  {day.slots.length === 0 ? (
                    <span className="text-[11px] text-[#94A3B8]">No slots</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {day.slots.some((s) => s.appointmentId) && (
                        <Badge tone="live">
                          {day.slots.filter((s) => s.appointmentId).length} booked
                        </Badge>
                      )}
                      {day.slots.some((s) => !s.appointmentId && s.kind === 'BLOCKED') && (
                        <Badge tone="signal">
                          {day.slots.filter((s) => !s.appointmentId && s.kind === 'BLOCKED').length} blocked
                        </Badge>
                      )}
                      {day.slots.some((s) => !s.appointmentId && s.kind !== 'BLOCKED') && (
                        <Badge tone="quiet">
                          {day.slots.filter((s) => !s.appointmentId && s.kind !== 'BLOCKED').length} open
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="eyebrow mb-2">Weekly working hours</p>
          {workingHours.loading && <Loading label="Loading working hours" />}
          {workingHours.error && (
            <p className="text-[12px] text-[#94A3B8]">Could not load this barber&apos;s working hours.</p>
          )}
          {workingHours.data && (
            <div className="space-y-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2">
              {workingHours.data.schedule.map((day) => (
                <div key={day.day} className="flex items-center justify-between text-[12px]">
                  <span className={day.isOpen ? 'text-ink' : 'text-ink-3'}>{day.day}</span>
                  {day.isOpen ? (
                    <span className="tabular text-ink-2">
                      {day.startTime} – {day.endTime}
                      {day.breakTime && (
                        <span className="text-ink-3"> (break {day.breakTime}{day.breakEndTime ? `–${day.breakEndTime}` : ''})</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-ink-3">Closed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="eyebrow mb-2">Wallet</p>
          <WalletPanel userId={userId} />
        </section>
      </div>
    </Modal>
  );
}
