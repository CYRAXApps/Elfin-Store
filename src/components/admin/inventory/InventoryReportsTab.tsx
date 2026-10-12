import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, RefreshCw, Layers, DollarSign, XCircle, RotateCcw } from 'lucide-react';

export const InventoryReportsTab: React.FC = () => {
  const [reportType, setReportType] = useState('valuation');
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData(reportType);
  }, [reportType]);

  const fetchReportData = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory/reports?type=${type}`);
      const data = await res.json();
      if (res.ok) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load report', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.location.href = `/api/admin/analytics/export?type=inventory&reportPreset=${reportType}`;
  };

  return (
    <div className="space-y-4">
      {/* Selector & Export Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setReportType('valuation')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'valuation'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory Valuation
          </button>
          <button
            onClick={() => setReportType('damaged')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'damaged'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Damaged Stock Log
          </button>
          <button
            onClick={() => setReportType('returns')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'returns'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Returns Log
          </button>
          <button
            onClick={() => setReportType('suppliers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'suppliers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Supplier Purchases
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          Export Report to CSV
        </button>
      </div>

      {/* Report Summary Cards */}
      {reportType === 'valuation' && reportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Retail Valuation</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              ₹{Number(reportData.totalRetailValuation || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Based on active listing prices</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Cost Price Valuation</div>
            <div className="text-xl font-bold text-emerald-600 font-mono mt-1">
              ₹{Number(reportData.totalCostValuation || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{reportData.costDataCoverage}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products Cataloged</div>
            <div className="text-xl font-bold text-blue-600 mt-1">
              {reportData.totalProducts} Products
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Across all active categories</div>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Generating inventory report...
          </div>
        ) : reportType === 'valuation' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-right">Retail Price</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Retail Value</th>
                  <th className="py-3 px-4 text-right">Total Cost Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {(reportData?.items || []).map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{item.sku}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{item.stock}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">₹{item.retailPrice}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">{item.costPrice}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{Number(item.totalRetailValue || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {typeof item.totalCostValue === 'number' ? `₹${Number(item.totalCostValue || 0).toLocaleString('en-IN')}` : (item.totalCostValue ?? '₹0')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Reason / Details</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {(reportData?.entries || []).map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(entry.createdAt || Date.now()).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{entry.productName} ({entry.sku})</td>
                    <td className="py-3 px-4 text-slate-600">{entry.reason}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">{entry.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">{entry.referenceId || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
