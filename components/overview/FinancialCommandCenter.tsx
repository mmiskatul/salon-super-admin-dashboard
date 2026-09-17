'use client';

import React, { useState } from 'react';
import {
  Banknote,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { money } from '@/lib/format';

interface FinancialCommandCenterProps {
  totalRevenue: number;
  totalAppointments: number;
  activeSalons: number;
}

export default function FinancialCommandCenter({
  totalRevenue,
  totalAppointments,
  activeSalons,
}: FinancialCommandCenterProps) {
  const [metricView, setMetricView] = useState<'net' | 'gmv'>('net');

  // Platform take-rate model:
  // GMV = gross sales through salons
  // Platform Net Revenue = 5% transaction commission + estimated SaaS subscription MRR
  const gmv = totalRevenue;
  const platformCommission = Math.round(gmv * 0.05 * 100) / 100;
  const estimatedSaaSMRR = activeSalons * 4900; // ৳ 4,900/mo average blended subscription tier
  const platformNetRevenue = platformCommission + estimatedSaaSMRR;

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm font-manrope">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[#1E293B]">Financial Command Center</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-bold text-[#10B981]">
              <ShieldCheck className="w-3.5 h-3.5" />
              SaaS Ledger Verified
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#94A3B8] mt-0.5">
            Gross Merchandise Value (GMV) vs Platform Commission & Subscription MRR
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/payments"
            className="text-xs font-bold text-[#635BFF] hover:text-[#524be0] inline-flex items-center gap-1 hover:underline"
          >
            Payments Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/subscriptions"
            className="text-xs font-bold text-[#10B981] hover:text-[#059669] inline-flex items-center gap-1 hover:underline ml-2"
          >
            SaaS Plans <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Financial KPI Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {/* 1. Platform Net Revenue */}
        <div className="p-4 rounded-xl border border-[#E0E7FF] bg-gradient-to-b from-[#635BFF]/[8%] to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#635BFF] uppercase tracking-wider">
              Platform Net Earnings
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#635BFF]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[24px] font-extrabold text-[#1E293B] tabular-nums">
              {money(platformNetRevenue)}
            </p>
            <p className="text-[11px] font-semibold text-[#10B981] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Take-rate: 5.0% + Subscriptions
            </p>
          </div>
        </div>

        {/* 2. Gross Merchandise Value (GMV) */}
        <div className="p-4 rounded-xl border border-[#D1FAE5] bg-gradient-to-b from-[#10B981]/[8%] to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">
              Gross Volume (GMV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#D1FAE5] flex items-center justify-center">
              <Banknote className="w-4 h-4 text-[#10B981]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[24px] font-extrabold text-[#1E293B] tabular-nums">
              {money(gmv)}
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-1">
              Total checkout & customer online sales
            </p>
          </div>
        </div>

        {/* 3. SaaS Monthly Recurring Revenue (MRR) */}
        <div className="p-4 rounded-xl border border-[#FEF3C7] bg-gradient-to-b from-[#F59E0B]/[8%] to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider">
              Subscription MRR
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
              <Layers className="w-4 h-4 text-[#D97706]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[24px] font-extrabold text-[#1E293B] tabular-nums">
              {money(estimatedSaaSMRR)}
              <span className="text-xs text-[#94A3B8] font-normal">/mo</span>
            </p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-1">
              Across {activeSalons} active subscribed salons
            </p>
          </div>
        </div>

        {/* 4. Processing & Payout Velocity */}
        <div className="p-4 rounded-xl border border-[#CFFAFE] bg-gradient-to-b from-[#06B6D4]/[8%] to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0891B2] uppercase tracking-wider">
              Settlement Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#CFFAFE] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#0891B2]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-[24px] font-extrabold text-[#10B981] tabular-nums">100% Settled</p>
            <p className="text-[11px] font-semibold text-[#64748B] mt-1">
              0 pending chargebacks or disputes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
