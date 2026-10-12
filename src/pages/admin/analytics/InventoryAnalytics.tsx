import React from 'react';
import { Package, AlertTriangle, ShieldAlert, Archive, CheckCircle, Info } from 'lucide-react';

interface InventoryAnalyticsProps {
  data: any;
  onNavigateToInventory: () => void;
}

export function InventoryAnalytics({ data, onNavigateToInventory }: InventoryAnalyticsProps) {
  if (!data?.inventory) return <div className="p-8 text-slate-500">Loading inventory analytics...</div>;

  const { inventory, products } = data;
  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Top Inventory Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total SKUs</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{inventory.totalSKUs}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">In-Stock SKUs</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">{inventory.inStockSKUs}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Low-Stock SKUs (≤5)</span>
          <h3 className="text-xl font-bold text-amber-600 mt-1">{inventory.lowStockSKUs}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Out-of-Stock SKUs</span>
          <h3 className="text-xl font-bold text-rose-600 mt-1">{inventory.outOfStockSKUs}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Est. Stock Valuation</span>
          <h3 className="text-xl font-bold text-blue-600 mt-1">{formatINR(inventory.totalInventoryValue)}</h3>
        </div>
      </div>

      {/* Low Stock & Dead Stock Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Restock Priority (Low Stock Best Sellers) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" /> Urgent Restock Priorities (Low Stock)
            </h3>
            <button onClick={onNavigateToInventory} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
              Manage Products →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5 text-right">Units Sold</th>
                  <th className="p-2.5 text-center">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products?.lowStockBestSellers && products.lowStockBestSellers.length > 0 ? (
                  products.lowStockBestSellers.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-800">{p.unitsSold}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900">
                          {p.currentStock} left
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500">No urgent low stock alerts.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dead Stock Analysis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Archive size={16} className="text-slate-600" /> Dead Stock Analysis (Zero Sales & Available Stock)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5 text-right">Stock Count</th>
                  <th className="p-2.5 text-right">Idle Capital</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.deadStockProducts && inventory.deadStockProducts.length > 0 ? (
                  inventory.deadStockProducts.slice(0, 5).map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-800">{p.currentStock}</td>
                      <td className="p-2.5 text-right font-bold text-slate-700">{formatINR(p.currentStock * (p.price || 0))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500">No dead stock detected.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inventory Movement Ledger Status */}
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl text-xs text-blue-950 flex items-start gap-3">
        <Info size={18} className="shrink-0 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-bold text-sm mb-1">Stock Movement Ledger Status</h4>
          <p className="opacity-90 leading-relaxed">
            Current stock count is updated in real-time on order creation and checkout. Historical stock movement breakdown (Stock Added, Stock Adjusted, Stock Reserved) is logged in the system ledger upon admin inventory adjustments.
          </p>
        </div>
      </div>
    </div>
  );
}
