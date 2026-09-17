'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  loadPlatformCharts,
  loadPlatformOverview,
  setSelectedPeriod,
} from '@/lib/redux/slices/platformSlice';
import type { PlatformPeriod } from '@/lib/api/platform';

interface PeriodFilterBarProps {
  size?: 'sm' | 'default';
  showLabel?: boolean;
  className?: string;
}

const PERIOD_OPTIONS: { key: PlatformPeriod; label: string; shortLabel: string }[] = [
  { key: 'Daily', label: 'Day', shortLabel: 'Day' },
  { key: 'Weekly', label: 'Weekly', shortLabel: 'Week' },
  { key: 'Monthly', label: 'Monthly', shortLabel: 'Month' },
  { key: 'Yearly', label: 'Yearly', shortLabel: 'Year' },
];

export default function PeriodFilterBar({
  size = 'default',
  showLabel = false,
  className = '',
}: PeriodFilterBarProps) {
  const dispatch = useAppDispatch();
  const { selectedPeriod, charts } = useAppSelector((state) => state.platform);

  const handleSelect = (period: PlatformPeriod) => {
    if (period === selectedPeriod) return;
    dispatch(setSelectedPeriod(period));
    dispatch(loadPlatformOverview(period));
    if (!charts[period.toLowerCase()]) {
      dispatch(loadPlatformCharts(period));
    }
  };

  const isSm = size === 'sm';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
          <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>Timeline:</span>
        </div>
      )}
      <div
        className={`inline-flex items-center bg-[#F1F5F9] rounded-lg p-0.5 border border-[#E2E8F0]/60 ${
          isSm ? 'gap-0.5' : 'gap-1'
        }`}
        role="tablist"
        aria-label="Platform Time Range Filter"
      >
        {PERIOD_OPTIONS.map((p) => {
          const isActive = selectedPeriod === p.key;
          return (
            <button
              key={p.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelect(p.key)}
              className={`transition-all rounded-md cursor-pointer select-none ${
                isSm
                  ? 'px-2.5 py-1 text-[11px] font-bold'
                  : 'px-3 py-1.5 text-[12px] md:text-[13px] font-bold'
              } ${
                isActive
                  ? 'bg-white text-[#635BFF] shadow-xs border border-[#E2E8F0]/40'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/40'
              }`}
            >
              <span className="sm:hidden">{p.shortLabel}</span>
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
