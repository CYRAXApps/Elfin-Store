import React, { useState, useEffect } from 'react';
import { 
  X, Search, Filter, History, ArrowDownLeft, ArrowUpRight, 
  RotateCcw, SlidersHorizontal, ShoppingCart, Store, RefreshCw, Layers, Calendar, User
} from 'lucide-react';
import { InventoryLedgerEntry, Product } from '../../../types';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [entries, setEntries] = useState<InventoryLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0, totalPages: 1 });

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchHistory(1);
    }
  }, [isOpen, product, typeFilter]);

  const fetchHistory = async (targetPage = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: targetPage.toString(),
        limit: '15',
        search: search.trim() || (product?.name || ''),
        type: typeFilter
      });
      const res = await fetch(`/api/admin/inventory/ledger?${query.toString()}`);
      const data = await res.json();
      if (res.ok) {
        let items: InventoryLedgerEntry[] = data.items || [];
        // If opened for a specific product, ensure filtered
        if (product && product.id) {
          items = items.filter((item: any) => 
            item.productId === product.id || 
            item.productName?.toLowerCase().includes(product.name.toLowerCase()) ||
            (product.sku && item.sku?.toLowerCase().includes(product.sku.toLowerCase()))
          );
        }
        setEntries(items);
        setPagination(data.pagination || { page: targetPage, limit: 15, totalCount: items.length, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load stock history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory(1);
  };

  if (!isOpen) return null;

  const renderSourceBadge = (refType?: string, type?: string) => {
    if (refType === 'pos_sale' || (type === 'sale' && refType?.includes('pos'))) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Store className="w-3 h-3" /> POS Counter
        </span>
      );
    }
    if (refType === 'online_order' || type === 'sale') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ShoppingCart className="w-3 h-3" /> Online Order
        </span>
      );
    }
    if (refType === 'customer_return' || type === 'return') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
          <RotateCcw className="w-3 h-3" /> Customer Return
        </span>
      );
    }
    if (refType === 'supplier_stock_in' || refType === 'purchase_order' || type === 'purchase') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ArrowDownLeft className="w-3 h-3" /> Supplier In
        </span>
      );
    }
    if (type === 'damaged' || type === 'expired') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <X className="w-3 h-3" /> Damaged Write-Off
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <SlidersHorizontal className="w-3 h-3" /> Admin Manual
      </span>
    );
  };

  const formatDate = (isoOrSeconds: any) => {
    if (!isoOrSeconds) return '-';
    try {
      if (typeof isoOrSeconds === 'string') {
        return new Date(isoOrSeconds).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      if (isoOrSeconds.seconds) {
        return new Date(isoOrSeconds.seconds * 1000).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return new Date(isoOrSeconds).toLocaleString('en-IN');
    } catch {
      return '-';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {product ? `Stock Movement History: ${product.name}` : 'Stock Movement & Audit Log'}
              </h2>
              <p className="text-xs text-slate-500">
                {product ? `SKU: ${product.sku || 'N/A'} • Current Stock: ${product.stock ?? (product.inStock ? 10 : 0)} units` : 'Real-time timeline of stock adjustments, sales deductions, and restocks.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reason, staff, or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Movements</option>
              <option value="purchase">Supplier Restock</option>
              <option value="sale">Sales Deductions</option>
              <option value="adjustment">Manual Adjustments</option>
              <option value="return">Customer Returns</option>
              <option value="damaged">Damaged Write-offs</option>
            </select>

            <button
              onClick={() => fetchHistory(page)}
              disabled={loading}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              title="Refresh logs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading stock movement history...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              No stock movements recorded matching current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-center">Change</th>
                    <th className="py-2.5 px-3 text-center">Prev &rarr; New</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Staff / Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {entries.map((item: any, idx: number) => {
                    const delta = Number(item.quantityChanged || item.change || 0);
                    const isPositive = delta > 0;
                    const isZero = delta === 0;

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {formatDate(item.timestamp || item.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-900 font-semibold max-w-[180px] truncate">
                          <p className="truncate">{item.productName || product?.name || 'Product'}</p>
                          <p className="text-[10px] font-mono text-slate-400">{item.sku || product?.sku || 'SKU'}</p>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-black text-xs ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700'
                              : isZero
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isPositive ? `+${delta}` : delta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap font-mono">
                          <span>{item.previousStock ?? '-'}</span>
                          <span className="text-slate-400 mx-1">&rarr;</span>
                          <span className="font-bold text-slate-900">{item.newStock ?? '-'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 max-w-[160px] truncate">
                          <p className="truncate">{item.reason || item.notes || 'Routine update'}</p>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {renderSourceBadge(item.referenceType, item.type)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <User size={12} className="text-slate-400" />
                            <span>{item.performedBy || item.createdBy || 'Admin'}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Total movements: <strong className="text-slate-800">{entries.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
