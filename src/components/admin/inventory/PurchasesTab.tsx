import React, { useState } from 'react';
import { PurchaseOrder, Supplier } from '../../../types';
import { Plus, ShoppingBag, ArrowDownLeft, CheckCircle2, Clock, XCircle, Search, Eye } from 'lucide-react';

interface PurchasesTabProps {
  purchases: PurchaseOrder[];
  suppliers: Supplier[];
  products: any[];
  loading: boolean;
  onRefresh: () => void;
  onOpenStockIn: () => void;
}

export const PurchasesTab: React.FC<PurchasesTabProps> = ({
  purchases,
  suppliers,
  products,
  loading,
  onRefresh,
  onOpenStockIn
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (poId: string, newStatus: 'received' | 'cancelled') => {
    if (newStatus === 'received') {
      if (!confirm('Marking this Purchase Order as Received will atomically increase product stock levels and update supplier unit costs. Proceed?')) {
        return;
      }
    }

    setUpdatingId(poId);
    try {
      const res = await fetch(`/api/admin/inventory/purchases/${poId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminUser: 'Admin User' })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update status');
      } else {
        onRefresh();
      }
    } catch (err) {
      alert('Error updating purchase order');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = purchases.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search) {
      const ref = (p.referenceNumber || '').toLowerCase();
      const sup = (p.supplierName || '').toLowerCase();
      return ref.includes(search.toLowerCase()) || sup.includes(search.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO reference, supplier name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All PO Statuses</option>
            <option value="draft">Draft / Pending</option>
            <option value="received">Received / Stocked</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={onOpenStockIn}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </button>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">PO Reference</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4 text-center">Items Count</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {po.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{po.supplierName}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{po.purchaseDate}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{po.totalItems}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ₹{Number(po.totalCost).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.status === 'received' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Received
                        </span>
                      ) : po.status === 'draft' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" /> Pending Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3.5 h-3.5" /> Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedPO(po)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="View Items"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {po.status === 'draft' && (
                        <>
                          <button
                            disabled={updatingId === po.id}
                            onClick={() => handleStatusChange(po.id, 'received')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            Receive Stock
                          </button>
                          <button
                            disabled={updatingId === po.id}
                            onClick={() => handleStatusChange(po.id, 'cancelled')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-rose-600 text-xs font-bold rounded-lg border border-slate-200 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View PO Items Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedPO.referenceNumber}</h3>
                <p className="text-xs text-slate-500">Supplier: {selectedPO.supplierName}</p>
              </div>
              <button onClick={() => setSelectedPO(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Purchased Items</div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 divide-y divide-slate-100">
                {(selectedPO.items || []).map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{it.productName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">SKU: {it.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{it.quantity} units @ ₹{it.unitCost}</div>
                      <div className="text-emerald-600 font-mono font-bold">Total: ₹{it.totalCost}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
