"use client";

import React, { useState } from "react";
import { getDocTypeData, getNoticesData } from "./data";
import MetricCards from "./MetricCards";
import DistributionDonut from "./DistributionDonut";
import ContractsDistributionChart from "./ContractsDistributionChart";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
      ctx.font = "500 24px Inter, sans-serif";
      ctx.fillStyle = "#334155"; // slate-700
      ctx.fillText(text, x, y);
      ctx.restore();
    }
  },
};

ChartJS.register(centerTextPlugin);

export default function DocumentsOverview() {
  const [docTypeFilter, setDocTypeFilter] = useState("Daily");
  const [noticesFilter, setNoticesFilter] = useState("Daily");

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 20
      }
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        align: "start" as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 24,
          boxWidth: 6,
          boxHeight: 6,
          font: {
            size: 11,
            family: "Inter, sans-serif",
            weight: 500,
          },
          color: "#64748b",
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-100 px-6 py-5">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
          Documents Overview
        </h1>
      </div>
      <MetricCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DistributionDonut
          title="Document Type Distribution"
          data={getDocTypeData(docTypeFilter)}
          options={doughnutOptions}
          filter={docTypeFilter}
          setFilter={setDocTypeFilter}
        />
        <DistributionDonut
          title="Employee Notices Distribution"
          data={getNoticesData(noticesFilter)}
          options={doughnutOptions}
          filter={noticesFilter}
          setFilter={setNoticesFilter}
        />
      </div>
      <ContractsDistributionChart />
    </div>
  );
}
