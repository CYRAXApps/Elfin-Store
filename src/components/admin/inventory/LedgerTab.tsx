import React, { useState, useEffect } from 'react';
import { InventoryLedgerEntry } from '../../../types';
import { Search, Filter, Layers, ArrowDownLeft, ArrowUpRight, X, RotateCcw, SlidersHorizontal, RefreshCw, ShoppingCart, Store, Shield } from 'lucide-react';

export const LedgerTab: React.FC = () => {
  const [ledgerEntries, setLedgerEntries] = useState<InventoryLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });

  useEffect(() => {
    fetchLedger();
  }, [page, typeFilter]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        type: typeFilter
      });
      const res = await fetch(`/api/admin/inventory/ledger?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLedgerEntries(data.items || []);
        setPagination(data.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load inventory ledger', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLedger();
  };

  const renderSourceBadge = (refType?: string, type?: string) => {
    if (refType === 'pos_sale' || (type === 'sale' && refType?.includes('pos'))) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Store className="w-3 h-3" /> POS Counter
        </span>
      );
    }
    if (refType === 'online_order' || type === 'sale') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ShoppingCart className="w-3 h-3" /> Online Order
        </span>
      );
    }
    if (refType === 'customer_return' || type === 'return') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <RotateCcw className="w-3 h-3" /> Customer Return
        </span>
      );
    }
    if (refType === 'supplier_stock_in' || refType === 'purchase_order' || type === 'purchase') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ArrowDownLeft className="w-3 h-3" /> Supplier Stock-In
        </span>
      );
    }
    if (type === 'damaged' || type === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <X className="w-3 h-3" /> Damaged / Write-Off
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <SlidersHorizontal className="w-3 h-3" /> Admin Manual
      </span>
    );
  };

  const renderTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; bg: string; text: string; icon: any }> = {
      purchase: { label: 'Stock-In (+)', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: ArrowDownLeft },
      sale: { label: 'Sale Deduction (-)', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', icon: ArrowUpRight },
      reservation: { label: 'Reserved', bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700', icon: Layers },
      reservation_release: { label: 'Reserve Released', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: RotateCcw },
      adjustment: { label: 'Adjustment (Δ)', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: SlidersHorizontal },
      return: { label: 'Return Restock (+)', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: RotateCcw },
      damaged: { label: 'Damaged Write-off (-)', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: X },
      expired: { label: 'Expired Disposal (-)', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: X },
      manual_correction: { label: 'Audit Correction', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', icon: SlidersHorizontal }
    };

    const b = badges[type] || { label: type, bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', icon: Layers };
    const Icon = b.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${b.bg} ${b.text}`}>
        <Icon className="w-3 h-3" />
        {b.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search movement history by product, SKU, reference ID, reason, or staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Movement Types</option>
            <option value="purchase">Purchases (Supplier Stock-In)</option>
            <option value="sale">Sales Deductions (Online & POS)</option>
            <option value="return">Customer Returns Restock</option>
            <option value="damaged">Damaged Stock Write-offs</option>
            <option value="adjustment">Manual Adjustments & Exact Counts</option>
            <option value="reservation">Order Reservations</option>
          </select>

          <button
            onClick={fetchLedger}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4 text-center">Movement Source</th>
                <th className="py-3 px-4 text-center">Stock Change</th>
                <th className="py-3 px-4 text-center">Before → After</th>
                <th className="py-3 px-4">Reason & Reference</th>
                <th className="py-3 px-4 text-right">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading immutable stock movements ledger...
                  </td>
                </tr>
              ) : ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No movement records found for the selected query.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(entry.createdAt || Date.now()).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{entry.productName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">SKU: {entry.sku || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {renderSourceBadge(entry.referenceType, entry.type)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono">
                      <span className={entry.quantity > 0 ? 'text-emerald-600' : entry.quantity < 0 ? 'text-rose-600' : 'text-slate-600'}>
                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-mono">
                      <span className="text-slate-500 font-medium">{entry.beforeStock}</span>
                      <span className="text-slate-400 mx-1.5">→</span>
                      <span className="font-bold text-blue-600">{entry.afterStock}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-medium">{entry.reason}</div>
                      {entry.referenceId && (
                        <div className="text-slate-500 font-mono text-[10px] mt-0.5">Ref: {entry.referenceId}</div>
                      )}
                      {entry.notes && (
                        <div className="text-slate-500 italic text-[11px] mt-0.5">"{entry.notes}"</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-medium">
                      <div className="inline-flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-blue-600" />
                        <span>{entry.createdBy || 'Admin Staff'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900">{ledgerEntries.length}</span> of{' '}
            <span className="font-bold text-slate-900">{pagination.totalCount}</span> movements
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-600 font-medium">
              Page {page} of {pagination.totalPages || 1}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
