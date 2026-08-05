"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";
import BudgetingKPICards from "./BudgetingKPICards";
import BudgetingWarning from "./BudgetingWarning";
import UpcomingPayments from "./UpcomingPayments";
import LatestTransactions from "./LatestTransactions";
import {
  TotalMonthlyExpensesChart,
  DailySpendingTrendsChart,
  SalonExpensesChart,
  PaymentMethodsChart,
  ExpensesMacroCategoriesChart,
  ExpensesCategoriesChart,
  ExpensesSupplierChart,
} from "./BudgetingCharts";

export default function BudgetingOverview() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleExport = (format: string) => {
    alert(`Exporting budgeting overview as ${format.toUpperCase()}...`);
    setIsExportOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-6 py-4.5 rounded-xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">Overview</h1>
        </div>

        {/* Export Button with Dropdown */}
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-brand/10 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export Monthly Report</span>
            <ChevronDown size={14} />
          </button>
          
          {isExportOpen && (
            <div className="absolute right-0 z-30 mt-2 w-full sm:w-44 bg-white rounded-xl shadow-xl ring-1 ring-slate-100 py-1.5 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => handleExport("pdf")}
                className="w-full text-left px-5 py-2.5 text-xs text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
              >
                PDF
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="w-full text-left px-5 py-2.5 text-xs text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
              >
                CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      <BudgetingWarning />

      {/* KPI Cards */}
      <BudgetingKPICards />

      {/* Row 2: Monthly Expenses & Upcoming Payments */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6">
          <TotalMonthlyExpensesChart />
        </div>
        <div className="xl:col-span-6">
          <UpcomingPayments />
        </div>
      </div>

      {/* Row 3: Daily Spending Trends */}
      <DailySpendingTrendsChart />

      {/* Row 4: Salon Expenses & Payment Methods */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6">
          <SalonExpensesChart />
        </div>
        <div className="xl:col-span-6">
          <PaymentMethodsChart />
        </div>
      </div>

      {/* Row 5: Macro Categories & Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6">
          <ExpensesMacroCategoriesChart />
        </div>
        <div className="xl:col-span-6">
          <ExpensesCategoriesChart />
        </div>
      </div>

      {/* Row 6: Supplier Expenses */}
      <ExpensesSupplierChart />

      {/* Row 7: Latest Transactions Table */}
      <LatestTransactions />
    </div>
  );
}
