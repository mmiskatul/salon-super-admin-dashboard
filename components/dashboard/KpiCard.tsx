"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  change?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
  iconBg?: string;
  isDark?: boolean;
  highlight?: boolean;
  textClass?: string;
}

export default function KpiCard({
  label,
  value,
  subtext,
  change,
  isPositive = true,
  icon: Icon,
  iconBg = "bg-blue-50 text-blue-600",
  isDark = false,
  highlight = false,
  textClass,
}: KpiCardProps) {
  if (isDark) {
    return (
      <div className="bg-[#242b35] text-white rounded-2xl p-5 shadow-2xs space-y-1.5 flex flex-col justify-between">
        <span className="text-[9px] font-extrabold tracking-wider uppercase text-slate-400">
          {label}
        </span>
        <div>
          <p className="text-2xl font-black tracking-tight">{value}</p>
          {subtext && <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtext}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border p-4.5 shadow-2xs space-y-2 flex flex-col justify-between transition-all hover:shadow-md ${
        highlight
          ? "border-blue-300 ring-2 ring-blue-500/10"
          : "border-slate-100/80"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
          {label}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl ${iconBg} shadow-2xs`}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div>
        <span className={`text-xl lg:text-2xl font-black tracking-tight ${textClass || "text-slate-900"}`}>
          {value}
        </span>
        {change && (
          <p className={`text-xs font-bold mt-0.5 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {change}
          </p>
        )}
        {subtext && !change && (
          <p className="text-xs font-medium text-slate-400 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}
