'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Customer } from '@/types';
import { downloadCustomerTemplateExcel, parseCustomersFromExcelFile } from '@/lib/excelExport';

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (customers: (Partial<Customer> & { name: string; phone: string })[]) => void;
}

export const CustomerImportModal: React.FC<CustomerImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedValid, setParsedValid] = useState<(Partial<Customer> & { name: string; phone: string })[]>([]);
  const [parsedInvalid, setParsedInvalid] = useState<{ rowNumber: number; reason: string; raw: any }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsProcessing(true);

    try {
      const { valid, invalid } = await parseCustomersFromExcelFile(selected);
      setParsedValid(valid);
      setParsedInvalid(invalid);
    } catch (err: any) {
      alert('Error reading Excel file: ' + (err.message || 'Please upload a valid .xlsx or .csv'));
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedValid.length === 0) return;
    onImportSuccess(parsedValid);
    onClose();
    // reset
    setFile(null);
    setParsedValid([]);
    setParsedInvalid([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Import Customers from Excel / CSV
              </h3>
              <p className="text-xs text-slate-500">
                Bulk upload existing customer records, RO purifier models, and due dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step 1: Download Template */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-teal-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Need a ready-made template?
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                Download our pre-formatted sample Excel file with all standard columns.
              </p>
            </div>
            <button
              onClick={downloadCustomerTemplateExcel}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-teal-800 font-semibold text-xs rounded-xl border border-teal-200 shadow-sm flex items-center gap-1.5 transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Step 2: Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 hover:bg-teal-50/30 rounded-2xl p-6 text-center cursor-pointer transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-2 text-teal-600">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {file ? file.name : 'Click to select or drag & drop Excel / CSV file'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports .xlsx, .xls, or .csv (Max 5,000 customers per batch)
            </p>
          </div>

          {/* Step 3: Parsing Results Preview */}
          {isProcessing && (
            <div className="text-center py-6 text-xs text-slate-500">
              Reading and validating spreadsheet columns...
            </div>
          )}

          {file && !isProcessing && (
            <div className="space-y-4">
              {/* Summary Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-extrabold text-emerald-900 text-sm">
                      {parsedValid.length} Ready to Import
                    </div>
                    <div className="text-[10px] text-emerald-700">Valid customer entries</div>
                  </div>
                </div>

                <div className={`rounded-xl p-3 flex items-center gap-2 border ${
                  parsedInvalid.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 ${
                    parsedInvalid.length > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`} />
                  <div>
                    <div className="font-extrabold text-slate-800 text-sm">
                      {parsedInvalid.length} Skipped Rows
                    </div>
                    <div className="text-[10px] text-slate-500">Missing Name or Phone</div>
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              {parsedValid.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Preview (Showing first {Math.min(5, parsedValid.length)} of {parsedValid.length})
                  </div>
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Phone</th>
                          <th className="py-2 px-3">Area / Address</th>
                          <th className="py-2 px-3">RO Brand & Model</th>
                          <th className="py-2 px-3">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedValid.slice(0, 5).map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                            <td className="py-2 px-3 text-slate-600">{c.phone}</td>
                            <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">{c.area || c.address}</td>
                            <td className="py-2 px-3 text-slate-600">{c.roBrand} ({c.roModel})</td>
                            <td className="py-2 px-3 text-teal-700 font-semibold">{c.nextServiceDueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedValid.length === 0}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 transition"
          >
            <Users className="w-4 h-4" />
            <span>Import {parsedValid.length > 0 ? `${parsedValid.length} Customers` : 'Customers'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
