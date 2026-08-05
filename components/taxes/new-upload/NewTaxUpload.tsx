"use client";

import React, { useState, useRef } from "react";
import { Trash2, File as FileIcon } from "lucide-react";
import Image from "next/image";
import CustomSelect from "@/components/common/CustomSelect";

const TAX_TYPES = [
  "Select tax type",
  "VAT",
  "Income Tax",
  "Social Security",
  "Property Tax",
  "Other"
];

const SALONS = [
  "Select Salon",
  "Salon 1",
  "Salon 2"
];

export default function NewTaxUpload() {
  const [salon, setSalon] = useState("Select Salon");
  const [taxType, setTaxType] = useState("Select Tax Type");

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [note, setNote] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col h-full space-y-6 pt-5 pb-10 mb-10">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">New Tax Upload</h2>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-100 p-6 sm:p-8">

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">

          <CustomSelect
            label="Salon *"
            value={salon}
            options={SALONS}
            onChange={setSalon}
            placeholder="Select Salon"
          />

          <CustomSelect
            label="Tax Type *"
            value={taxType}
            options={TAX_TYPES}
            onChange={setTaxType}
            placeholder="Select Tax Type"
          />
        </div>

        {/* Dropzone Container */}
        <div className="mb-6 relative z-0">
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Drop Tax Document</h3>
            <p className="text-[13px] text-slate-400 font-medium">You can upload multiple employees in one PDF file</p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-indigo-200 bg-white'} rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all w-full max-w-4xl mx-auto`}
          >
            <div className="mb-3">
              <Image src="/upload.png" alt="Upload" width={64} height={64} className="object-contain" />
            </div>
            <span className="text-sm font-semibold text-indigo-500">Drop here or click to browse</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="application/pdf"
              className="hidden"
            />
          </div>

          {file && (
            <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between w-full max-w-4xl mx-auto mt-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] bg-white ring-1 ring-slate-100">
              <div className="flex items-center gap-4 px-2">
                <div className="text-indigo-500">
                  <FileIcon size={24} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-indigo-500">{file.name}</span>
                  <span className="text-xs font-medium text-slate-400">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-rose-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors cursor-pointer mr-2"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Note (Optional) Field - Shows when file is uploaded */}
        {file && (
          <div className="mt-8 relative z-0">
            <label className="block text-xs font-bold text-slate-700 mb-2">Note(Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note"
              className="w-full bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600 outline-none focus:border-indigo-500 transition-colors min-h-[120px] resize-y"
            ></textarea>
          </div>
        )}

      </div>

      {/* Action Buttons Bottom Row */}
      <div className="flex items-center justify-between pt-2">
        <button className="border border-indigo-200 text-indigo-500 hover:bg-indigo-50 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer bg-white">
          Cancel
        </button>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer">
          Send for Approval
        </button>
      </div>

    </div>
  );
}
