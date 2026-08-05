"use client";

import React from "react";
import Image from "next/image";
import { kpiDataBySalon, defaultKpiData } from "./data";

interface KPICardsProps {
  selectedSalon: string;
}

export default function KPICards({ selectedSalon }: KPICardsProps) {
  const stats = kpiDataBySalon[selectedSalon] || defaultKpiData;

  const renderIcon = (
    type: "salaries" | "taxes" | "deadlines" | "warnings",
  ) => {
    switch (type) {
      case "salaries":
        return (
          <Image
            src="/DashboardCardsIcon/SalariesPendingApprovalIcon.png"
            alt="Salaries Pending Approval"
            width={44}
            height={44}
            className="h-full w-full object-contain"
          />
        );
      case "taxes":
        return (
          <Image
            src="/DashboardCardsIcon/TaxesPendingApprovalIcon.png"
            alt="Taxes Pending Approval"
            width={44}
            height={44}
            className="h-full w-full object-contain"
          />
        );
      case "deadlines":
        return (
          <Image
            src="/DashboardCardsIcon/UpcomingDeadlinesIcon.png"
            alt="Upcoming Deadlines"
            width={44}
            height={44}
            className="h-full w-full object-contain"
          />
        );
      case "warnings":
        return (
          <Image
            src="/DashboardCardsIcon/BudgetWarningsIcon.png"
            alt="Budget Warnings"
            width={44}
            height={44}
            className="h-full w-full object-contain"
          />
        );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => {
        return (
          <div
            key={idx}
            className={`
              relative flex flex-col justify-between overflow-hidden rounded-xl border p-6.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md
              ${stat.bgClass}
            `}
          >
            {/* Header: Icon + Title */}
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden ${stat.iconBgClass} shadow-sm`}
              >
                {renderIcon(stat.iconType)}
              </div>
              <span className="text-[13px] font-bold text-slate-700 tracking-tight leading-snug">
                {stat.title}
              </span>
            </div>

            {/* Content: Value + Stats info */}
            <div className="mt-8">
              <h3 className="text-[38px] font-bold tracking-tight text-slate-800 leading-none">
                {stat.value}
              </h3>

              <div className="mt-4 flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-slate-800">
                  {stat.subtext}
                </span>
                {stat.change && (
                  <span className="text-[11px] font-semibold text-slate-400 mt-1">
                    {stat.change}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

