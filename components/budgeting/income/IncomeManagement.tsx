"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import {
  dateOptions,
  employeeOptions,
  servicesOptions,
  paymentMethodOptions,
  initialKpis,
  CashierClosureRow,
} from "./data";
import IncomeKPICards from "./IncomeKPICards";
import {
  RevenueDetailModal,
  AverageReceiptAnalysisModal,
  CashierClosureModal,
} from "./IncomeModals";
import {
  EmployeePerformanceChart,
  Last7DaysTrendsChart,
  MostRequestedServicesChart,
  RevenueDistributionChart,
} from "./IncomeCharts";
import IncomeTable from "./IncomeTable";

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  isDate?: boolean;
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
  isDate,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex flex-col gap-1.5 w-full" ref={dropdownRef}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-slate-200 bg-white text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer text-left shadow-sm min-h-[38px]"
      >
        <span className="truncate">
          {value === "All" ? placeholder || "All" : value}
        </span>
        {isDate ? (
          <Calendar size={14} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronDown
            size={14}
            className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-[66px] bg-white rounded-xl shadow-xl ring-1 ring-slate-100 py-1.5 max-h-56 overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-top-2">
          {options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                opt === value
                  ? "bg-brand/5 text-[#5c60f5]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {opt === "All" ? placeholder || "All" : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IncomeManagement() {
  const [selectedDate, setSelectedDate] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState("All");
  const [selectedService, setSelectedService] = useState("All");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("All");

  const [activeModal, setActiveModal] = useState<"revenue" | "average" | "closure" | null>(null);
  const [selectedClosure, setSelectedClosure] = useState<CashierClosureRow | null>(null);

  return (
    <div className="space-y-6">
      {/* Top Header & Filters Box */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-black text-slate-800 tracking-tight">
            Income & Revenue
          </h1>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-50 pt-5">
          {/* Date Selector */}
          <FilterDropdown
            label="Date"
            value={selectedDate}
            options={dateOptions}
            onChange={setSelectedDate}
            placeholder="All"
            isDate={true}
          />

          {/* Employee Selector */}
          <FilterDropdown
            label="Employee"
            value={selectedEmployee}
            options={employeeOptions}
            onChange={setSelectedEmployee}
            placeholder="All"
          />

          {/* Services Selector */}
          <FilterDropdown
            label="Services"
            value={selectedService}
            options={servicesOptions}
            onChange={setSelectedService}
            placeholder="All"
          />

          {/* Payment Method Selector */}
          <FilterDropdown
            label="Payment Method"
            value={selectedPaymentMethod}
            options={paymentMethodOptions}
            onChange={setSelectedPaymentMethod}
            placeholder="All"
          />
        </div>
      </div>

      {/* KPI Cards Widget */}
      <IncomeKPICards
        selectedDate={selectedDate}
        selectedEmployee={selectedEmployee}
        selectedService={selectedService}
        selectedPaymentMethod={selectedPaymentMethod}
        onOpenRevenueModal={() => setActiveModal("revenue")}
        onOpenAverageModal={() => setActiveModal("average")}
      />

      {/* Row 1 Charts: Last 7 Days Trends & Employee Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Last7DaysTrendsChart filter={selectedDate} />
        <EmployeePerformanceChart filter={selectedEmployee} />
      </div>

      {/* Row 2 Charts: Most Requested Services & Revenue Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MostRequestedServicesChart filter={selectedService} />
        <RevenueDistributionChart filter={selectedPaymentMethod} />
      </div>

      {/* Bottom Table: Closures & Latest Receipts */}
      <IncomeTable
        selectedDate={selectedDate}
        selectedEmployee={selectedEmployee}
        selectedService={selectedService}
        selectedPaymentMethod={selectedPaymentMethod}
        onSelectClosure={(row) => {
          setSelectedClosure(row);
          setActiveModal("closure");
        }}
      />

      {/* Modals overlay */}
      <RevenueDetailModal
        isOpen={activeModal === "revenue"}
        onClose={() => setActiveModal(null)}
        totalRevenue={initialKpis.totalRevenue}
        uniqueCustomers={initialKpis.uniqueCustomers}
      />

      <AverageReceiptAnalysisModal
        isOpen={activeModal === "average"}
        onClose={() => setActiveModal(null)}
        averageReceipt={initialKpis.averageReceipt}
      />

      <CashierClosureModal
        isOpen={activeModal === "closure"}
        onClose={() => {
          setActiveModal(null);
          setSelectedClosure(null);
        }}
        closure={selectedClosure}
      />
    </div>
  );
}
