'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Menu, Search, ShieldCheck } from 'lucide-react';
import type { Session } from '@/lib/api-client';
import PeriodFilterBar from '@/components/ui/PeriodFilterBar';

interface HeaderProps {
  session: Session;
  onOpenMobileNav?: () => void;
}

export default function Header({ session, onOpenMobileNav }: HeaderProps) {
  return (
    <header className="h-[70px] md:h-[80px] bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 md:px-8 shrink-0 gap-4 sticky top-0 z-20 font-manrope">
      {/* Left: Mobile toggle & Global Search */}
      <div className="flex items-center gap-3 md:gap-4 w-full max-w-md">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="lg:hidden text-[#64748B] hover:text-[#1E293B] shrink-0 p-1.5 rounded-lg hover:bg-[#F8FAFC]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-full relative">
          <Search className="w-4 h-4 md:w-5 md:h-5 text-[#94A3B8] absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search platform..."
            className="w-full pl-9 md:pl-11 pr-4 py-2 md:py-2.5 rounded-full border border-[#E2E8F0] bg-white text-[13px] md:text-sm focus:outline-none focus:ring-2 focus:ring-[#635BFF] focus:border-transparent font-manrope transition-all placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      {/* Center: Global Period Filter */}
      <div className="hidden md:flex items-center">
        <PeriodFilterBar size="sm" showLabel={true} />
      </div>

      {/* Right: Role indicator, notifications & operator profile */}
      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#EEF2FF] text-[#635BFF] border border-[#E0E7FF] rounded-full text-xs font-bold font-manrope">
          <ShieldCheck className="w-3.5 h-3.5 text-[#635BFF]" />
          <span>Super Admin</span>
        </div>

        <Link
          href="/audit-log"
          className="relative text-[#64748B] hover:text-[#1E293B] transition-colors p-2 rounded-lg hover:bg-[#F8FAFC]"
          title="Audit activity"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] border-2 border-white rounded-full"></span>
        </Link>

        {/* User profile avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-[13px] font-bold text-[#1E293B] leading-tight truncate max-w-[140px]">
              {session.user.name || 'Super Admin'}
            </p>
            <p className="text-[11px] text-[#94A3B8] font-medium truncate max-w-[140px]">
              {session.user.email}
            </p>
          </div>
          <div className="relative">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#E2E8F0] overflow-hidden border border-[#CBD5E1] flex items-center justify-center font-bold text-[#635BFF] bg-[#EEF2FF]">
              {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <span
              className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-[#10B981] border-2 border-white rounded-full"
              title="Online"
            ></span>
          </div>
        </div>
      </div>
    </header>
  );
}
