"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface DashboardHeaderProps {
  category?: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}

export default function DashboardHeader({
  category,
  title,
  subtitle,
  showBack = true,
  backHref = "/",
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-3">
      {showBack && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard Hub
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {category && (
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 block mb-0.5">
              {category}
            </span>
          )}
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs lg:text-sm font-medium text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
