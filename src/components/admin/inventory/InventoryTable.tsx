import React, { useState } from 'react';
import { 
  Search, Filter, PlusCircle, ArrowUpDown, SlidersHorizontal, Eye, RefreshCw, 
  AlertCircle, CheckCircle2, XCircle, RotateCcw, Edit2, Check, X, ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface InventoryTableProps {
  products: any[];
  categories: string[];
  brands: string[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  currentStockStatus?: string;
  onQueryChange: (newParams: any) => void;
  onOpenStockIn: (productId?: string) => void;
  onOpenAdjust: (product?: any) => void;
  onOpenDetail: (product: any) => void;
  onOpenProcessReturn: (product: any) => void;
  onRefreshTable?: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  categories,
  brands,
  loading,
  pagination,
  currentStockStatus = 'all',
  onQueryChange,
  onOpenStockIn,
  onOpenAdjust,
  onOpenDetail,
  onOpenProcessReturn,
  onRefreshTable
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [stockStatus, setStockStatus] = useState(currentStockStatus);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Inline Threshold Editing State
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [editingThresholdVal, setEditingThresholdVal] = useState<number>(5);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQueryChange({ search, page: 1 });
  };

  const handleSort = (field: string) => {
    const nextOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(nextOrder);
    onQueryChange({ sortBy: field, sortOrder: nextOrder, page: 1 });
  };

  const handleSaveInlineThreshold = async (productId: string) => {
    setSavingThreshold(true);
    try {
      const creator = user?.displayName || user?.email || 'Admin Staff';
      const res = await fetch(`/api/admin/inventory/products/${productId}/threshold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowStockThreshold: Math.max(0, Number(editingThresholdVal) || 0),
          adminUser: creator
        })
      });

      if (res.ok) {
        setEditingThresholdId(null);
        if (onRefreshTable) onRefreshTable();
      }
    } catch (err) {
      console.error('Failed to save threshold', err);
    } finally {
      setSavingThreshold(false);
    }
  };

  const renderStatusBadge = (status: string, available: number, lowThreshold: number) => {
    if (status === 'inactive') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          Inactive
        </span>
      );
    }
    if (available <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" /> Out of Stock
        </span>
      );
    }
    if (available <= lowThreshold) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5" /> Low Stock ({available})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({available})
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Product Name, SKU, Barcode, Brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              onQueryChange({ stockStatus: e.target.value, page: 1 });
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (Alerts)</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="recently_updated">Recently Updated (Last 7 Days)</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              onQueryChange({ category: e.target.value, page: 1 });
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat.toLowerCase()}>{cat}</option>
            ))}
          </select>

          <select
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              onQueryChange({ brand: e.target.value, page: 1 });
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Brands</option>
            {brands.map((b, idx) => (
              <option key={idx} value={b.toLowerCase()}>{b}</option>
            ))}
          </select>

          {/* Quick Stock Adjustment Trigger */}
          <button
            onClick={() => onOpenAdjust(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            Adjust Stock
          </button>

          {/* Stock In Inwarding */}
          <button
            onClick={() => onOpenStockIn()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Stock-In
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('stock')}>
                  <div className="inline-flex items-center gap-1">
                    Total Stock
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('reservedStock')}>
                  <div className="inline-flex items-center gap-1">
                    Reserved
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('availableStock')}>
                  <div className="inline-flex items-center gap-1">
                    Available
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Low Stock Alert</th>
                <th className="py-3 px-4 text-right">Price / Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No matching products found for the selected inventory filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isEditingThisThreshold = editingThresholdId === p.id;
                  const itemThreshold = p.lowStockThreshold !== undefined ? p.lowStockThreshold : 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                              {p.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-slate-900 font-bold leading-tight line-clamp-1">{p.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="capitalize">{p.category}</span>
                              {p.brand && (
                                <>
                                  <span>•</span>
                                  <span>{p.brand}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        <div className="font-bold">{p.sku || 'N/A'}</div>
                        {p.barcode && <div className="text-[10px] text-slate-400">{p.barcode}</div>}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono text-sm">{p.stock}</td>
                      <td className="py-3 px-4 text-center text-sky-700 font-medium font-mono">
                        {p.reservedStock > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold">
                            {p.reservedStock}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                        <span className={p.availableStock <= itemThreshold ? 'text-amber-600' : 'text-emerald-600'}>
                          {p.availableStock}
                        </span>
                      </td>

                      {/* Low Stock Threshold Column */}
                      <td className="py-3 px-4 text-center">
                        {isEditingThisThreshold ? (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={editingThresholdVal}
                              onChange={(e) => setEditingThresholdVal(Math.max(0, parseInt(e.target.value || '0', 10)))}
                              className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-amber-700 font-bold text-xs focus:ring-2 focus:ring-blue-600"
                            />
                            <button
                              onClick={() => handleSaveInlineThreshold(p.id)}
                              disabled={savingThreshold}
                              className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                              title="Save threshold"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingThresholdId(null)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingThresholdId(p.id);
                              setEditingThresholdVal(itemThreshold);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-700 hover:text-amber-700 transition-colors cursor-pointer"
                            title="Click to modify alert threshold"
                          >
                            <span>≤ {itemThreshold}</span>
                            <Edit2 className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right text-xs">
                        <div className="text-slate-900 font-bold font-mono">₹{Number(p.price).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Cost: {p.costPrice ? `₹${Number(p.costPrice).toLocaleString('en-IN')}` : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {renderStatusBadge(p.stockStatus, p.availableStock, itemThreshold)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => onOpenDetail(p)}
                          title="View Movement Ledger & Details"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenAdjust(p)}
                          title="Stock Adjustment (Increase / Decrease / Set Exact)"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenProcessReturn(p)}
                          title="Process Customer Return Stock"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenStockIn(p.id)}
                          title="Receive Supplier Stock"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{products.length}</span> of{' '}
            <span className="font-bold text-slate-800">{pagination.totalCount}</span> items
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onQueryChange({ page: pagination.page - 1 })}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-700 font-semibold">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onQueryChange({ page: pagination.page + 1 })}
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
