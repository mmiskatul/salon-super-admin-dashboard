"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from "lucide-react";
import { taxHistoryData, TaxHistoryStatus } from "./data";
import ExportModal from "@/components/common/ExportModal";
import Pagination from "@/components/common/Pagination";
import CustomSelect from "@/components/common/CustomSelect";

export default function TaxHistory() {
  const [activeTab, setActiveTab] = useState<"All" | TaxHistoryStatus>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredData = taxHistoryData.filter((item) => {
    const matchesTab = activeTab === "All" || item.status === activeTab;
    const matchesSearch =
      item.taxType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.salon.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col space-y-6 pb-10">
      {/* Top Card */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight shrink-0">
          Tax History
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
          <div className="w-full sm:w-40">
            <CustomSelect
              value={activeTab}
              options={["All", "Approved", "Declined", "Cancelled"]}
              onChange={(val) => setActiveTab(val as "All" | TaxHistoryStatus)}
            />
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-medium outline-none focus:border-indigo-500 transition-colors bg-white text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#695dff] hover:bg-[#584cec] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download size={16} strokeWidth={2.5} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-slate-100">
                <th className="px-6 py-5 text-left text-[14px] font-bold text-slate-700">Tax Type</th>
                <th className="px-6 py-5 text-left text-[14px] font-bold text-slate-700">Salon</th>
                <th className="px-6 py-5 text-left text-[14px] font-bold text-slate-700">Period</th>
                <th className="px-6 py-5 text-left text-[14px] font-bold text-slate-700">Amount</th>
                <th className="px-6 py-5 text-left text-[14px] font-bold text-slate-700">Paid Date</th>
                <th className="px-6 py-5 text-left text-[14px] font-bold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <span className="text-[13px] font-bold text-slate-700">{item.taxType}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {item.logo ? (
                        <Image
                          src={item.logo}
                          alt={item.salon}
                          width={40}
                          height={40}
                          className="rounded-xl shadow-sm shrink-0 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-cyan-400 shadow-sm shrink-0"></div>
                      )}
                      <span className="text-[14px] font-medium text-slate-500">{item.salon}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[14px] font-medium text-slate-500">{item.period}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex px-3 py-1.5 rounded-[6px] bg-indigo-100/60 text-indigo-500 text-[12px] font-bold tracking-wide">
                      {item.amount}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[14px] font-medium text-slate-500">{item.paidDate}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide ${item.status === "Approved"
                        ? "bg-[#e5fcf1] text-[#34d399]"
                        : item.status === "Declined"
                          ? "bg-rose-50 text-rose-400"
                          : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500 font-medium">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Tax History"
      />
    </div>
  );
}
