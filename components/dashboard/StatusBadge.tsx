"use client";

import React from "react";

interface StatusBadgeProps {
  status: string;
  variant?: "green" | "blue" | "rose" | "amber" | "slate";
  isPulse?: boolean;
}

export default function StatusBadge({
  status,
  variant = "green",
  isPulse = false,
}: StatusBadgeProps) {
  const variantStyles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    blue: "bg-blue-50 text-blue-700 border-blue-200/60",
    rose: "bg-rose-50 text-rose-700 border-rose-200/60",
    amber: "bg-amber-50 text-amber-700 border-amber-200/60",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const dotStyles = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    slate: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${variantStyles[variant]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]} ${
          isPulse ? "animate-pulse" : ""
        }`}
      />
      {status}
    </span>
  );
}
