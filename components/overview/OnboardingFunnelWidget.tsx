'use client';

import React from 'react';
import { CheckCircle2, ChevronRight, AlertTriangle, ArrowRight, Store } from 'lucide-react';
import Link from 'next/link';
import type { Tenant } from '@/lib/api/tenants';
import type { TenantVitals } from '@/lib/api/platform';
import Mark from '@/components/ui/Mark';

interface OnboardingFunnelWidgetProps {
  tenants: Tenant[];
  vitals: Record<string, TenantVitals>;
}

export default function OnboardingFunnelWidget({
  tenants,
  vitals,
}: OnboardingFunnelWidgetProps) {
  const totalTenants = Math.max(1, tenants.length);

  // Calculate funnel stages
  // 1. Signed up: all
  const stage1 = tenants.length;

  // 2. Catalog configured (services > 0)
  const stage2 = tenants.filter((t) => (vitals[t.id]?.services ?? 0) > 0).length;

  // 3. Staff roster assigned (staff > 0)
  const stage3 = tenants.filter((t) => (vitals[t.id]?.staff ?? 0) > 0).length;

  // 4. Took first booking (appointments > 0)
  const stage4 = tenants.filter((t) => (vitals[t.id]?.appointments ?? 0) > 0).length;

  // 5. Active live (both staff + services + listed)
  const stage5 = tenants.filter(
    (t) => (vitals[t.id]?.staff ?? 0) > 0 && (vitals[t.id]?.services ?? 0) > 0,
  ).length;

  const stages = [
    { name: '1. Registered', count: stage1, pct: 100, color: 'bg-[#635BFF]' },
    {
      name: '2. Catalog Ready',
      count: stage2,
      pct: Math.round((stage2 / totalTenants) * 100),
      color: 'bg-[#06B6D4]',
    },
    {
      name: '3. Staff Assigned',
      count: stage3,
      pct: Math.round((stage3 / totalTenants) * 100),
      color: 'bg-[#F59E0B]',
    },
    {
      name: '4. First Booking',
      count: stage4,
      pct: Math.round((stage4 / totalTenants) * 100),
      color: 'bg-[#10B981]',
    },
    {
      name: '5. Fully Operational',
      count: stage5,
      pct: Math.round((stage5 / totalTenants) * 100),
      color: 'bg-[#8B5CF6]',
    },
  ];

  // Identify stalled tenants (stage 1 or 2)
  const stalled = tenants
    .filter((t) => (vitals[t.id]?.services ?? 0) === 0 || (vitals[t.id]?.staff ?? 0) === 0)
    .slice(0, 4);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F1F5F9]">
        <div>
          <h2 className="text-[16px] font-bold text-[#1E293B]">Tenant Onboarding & Activation Funnel</h2>
          <p className="text-[12px] font-medium text-[#94A3B8] mt-0.5">
            Conversion stages from initial shop registration to recurring booking fulfillment
          </p>
        </div>
        <span className="text-xs font-bold text-[#10B981] bg-[#ECFDF5] px-2.5 py-1 rounded-full self-start sm:self-auto">
          {Math.round((stage5 / totalTenants) * 100)}% Conversion Rate
        </span>
      </div>

      {/* Visual Funnel Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-4">
        {stages.map((st, idx) => (
          <div key={st.name} className="relative p-3 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#64748B]">{st.name}</span>
              <span className="text-[11px] font-extrabold text-[#1E293B]">{st.pct}%</span>
            </div>
            <p className="text-[20px] font-extrabold text-[#1E293B] mt-1 tabular-nums">
              {st.count} <span className="text-xs font-normal text-[#94A3B8]">shops</span>
            </p>
            {/* Progress Bar indicator */}
            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full ${st.color} rounded-full transition-all duration-500`}
                style={{ width: `${st.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Actionable Stalled Queue */}
      {stalled.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Shops Stalled in Onboarding ({stalled.length})
            </span>
            <Link
              href="/shops"
              className="text-[11px] font-bold text-[#635BFF] hover:underline flex items-center gap-0.5"
            >
              Assist onboarding <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stalled.map((t) => {
              const v = vitals[t.id];
              const missing = [];
              if (!v || v.services === 0) missing.push('Services');
              if (!v || v.staff === 0) missing.push('Staff');

              return (
                <Link
                  key={t.id}
                  href={`/shops/${t.id}`}
                  className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#635BFF] hover:shadow-xs transition-all bg-white flex items-center gap-3 group"
                >
                  <Mark name={t.name} logoUrl={t.logoUrl} color={t.brandColor} size={28} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[12px] font-bold text-[#1E293B] group-hover:text-[#635BFF] truncate block">
                      {t.name}
                    </span>
                    <span className="text-[10px] font-medium text-[#EF4444] block">
                      Missing: {missing.join(', ')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
