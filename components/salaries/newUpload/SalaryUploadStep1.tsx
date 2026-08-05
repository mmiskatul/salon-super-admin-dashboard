import React, { useState } from "react";
import Image from "next/image";
import { FileText, Trash2 } from "lucide-react";
import SalonSelector from "./SalonSelector";

interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "completed" | "error";
}

interface SalaryUploadStep1Props {
  selectedSalon: string;
  setSelectedSalon: (salon: string) => void;
  isExtracting: boolean;
  onExtract: () => void;
}

export default function SalaryUploadStep1({
  selectedSalon,
  setSelectedSalon,
  isExtracting,
  onExtract,
}: SalaryUploadStep1Props) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const isSalonActive = selectedSalon !== "All Salons";

  const startMockUpload = (fileName: string, fileSize: number) => {
    const newFile: UploadedFile = {
      name: fileName,
      size: fileSize,
      progress: 0,
      status: "uploading",
    };

    setFiles((prev) => [...prev, newFile]);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setFiles((prev) => {
          const updated = prev.map((f) =>
            f.name === fileName
              ? { ...f, progress: 100, status: "completed" as const }
              : f,
          );
          const allCompleted = updated.every((f) => f.status === "completed");
          if (allCompleted) {
            setTimeout(() => {
              onExtract();
            }, 600);
          }
          return updated;
        });
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === fileName ? { ...f, progress: currentProgress } : f,
          ),
        );
      }
    }, 150);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        if (file.type === "application/pdf") {
          startMockUpload(file.name, file.size);
        }
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      Array.from(e.target.files).forEach((file) => {
        if (file.type === "application/pdf") {
          startMockUpload(file.name, file.size);
        }
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="relative rounded-xl border border-slate-100 bg-white p-6 shadow-sm min-h-[350px]">
      {isExtracting && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center z-20">
          <div className="flex flex-col items-center">
            <div className="h-14 w-14 rounded-full border-4 border-slate-100 border-t-brand animate-spin mb-4.5"></div>
            <h4 className="font-bold text-slate-800 text-base">
              Extracting Payroll Data...
            </h4>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Analyzing pay slips and mapping employee contracts
            </p>
          </div>
        </div>
      )}
      {!isSalonActive ? (
        /* A. Salon Selection State (if All Salons is active) */
        <div className="flex flex-col items-center py-10 px-4">
          <div className="text-center max-w-xl mb-8 space-y-2.5">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Select a Salon
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              To proceed with the upload, you must select a specific salon.
              <br />
              You cannot upload files when &quot;All Salons&quot; is active.
            </p>
          </div>

          <SalonSelector onSelectSalon={setSelectedSalon} />
        </div>
      ) : (
        /* B. Drag & Drop File Upload Zone (once a salon is active) */
        <div className="space-y-6">
          <div className="flex flex-col items-center py-6 px-4 space-y-6">
            {/* Title & Subtitle */}
            <div className="text-center max-w-xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-800 tracking-tight">
                Drop PDF
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                You can upload multiple employees in one PDF file
              </p>
            </div>

            {/* Interactive Drag Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`w-full max-w-3xl relative border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center p-8 sm:p-12 text-center transition-all duration-200 ${
                dragActive
                  ? "border-brand bg-brand/5 scale-[0.995]"
                  : "border-[#5c60f5]/30 bg-white hover:bg-slate-50/30 hover:border-brand/50"
              }`}
            >
              <input
                type="file"
                id="pdf-upload-input"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Image
                src="/upload.png"
                alt="Upload PDF"
                width={56}
                height={56}
                className="object-contain"
              />

              <label
                htmlFor="pdf-upload-input"
                className="text-brand font-medium text-sm sm:text-base cursor-pointer hover:underline mt-2 select-none"
              >
                Drop here or click to browse
              </label>
            </div>

            {/* Sizing Info Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-1.5 shadow-sm">
                PDF only
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-1.5 shadow-sm">
                Max 50MB
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-1.5 shadow-sm">
                Multiple employees supported
              </span>
            </div>
          </div>

          {/* Uploading/Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-3.5">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Uploaded Files ({files.length})
              </h5>

              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-shadow duration-150"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {file.status === "uploading"
                              ? `${file.progress}%`
                              : formatFileSize(file.size)}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-150 ${
                              file.status === "error"
                                ? "bg-rose-500"
                                : file.status === "completed"
                                  ? "bg-emerald-500"
                                  : "bg-brand"
                            }`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFile(idx)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
