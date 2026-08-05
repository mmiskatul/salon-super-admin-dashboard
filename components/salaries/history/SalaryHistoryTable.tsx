"use client";

import React, { useState } from "react";
import {
  Download,
  ChevronDown,
  Search,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import Pagination from "@/components/common/Pagination";
import ExportModal from "@/components/common/ExportModal";
import { salaryHistoryData } from "./data";

export default function SalaryHistoryTable() {
  const [activeTab, setActiveTab] = useState("All");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const tabs = ["All", "Approved", "Declined", "Cancelled"];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsStatusOpen(false);
    setCurrentPage(1);
  };

  const filteredData = salaryHistoryData.filter((item) => {
    if (activeTab === "All") return true;
    return item.status === activeTab;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Salary History</h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search..."
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#5c7cfa] focus:ring-1 focus:ring-[#5c7cfa] transition-all placeholder:font-normal"
              />
            </div>

            {/* Custom Status Select */}
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full sm:w-40 flex items-center justify-between bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg pl-4 pr-3 py-2 focus:outline-none focus:border-[#5c7cfa] focus:ring-1 focus:ring-[#5c7cfa] transition-all cursor-pointer"
              >
                <span>{activeTab}</span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isStatusOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsStatusOpen(false)}
                  />
                  <div className="absolute z-20 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-lg py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? "bg-[#5c7cfa]/10 text-[#5c7cfa]"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="bg-white text-brand border border-brand  px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
            >
              <Download size={16} />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-brand/10 text-slate-700 text-sm font-bold border-b border-slate-100">
                <th className="py-4 px-4">Team Member</th>
                <th className="py-4 px-4">Salon</th>
                <th className="py-4 px-4">Period</th>
                <th className="py-4 px-4">Gross</th>
                <th className="py-4 px-4">Net Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Approved</th>
                <th className="py-4 px-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <Image
                          src={row.avatar}
                          alt={row.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">
                          {row.name}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {row.empId}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-500">
                    {row.salon}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-500">
                    {row.period}
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-indigo-50 text-[#5c7cfa] px-3 py-1.5 rounded-lg text-xs font-bold inline-block">
                      €{" "}
                      {row.gross.toLocaleString("en-IE", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-emerald-50 text-emerald-500 px-3 py-1.5 rounded-lg text-xs font-bold inline-block">
                      €{" "}
                      {row.net.toLocaleString("en-IE", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {row.status === "Declined" ? (
                      <span className="bg-red-50 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold inline-block">
                        Declined
                      </span>
                    ) : row.status === "Approved" ? (
                      <span className="bg-emerald-50 text-emerald-500 px-3 py-1.5 rounded-lg text-xs font-bold inline-block">
                        Approved
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-bold inline-block">
                        {row.status}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {row.approvedDate ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {row.approvedDate}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          by {row.approvedBy}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {row.paymentDate ? (
                      <div className="flex items-center gap-1.5">
                        {row.paymentStatus === "pending" ? (
                          <Clock size={16} className="text-red-400 shrink-0" />
                        ) : (
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500 shrink-0"
                          />
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          {row.paymentDate}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-bold">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        itemsName="salaries"
        onPageChange={setCurrentPage}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Salary History"
      />
    </div>
  );
}
