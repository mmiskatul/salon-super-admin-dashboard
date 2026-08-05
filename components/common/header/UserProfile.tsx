"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

export default function UserProfile() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={profileDropdownRef}>
      <button
        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
        className="flex items-center gap-2 rounded-xl hover:bg-slate-50 p-1 transition-colors cursor-pointer"
      >
        <div className="h-9 w-9 overflow-hidden rounded-full bg-slate-200 ring-2 ring-slate-100 shrink-0">
          <Image
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="Alex Mercer"
            width={36}
            height={36}
            className="object-cover h-full w-full"
          />
        </div>
        <div className="hidden md:block text-left">
          <h4 className="text-xs font-bold text-slate-900 leading-none">Alex Mercer</h4>
          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">SUPER ADMIN</p>
        </div>
        <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
      </button>

      {profileDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-30">
          <button className="block w-full rounded-xl px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
            Your Profile
          </button>
          <button className="block w-full rounded-xl px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
            Account Settings
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button className="block w-full rounded-xl px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 cursor-pointer">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
