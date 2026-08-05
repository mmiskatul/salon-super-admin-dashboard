"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useSalon } from "@/context/SalonContext";

export default function BudgetingWarning() {
  const { selectedSalon } = useSalon();
  const [isVisible, setIsVisible] = useState(true);

  // Reset visibility when the selected salon changes, so the user sees the new warning
  useEffect(() => {
    setIsVisible(true);
  }, [selectedSalon]);

  if (!isVisible) return null;

  const getWarningMessage = () => {
    switch (selectedSalon) {
      case "Style Studio":
        return `Warning – At Salon "Style Studio" you are about to exceed 70% of your budget.`;
      case "Chic Hair & Beauty":
        return `Warning – At Salon "Chic Hair & Beauty" you have reached 92% of your monthly budget allocation.`;
      case "Glamour Beauty":
      case "All Salons":
      default:
        return `Warning – At Salon "Glamour Beauty" you are about to exceed 85% of your budget.`;
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-kpi-yellow-bg border border-kpi-yellow-icon-bg/70 rounded-xl px-5 py-4 shadow-sm text-xs font-bold text-kpi-yellow-text animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="text-kpi-yellow-text shrink-0 animate-bounce" />
        <span className="leading-normal">
          {getWarningMessage()}
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="p-1 rounded-lg text-kpi-yellow-text hover:bg-kpi-yellow-icon-bg/50 transition-colors cursor-pointer shrink-0"
        title="Dismiss warning"
      >
        <X size={14} />
      </button>
    </div>
  );
}
