"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, FileText } from "lucide-react";
import CustomSelect from "@/components/common/CustomSelect";
import SuccessModal from "../employee-notices/SuccessModal";

export default function NewContract() {
  const router = useRouter();
  
  // Form State
  const [contractType, setContractType] = useState("Permanent");
  const [taxIdCode, setTaxIdCode] = useState("");
  const [iban, setIban] = useState("");
  const [startDate, setStartDate] = useState("");
  const [role, setRole] = useState("Select role");
  const [remunerationType, setRemunerationType] = useState("Select type");
  const [salon, setSalon] = useState("Select Salon");
  const [taxType, setTaxType] = useState("Select Tax Type");
  
  // File State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      setIsSuccessModalOpen(true);
    } else {
      alert("Please upload a document.");
    }
  };

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    router.push("/documents/contracts");
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-100 px-6 py-5 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
          New Tax Upload
        </h1>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <Link href="/documents" className="hover:text-[#6366f1] transition-colors"><Home size={14} /></Link>
          <span>/</span>
          <Link href="/documents/contracts" className="bg-indigo-50 text-[#6366f1] px-3 py-1.5 rounded-lg transition-colors">Contract</Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 mb-8">
          {/* Contract Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Contract Type *</label>
            <CustomSelect
              value={contractType}
              options={["Permanent", "Temporary", "Freelance", "Internship"]}
              onChange={setContractType}
            />
          </div>

          {/* Tax ID Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Tax ID Code *</label>
            <input
              type="text"
              value={taxIdCode}
              onChange={(e) => setTaxIdCode(e.target.value)}
              placeholder="Enter tax ID code"
              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors"
              required
            />
          </div>

          {/* IBAN */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">IBAN</label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="Enter IBAN for salary payments"
              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors"
            />
          </div>

          {/* Start Date */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">Start Date *</label>
            <input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Enter start date"
              className="w-full bg-white border border-slate-200 focus:border-[#6366f1] rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none transition-colors mb-2"
              required
            />
            <button type="button" className="text-xs font-bold text-[#6366f1] hover:underline cursor-pointer">
              Set an end date
            </button>
          </div>

          {/* Role */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">Role *</label>
            <CustomSelect
              value={role}
              options={["Hair Stylist", "Colorist", "Receptionist", "Manager"]}
              onChange={setRole}
              placeholder="Select role"
            />
          </div>

          {/* Remuneration Type */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">Remuneration Type *</label>
            <CustomSelect
              value={remunerationType}
              options={["Fixed Salary", "Hourly", "Commission Base"]}
              onChange={setRemunerationType}
              placeholder="Select type"
            />
          </div>

          {/* Salon */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Salon *</label>
            <CustomSelect
              value={salon}
              options={["Chic Hair & Beauty", "Style Studio", "Elegance Spa"]}
              onChange={setSalon}
              placeholder="Select Salon"
            />
          </div>

          {/* Tax Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Tax Type *</label>
            <CustomSelect
              value={taxType}
              options={["Standard", "Reduced", "Exempt"]}
              onChange={setTaxType}
              placeholder="Select Tax Type"
            />
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-slate-700 mb-2">Document *</label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer group
              ${isDragging ? "border-[#6366f1] bg-[#e0e7ff]/30" : "border-[#e0e7ff] hover:border-[#6366f1] bg-slate-50/50 hover:bg-[#e0e7ff]/30"}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.txt"
            />
            {file ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-[#e0e7ff] text-[#6366f1] rounded-xl flex items-center justify-center mb-4">
                  <FileText size={32} />
                </div>
                <span className="text-sm font-bold text-slate-800 mb-1">{file.name}</span>
                <span className="text-xs font-medium text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-4 text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 bg-red-50 rounded-lg"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <img src="/upload.png" alt="Upload Icon" className="w-16 h-16 object-contain" />
                </div>
                <span className="text-sm font-bold text-[#6366f1]">Drop here or click to browse</span>
              </>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-6 flex items-center justify-between">
          <Link
            href="/documents/contracts"
            className="px-8 py-3 bg-white border border-[#e0e7ff] hover:bg-indigo-50 text-[#6366f1] text-sm font-bold rounded-xl transition-colors cursor-pointer block text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-8 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Send for Approval
          </button>
        </div>
      </form>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessClose}
        title="Success!"
        message="Contract submitted for approval."
      />
    </div>
  );
}
