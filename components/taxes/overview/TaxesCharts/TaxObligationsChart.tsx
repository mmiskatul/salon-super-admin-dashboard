"use client";

import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { taxObligationsDataByYear } from "./data";
import YearSelect from "@/components/common/YearSelect";
import ExportModal from "@/components/common/ExportModal";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export default function TaxObligationsChart() {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const activeData = taxObligationsDataByYear[selectedYear] || taxObligationsDataByYear["2025"];

  const chartData = {
    labels: activeData.map((d) => d.month),
    datasets: [
      {
        label: "Total",
        data: activeData.map((d) => d.total),
        borderColor: "#2DD4BF",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "#2DD4BF26");
          gradient.addColorStop(1, "#2DD4BF00");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#2DD4BF",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
          font: { size: 12, weight: 500 },
        },
      },
      y: {
        grid: {
          color: "#f1f5f9",
          drawBorder: false,
        },
        border: {
          display: false,
          dash: [3, 3],
        },
        ticks: {
          color: "#94a3b8",
          font: { size: 12, weight: 500 },
          callback: function (value: any) {
            if (value === 0) return "0";
            return `${value / 1000}k`;
          },
        },
      },
    },
    plugins: {
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#64748b",
        bodyColor: "#334155",
        borderColor: "#f1f5f9",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: (context: any) => {
            return `${context[0].label}, ${selectedYear}`;
          },
          label: (context: any) => {
            return `Total: €${(context.raw / 1000).toFixed(1)}k`;
          },
        },
      },
    },
  };

  return (
    <>
      <div className="flex flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Tax Obligations Over Time
            </h3>
            <p className="text-sm font-medium text-slate-400 mt-1">
              Last 12 Months
            </p>
          </div>
          <div className="flex items-center gap-3">
            <YearSelect
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-500 transition-colors hover:bg-indigo-50 cursor-pointer"
            >
              Export Data
            </button>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <Line data={chartData} options={options as any} />
        </div>
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={`Tax Obligations Data - ${selectedYear}`}
      />
    </>
  );
}
