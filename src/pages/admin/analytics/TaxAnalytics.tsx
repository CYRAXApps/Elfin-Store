import React from 'react';
import { FileSpreadsheet, Download, ShieldCheck } from 'lucide-react';

interface TaxAnalyticsProps {
  taxData: any;
  onExportTaxCSV: () => void;
}

export function TaxAnalytics({ taxData, onExportTaxCSV }: TaxAnalyticsProps) {
  if (!taxData) return <div className="p-8 text-slate-500">Loading GST tax analytics...</div>;

  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-emerald-600" /> GST & Tax Compliance Analytics
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Indian GST tax calculation engine output (CGST/SGST/IGST breakdown)
          </p>
        </div>
        <button
          onClick={onExportTaxCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs"
        >
          <Download size={14} /> Export Tax/GST Report (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Taxable Sales Amount</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">{formatINR(taxData.taxableSales)}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Tax Collected</span>
          <h3 className="text-2xl font-bold text-amber-600 mt-2">{formatINR(taxData.totalTaxCollected)}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">CGST Collected</span>
          <h3 className="text-2xl font-bold text-blue-600 mt-2">{formatINR(taxData.cgstAmount)}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">SGST Collected</span>
          <h3 className="text-2xl font-bold text-indigo-600 mt-2">{formatINR(taxData.sgstAmount)}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">IGST Collected</span>
          <h3 className="text-2xl font-bold text-purple-600 mt-2">{formatINR(taxData.igstAmount)}</h3>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-xs text-slate-700 flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm text-slate-900 mb-1">Official Tax Policy Rule</h4>
          <p className="leading-relaxed text-slate-600">
            GST tax collected is held in trust for statutory remittance to government tax authorities. In accordance with strict accounting principles, tax collected is excluded from gross business revenue metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
