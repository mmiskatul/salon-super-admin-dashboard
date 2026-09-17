'use client';

import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CalendarCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { PlatformTotals } from '@/lib/api/platform';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BookingOutcomesChartProps {
  totals: PlatformTotals;
}

export default function BookingOutcomesChart({ totals }: BookingOutcomesChartProps) {
  const total = Math.max(1, totals.appointments);
  const completed = totals.completed;
  const upcoming = totals.upcoming;
  const cancelled = totals.cancelled;
  const openOrOther = Math.max(0, totals.appointments - completed - upcoming - cancelled);

  const completedPct = Math.round((completed / total) * 100);
  const upcomingPct = Math.round((upcoming / total) * 100);
  const cancelledPct = Math.round((cancelled / total) * 100);
  const otherPct = Math.max(0, 100 - completedPct - upcomingPct - cancelledPct);

  const chartData = {
    labels: ['Completed', 'Upcoming / Confirmed', 'Cancelled', 'Open / In-Service'],
    datasets: [
      {
        data: [completed, upcoming, cancelled, openOrOther],
        backgroundColor: ['#10B981', '#635BFF', '#EF4444', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '76%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleFont: { family: 'Manrope', size: 12, weight: '700' },
        bodyFont: { family: 'Manrope', size: 11, weight: '600' },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} (${Math.round((ctx.raw / total) * 100)}%)`,
        },
      },
    },
  };

  const outcomes = [
    {
      label: 'Completed',
      count: completed,
      pct: completedPct,
      color: 'bg-[#10B981]',
      textColor: 'text-[#10B981]',
      icon: CheckCircle2,
    },
    {
      label: 'Upcoming / Confirmed',
      count: upcoming,
      pct: upcomingPct,
      color: 'bg-[#635BFF]',
      textColor: 'text-[#635BFF]',
      icon: Clock,
    },
    {
      label: 'Cancelled / No-show',
      count: cancelled,
      pct: cancelledPct,
      color: 'bg-[#EF4444]',
      textColor: 'text-[#EF4444]',
      icon: XCircle,
    },
    {
      label: 'Open / In-Service',
      count: openOrOther,
      pct: otherPct,
      color: 'bg-[#F59E0B]',
      textColor: 'text-[#F59E0B]',
      icon: CalendarCheck,
    },
  ];

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
      <div className="pb-4 border-b border-[#F1F5F9]">
        <h2 className="text-[16px] font-bold text-[#1E293B]">Booking Outcome Breakdown</h2>
        <p className="text-[12px] font-medium text-[#94A3B8] mt-0.5">
          System-wide appointment fulfillment and retention rates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 pt-5">
        {/* Doughnut with center stat */}
        <div className="relative h-[200px] flex items-center justify-center">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[26px] font-extrabold text-[#1E293B] tabular-nums leading-none">
              {totals.appointments}
            </span>
            <span className="text-[11px] font-bold text-[#64748B] mt-1 uppercase tracking-wider">
              Total Bookings
            </span>
          </div>
        </div>

        {/* Legend / Metrics List */}
        <div className="space-y-3">
          {outcomes.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                <span className="text-[13px] font-bold text-[#1E293B]">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-extrabold text-[#1E293B] tabular-nums">
                  {item.count}
                </span>
                <span className={`text-[11px] font-bold ${item.textColor} w-10 text-right`}>
                  {item.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
