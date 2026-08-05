"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Search,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import Pagination from "@/components/common/Pagination";
import { pendingSalariesData, PendingSalaryRecord } from "./data";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import SuccessModal from "./SuccessModal";
import SalaryDetailsModal from "./SalaryDetailsModal";

export default function PendingDeclinedTable() {
  const [activeTab, setActiveTab] = useState("All");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<
    "details" | "delete" | "success" | null
  >(null);
  const [selectedRecord, setSelectedRecord] =
    useState<PendingSalaryRecord | null>(null);
  const itemsPerPage = 5;

  const tabs = ["All", "Pending", "Declined"];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setOpenDropdownId(null);
    setIsStatusOpen(false);
  };

  const filteredData = pendingSalariesData.filter((item) => {
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
        {/* Header */}

        <div className="space-y-4 flex flex-col sm:flex-row md:flex-row justify-between gap-4 mb-6">
          <h3 className="text-[15px] font-bold text-slate-800">
            Pending & Declined Salaries
          </h3>
          <div className="flex items-center gap-3">
            <div className="space-y-1.5 relative">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="flex items-center justify-between w-32 px-4 py-1.5 text-[13px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:border-[#5c7cfa] focus:ring-1 focus:ring-[#5c7cfa]"
              >
                <span>{activeTab}</span>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isStatusOpen && (
                <div className="absolute top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors ${
                        activeTab === tab
                          ? "bg-[#5c7cfa]/10 text-[#5c7cfa]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[#5c7cfa] focus:ring-1 focus:ring-[#5c7cfa] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#f8f9fc] border-y border-slate-100">
                <th className="py-4 px-4 text-xs font-bold text-slate-600">
                  Team Member
                </th>
                <th className="py-4 px-4 text-xs font-bold text-slate-600">
                  Salon
                </th>
                <th className="py-4 px-4 text-xs font-bold text-slate-600">
                  Period
                </th>
                <th className="py-4 px-4 text-xs font-bold text-slate-600">
                  Gross
                </th>
                <th className="py-4 px-4 text-xs font-bold text-slate-600">
                  Net Amount
                </th>
                <th className="py-4 px-4 text-xs font-bold text-slate-600">
                  Status
                </th>
                <th className="py-4 px-4 text-xs font-bold text-slate-600">
                  Uploaded
                </th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 rounded-tr-xl text-center">
                  Actions
                </th>
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
                      <Image
                        src={row.avatar}
                        alt={row.name}
                        width={36}
                        height={36}
                        className="rounded-full bg-slate-100 object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-800">
                          {row.name}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          Uploaded by: {row.uploadedBy}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src={row.salonLogo}
                        alt={row.salon}
                        width={36}
                        height={36}
                        className="rounded-lg object-cover"
                      />

                      <span className="text-[13px] font-medium text-slate-600">
                        {row.salon}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-[13px] font-medium text-slate-600">
                      {row.period}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-indigo-50 text-[#5c7cfa] text-xs font-bold">
                      €
                      {row.gross.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-500 text-xs font-bold">
                      €
                      {row.net.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold capitalize ${
                        row.status === "Declined"
                          ? "bg-red-50 text-red-500"
                          : "bg-amber-50 text-amber-500"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-[13px] font-medium text-slate-600">
                      {row.uploadedDate}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-center relative">
                    <button
                      onClick={() =>
                        setOpenDropdownId(
                          openDropdownId === row.id ? null : row.id,
                        )
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Actions Dropdown */}
                    {openDropdownId === row.id && (
                      <div className="absolute right-8 top-10 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-10 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => {
                            setSelectedRecord(row);
                            setModalType("details");
                            setOpenDropdownId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Eye size={14} className="text-[#5c7cfa]" />
                          View Details
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                          <Edit2 size={14} className="text-teal-500" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecord(row);
                            setModalType("delete");
                            setOpenDropdownId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-slate-50 transition-colors"
                        >
                          <Trash2 size={14} className="text-red-500" />
                          Delete
                        </button>
                      </div>
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

      {/* Modals Overlay */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          {modalType === "details" && selectedRecord && (
            <SalaryDetailsModal
              record={selectedRecord}
              onClose={() => setModalType(null)}
            />
          )}
          {modalType === "delete" && (
            <DeleteConfirmationModal
              onClose={() => setModalType(null)}
              onConfirm={() => setModalType("success")}
            />
          )}
          {modalType === "success" && (
            <SuccessModal onClose={() => setModalType(null)} />
          )}
        </div>
      )}
    </div>
  );
}
