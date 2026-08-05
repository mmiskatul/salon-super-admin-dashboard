"use client";

import React from "react";
import Image from "next/image";
import { useSalon } from "@/context/SalonContext";
import { getScaledSalariesMetrics, salariesKPICardsConfig } from "./data";

export default function SalariesKPICards() {
  const { selectedSalon } = useSalon();
  const metrics = getScaledSalariesMetrics(selectedSalon);

  const formatValue = (key: string, value: number | string): string => {
    if (key === "processedThisMonth") {
      return `€${(value as number).toLocaleString()}`;
    }
    if (key === "avgTime") {
      return `${value} days`;
    }
    return value.toString();
  };

  const getSubtext = (
    key: string,
    defaultSubtext: string,
    metrics: ReturnType<typeof getScaledSalariesMetrics>,
  ): string => {
    if (key === "processedThisMonth") {
      return `${metrics.processedCount} salaries`;
    }
    return defaultSubtext;
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {salariesKPICardsConfig.map((card, idx) => {
        const rawValue = metrics[card.metricKey];
        const displayValue = formatValue(card.metricKey, rawValue);
        const displaySubtext = getSubtext(
          card.metricKey,
          card.subtext,
          metrics,
        );

        return (
          <div
            key={idx}
            className={`relative flex flex-col justify-between overflow-hidden rounded-xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md}`}
            style={{
              background: `linear-gradient(180deg, ${card.gradientColor}21 0%, ${card.gradientColor}08 100%)`,
            }}
          >
            {/* Header: Icon + Title */}
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-sm ${card.iconBg}`}
              >
                <Image
                  src={card.iconSrc}
                  alt={card.iconAlt}
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-[13px] font-bold text-slate-700 tracking-tight leading-snug">
                {card.title}
              </span>
            </div>

            {/* Content: Value + Stats */}
            <div className="mt-8">
              <h3 className="text-[38px] font-bold tracking-tight text-slate-800 leading-none">
                {displayValue}
              </h3>

              <div className="mt-4 flex flex-col gap-0.5">
                <span className="text-[12px] font-bold text-slate-800">
                  {displaySubtext}
                </span>
                {card.change && (
                  <span className="text-[11px] font-semibold text-slate-400 mt-1">
                    {card.change}
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
