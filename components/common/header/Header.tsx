"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Bell, Shield, Grid, Menu } from "lucide-react";
import UserProfile from "./UserProfile";

interface HeaderProps {
  onMenuClick: () => void;
  selectedSalon: string;
  onSalonChange: (salon: string) => void;
}

export default function Header({
  onMenuClick,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white px-4 sm:px-6 lg:px-8 z-10 shrink-0">
      {/* Portal Branding and Search */}
      <div className="flex flex-1 items-center gap-4 lg:gap-8">
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-slate-900 tracking-tight">EGS Portal</span>
        </div>

        <div className="relative w-full max-w-sm hidden sm:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search systems..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full rounded-full border border-slate-200/80 py-2 pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 bg-slate-50/70"
          />
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SYSTEM STATUS: HEALTHY</span>
        </div>

        {/* Shield Icon */}
        <button
          title="Security"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Shield size={18} />
        </button>

        {/* Notifications Bell */}
        <Link
          href="/notifications"
          title="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell size={18} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </Link>

        {/* Grid Switcher Icon */}
        <button
          title="Apps"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Grid size={18} />
        </button>

        {/* User Profile */}
        <UserProfile />
      </div>
    </header>
  );
}
