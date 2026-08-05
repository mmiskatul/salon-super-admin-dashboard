"use client";

import React, { useState } from "react";
import { useSalon } from "@/context/SalonContext";
import {
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { ExtractedSalary, mockSalaries } from "./data";
import SalaryUploadSteps from "./SalaryUploadSteps";
import SalaryUploadStep1 from "./SalaryUploadStep1";
import SalaryUploadStep2 from "./SalaryUploadStep2";
import Pagination from "@/components/common/Pagination";
import Image from "next/image";

export default function SalaryUploadFlow() {
  const { selectedSalon, setSelectedSalon } = useSalon();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setTermsAccepted] = useState(false);
  const [salaries, setSalaries] = useState<ExtractedSalary[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(salaries.length / itemsPerPage) || 1;
  const paginatedSalaries = salaries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExtractData = () => {
    setIsExtracting(true);
    setTimeout(() => {
      setIsExtracting(false);
      setSalaries(mockSalaries);
      setStep(2);
    }, 1800);
  };

  const handleSubmitSalaries = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  const resetUploadFlow = () => {
    setSalaries([]);
    setTermsAccepted(false);
    setShowSuccessModal(false);
    setStep(1);
  };

  return (
    <div className="space-y-6">
      <SalaryUploadSteps
        step={step}
        onChangeStep={setStep}
        hasData={salaries.length > 0}
      />

      {step === 1 && (
        <SalaryUploadStep1
          selectedSalon={selectedSalon}
          setSelectedSalon={setSelectedSalon}
          isExtracting={isExtracting}
          onExtract={handleExtractData}
        />
      )}

      {step === 2 && (
        <SalaryUploadStep2
          selectedSalon={selectedSalon}
          salaries={salaries}
          setSalaries={setSalaries}
          setStep={setStep}
        />
      )}

      {step === 3 && (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm text-left">
            <h3 className="font-bold text-slate-800 text-base mb-5">Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  File
                </span>
                <span className="text-xs font-extrabold text-slate-700 mt-1.5">
                  document.pdf
                </span>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Packets
                </span>
                <div className="mt-1 flex items-center">
                  <span className="bg-brand/10 text-brand text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {salaries.length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Approved
                </span>
                <div className="mt-1 flex items-center">
                  <span className="bg-[#ecfdf5] text-emerald-600 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {salaries.filter((s) => s.status === "Approved").length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Needs Review
                </span>
                <div className="mt-1 flex items-center">
                  <span className="bg-amber-50 text-amber-600 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {salaries.filter((s) => s.status === "Review").length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Approved Packets Card */}
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden text-left">
            <div className="p-6 pb-2">
              <h3 className="font-bold text-slate-800 text-base">
                Approved Packets
              </h3>
            </div>

            <div className="overflow-x-auto px-6">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#f5f6ff] text-slate-700 text-sm font-bold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-4 px-6 text-xs">Employee Name</th>
                    <th className="py-4 px-4 text-xs">Period</th>
                    <th className="py-4 px-4 text-xs">Deductions</th>
                    <th className="py-4 px-4 text-xs">Gross</th>
                    <th className="py-4 px-4 text-xs">Net</th>
                    <th className="py-4 px-4 text-xs">TRF This Year</th>
                    <th className="py-4 px-6 text-xs">TRF al 31/12/xx (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {paginatedSalaries.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {emp.avatar ? (
                            <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                              <Image
                                width={40}
                                height={40}
                                src={emp.avatar}
                                alt={emp.employeeName}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-brand text-white flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold">AR</span>
                            </div>
                          )}
                          <span className="font-bold text-slate-800">
                            {emp.employeeName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-medium">
                        {emp.period}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-rose-50 text-rose-500 font-bold px-3 py-1 rounded-full text-[10px]">
                          € {emp.deemed.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded-full text-[10px]">
                          € {emp.grossSalary.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-[#ecfdf5] text-emerald-600 font-bold px-3 py-1 rounded-full text-[10px]">
                          € {emp.netSalary.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-[#eef2ff] text-indigo-600 font-bold px-3 py-1 rounded-full text-[10px]">
                          € {emp.trfThisYear.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full text-[10px]">
                          € {emp.trfPrevYears.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={salaries.length}
              itemsPerPage={itemsPerPage}
              itemsName="salaries"
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(2)}
                className="border border-brand text-brand hover:bg-brand/5 bg-white rounded-xl text-xs font-bold px-5 py-3 cursor-pointer"
              >
                Back to Review
              </button>
              <button
                onClick={() => {
                  const dataStr =
                    "data:text/json;charset=utf-8," +
                    encodeURIComponent(JSON.stringify(salaries, null, 2));
                  const downloadAnchor = document.createElement("a");
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", "salaries.json");
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="bg-[#eef2ff] text-brand hover:bg-[#e0e7ff] rounded-xl text-xs font-bold px-5 py-3 cursor-pointer"
              >
                Export as JSON
              </button>
            </div>

            <button
              onClick={handleSubmitSalaries}
              disabled={isSubmitting}
              className="bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-bold px-6 py-3.5 cursor-pointer shadow-md shadow-brand/10 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send to Owner to Approval</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Popup Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-md p-8 shadow-2xl text-center space-y-6 animate-scale-in">
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-[#e6fcf5] text-[#0ca678] flex items-center justify-center mb-6 shadow-sm shadow-emerald-50">
                <CheckCircle2 size={32} />
              </div>

              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                Success!
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed max-w-sm">
                {salaries.length} salary packets set to owner for approval!
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/salaries/history"
                onClick={resetUploadFlow}
                className="w-full inline-flex justify-center items-center rounded-xl bg-brand text-white text-xs font-bold py-3.5 hover:bg-brand-dark transition-all shadow-md shadow-brand/10 cursor-pointer"
              >
                Ok, go to salaries
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
