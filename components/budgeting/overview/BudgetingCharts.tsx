"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import {
  totalMonthlyExpensesData,
  dailySpendingTrendsDataByFilter,
  salonExpensesDataByFilter,
  paymentMethodsDataByFilter,
  expensesMacroCategoriesDataByFilter,
  expensesCategoriesDataByFilter,
  expensesSupplierDataByFilter,
} from "./data";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Center text plugin for Donut Charts
const centerTextPlugin = {
  id: "centerText",
  beforeDraw(chart: any) {
    if (chart.config.type !== "doughnut") return;
    const { ctx, data } = chart;
    const text = data.datasets[0].centerText;
    if (text) {
      ctx.save();
      const x = chart.getDatasetMeta(0).data[0].x;
      const y = chart.getDatasetMeta(0).data[0].y;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.fillStyle = "#1e293b"; // slate-800
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  },
};

interface DropdownSelectorProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

function DropdownSelector({ value, onChange, options }: DropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-500 text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span>{value}</span>
        <ChevronDown size={12} className="text-slate-400" />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-28 bg-white rounded-lg shadow-xl ring-1 ring-slate-100 py-1 animate-in fade-in slide-in-from-top-1">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className="w-full text-left px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 font-semibold transition-colors cursor-pointer"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 1. Total Monthly Expenses Doughnut
export function TotalMonthlyExpensesChart() {
  const chartData = {
    labels: totalMonthlyExpensesData.labels,
    datasets: [
      {
        data: totalMonthlyExpensesData.values,
        backgroundColor: totalMonthlyExpensesData.colors,
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` €${context.raw.toLocaleString()}`,
        },
      },
    },
    cutout: "70%",
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm h-full justify-between gap-4">
      {/* Title */}
      <h3 className="text-sm font-bold text-slate-800 tracking-tight">Total Monthly Expenses</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6 mt-2 flex-1 w-full">
        {/* Info Column */}
        <div className="flex-1 flex flex-col justify-center text-center sm:text-left w-full">
          <span className="text-2xl sm:text-3xl font-black text-slate-800">€ 23,850</span>
          <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-bold text-kpi-teal-text mt-1.5">
            <ArrowUpRight size={14} />
            <span>+12.5%</span>
            <span className="text-slate-400 font-medium">(last month)</span>
          </div>
        </div>

        {/* Chart Column */}
        <div className="h-[140px] w-[140px] relative shrink-0">
          <Doughnut data={chartData} options={options} />
        </div>
      </div>

      {/* Legends Wrap */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 border-t border-slate-50 pt-4">
        {totalMonthlyExpensesData.labels.map((label, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: totalMonthlyExpensesData.colors[idx] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2. Daily Spending Trends Chart (Responsive container, connected dataset)
export function DailySpendingTrendsChart() {
  const [filter, setFilter] = useState("Daily");
  const activeData = dailySpendingTrendsDataByFilter[filter] || dailySpendingTrendsDataByFilter.Daily;
  
  const chartData = {
    labels: activeData.labels,
    datasets: [
      {
        label: "Total Spending",
        data: activeData.values,
        backgroundColor: (context: any) => {
          // Highlight Wednesday (index 3) if Daily, else highlight the last bar
          const highlightIdx = filter === "Daily" ? 3 : activeData.values.length - 1;
          return context.dataIndex === highlightIdx ? "#5c60f5" : "#e0e7ff";
        },
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: filter === "Monthly" ? 18 : 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10, weight: 700 },
        },
      },
      y: {
        grid: { color: "#f8fafc" },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10, weight: 700 },
          callback: (value: any) => {
            if (value === 0) return "€ 0";
            return `€ ${value / 1000}k`;
          },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#94a3b8",
        titleFont: { size: 10, weight: 700 },
        bodyColor: "#ffffff",
        bodyFont: { size: 11, weight: 800 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const idx = context[0].dataIndex;
            return activeData.labels[idx];
          },
          label: (context: any) => {
            const val = context.raw;
            return `Total Spending: €${val.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm w-full h-[360px] justify-between gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Daily Spending Trends</h3>
        <DropdownSelector value={filter} onChange={setFilter} options={["Daily", "Weekly", "Monthly"]} />
      </div>
      {/* Fixed height w-full container ensures Chart.js canvas calculates sizes correctly & remains responsive */}
      <div className="h-[260px] sm:h-[280px] w-full min-w-0">
        <Bar key={filter} data={chartData} options={options as any} />
      </div>
    </div>
  );
}

// 3. Salon Expenses Chart (Connected dataset)
export function SalonExpensesChart() {
  const [filter, setFilter] = useState("Daily");
  const activeData = salonExpensesDataByFilter[filter] || salonExpensesDataByFilter.Daily;

  const chartData = {
    labels: activeData.labels,
    datasets: [
      {
        data: activeData.values,
        backgroundColor: "#5c60f5",
        borderRadius: 5,
        maxBarThickness: 20,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 9, weight: 700 },
        },
      },
      y: {
        display: false,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` €${context.raw.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm h-[320px] justify-between gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Salon Expenses</h3>
        <DropdownSelector value={filter} onChange={setFilter} options={["Daily", "Weekly", "Monthly"]} />
      </div>
      <div className="h-[220px] sm:h-[240px] w-full min-w-0">
        <Bar key={filter} data={chartData} options={options as any} />
      </div>
    </div>
  );
}

// 4. Payment Methods Chart (Connected dataset)
export function PaymentMethodsChart() {
  const [filter, setFilter] = useState("Daily");
  const activeData = paymentMethodsDataByFilter[filter] || paymentMethodsDataByFilter.Daily;

  const chartData = {
    labels: activeData.labels,
    datasets: [
      {
        data: activeData.values,
        backgroundColor: activeData.colors,
        borderWidth: 0,
        centerText: activeData.centerText,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` $${context.raw.toLocaleString()}`,
        },
      },
    },
    cutout: "70%",
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm h-[320px] justify-between gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Payment Methods</h3>
        <DropdownSelector value={filter} onChange={setFilter} options={["Daily", "Weekly", "Monthly"]} />
      </div>
      <div className="h-[140px] w-full relative flex items-center justify-center">
        <div className="h-[140px] w-[140px]">
          <Doughnut key={filter} data={chartData} options={options} plugins={[centerTextPlugin]} />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-slate-50 pt-3">
        {activeData.labels.map((label, idx) => (
          <div key={idx} className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: activeData.colors[idx] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Expenses per Macro-categories (Connected dataset)
export function ExpensesMacroCategoriesChart() {
  const [filter, setFilter] = useState("Daily");
  const activeData = expensesMacroCategoriesDataByFilter[filter] || expensesMacroCategoriesDataByFilter.Daily;

  const chartData = {
    labels: activeData.labels,
    datasets: [
      {
        data: activeData.values,
        backgroundColor: activeData.colors,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` €${context.raw.toLocaleString()}`,
        },
      },
    },
    cutout: "70%",
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm h-[320px] justify-between gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Expenses per Macro-categories</h3>
        <DropdownSelector value={filter} onChange={setFilter} options={["Daily", "Weekly", "Monthly"]} />
      </div>
      <div className="h-[140px] w-full relative flex items-center justify-center">
        <div className="h-[140px] w-[140px]">
          <Doughnut key={filter} data={chartData} options={options} />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 border-t border-slate-50 pt-3">
        {activeData.labels.map((label, idx) => (
          <div key={idx} className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: activeData.colors[idx] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Expenses per Categories (Connected dataset)
export function ExpensesCategoriesChart() {
  const [filter, setFilter] = useState("Products");
  const activeData = expensesCategoriesDataByFilter[filter] || expensesCategoriesDataByFilter.Products;

  const chartData = {
    labels: activeData.labels,
    datasets: [
      {
        data: activeData.values,
        backgroundColor: "#5c60f5",
        borderRadius: 4,
        maxBarThickness: 16,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 9, weight: 700 },
        },
      },
      y: {
        grid: { color: "#f8fafc" },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 9, weight: 700 },
          callback: (value: any) => `€ ${value / 1000}k`,
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm h-[320px] justify-between gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Expenses per Categories</h3>
        <DropdownSelector value={filter} onChange={setFilter} options={["Products", "Services", "Salons"]} />
      </div>
      <div className="h-[220px] sm:h-[240px] w-full min-w-0">
        <Bar key={filter} data={chartData} options={options as any} />
      </div>
    </div>
  );
}

// 7. Expenses per Supplier (Connected dataset)
export function ExpensesSupplierChart() {
  const [filter, setFilter] = useState("Daily");
  const activeData = expensesSupplierDataByFilter[filter] || expensesSupplierDataByFilter.Daily;

  const chartData = {
    labels: activeData.labels,
    datasets: [
      {
        data: activeData.values,
        backgroundColor: "#5c60f5",
        borderRadius: 5,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10, weight: 700 },
        },
      },
      y: {
        grid: { color: "#f8fafc" },
        border: { display: false },
        ticks: {
          color: "#94a3b8",
          font: { size: 10, weight: 700 },
          callback: (value: any) => `€ ${value / 1000}k`,
        },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm h-[340px] justify-between gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Expenses per Supplier</h3>
        <DropdownSelector value={filter} onChange={setFilter} options={["Daily", "Weekly", "Monthly"]} />
      </div>
      <div className="h-[240px] sm:h-[260px] w-full min-w-0">
        <Bar key={filter} data={chartData} options={options as any} />
      </div>
    </div>
  );
}
