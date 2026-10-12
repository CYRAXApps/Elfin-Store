import React, { useState } from 'react';
import { Package, Search, ExternalLink, ArrowUpDown } from 'lucide-react';

interface ProductAnalyticsProps {
  data: any;
  onNavigateToProducts: (productId?: string) => void;
}

export function ProductAnalytics({ data, onNavigateToProducts }: ProductAnalyticsProps) {
  const [activeSubFilter, setActiveSubFilter] = useState<'all' | 'best' | 'revenue' | 'low_stock' | 'no_sales' | 'out_of_stock'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!data?.products) return <div className="p-8 text-slate-500">Loading product analytics...</div>;

  const { products } = data;
  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  let displayedProducts: any[] = products.allProducts || [];

  if (activeSubFilter === 'best') displayedProducts = products.bestSelling || [];
  else if (activeSubFilter === 'revenue') displayedProducts = products.highestRevenue || [];
  else if (activeSubFilter === 'low_stock') displayedProducts = products.lowStockBestSellers || [];
  else if (activeSubFilter === 'no_sales') displayedProducts = products.noSales || [];
  else if (activeSubFilter === 'out_of_stock') displayedProducts = products.outOfStock || [];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedProducts = displayedProducts.filter(p =>
      p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards for Product Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveSubFilter('all')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeSubFilter === 'all' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Catalog SKUs</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{products.allProducts?.length || 0}</h3>
        </div>
        <div
          onClick={() => setActiveSubFilter('best')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeSubFilter === 'best' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 uppercase">Best Sellers</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{products.bestSelling?.length || 0}</h3>
        </div>
        <div
          onClick={() => setActiveSubFilter('low_stock')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeSubFilter === 'low_stock' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 uppercase">Low-Stock Best Sellers</span>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">{products.lowStockBestSellers?.length || 0}</h3>
        </div>
        <div
          onClick={() => setActiveSubFilter('no_sales')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeSubFilter === 'no_sales' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 uppercase">Products With No Sales</span>
          <h3 className="text-2xl font-bold text-slate-600 mt-1">{products.noSales?.length || 0}</h3>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All Products', value: 'all' },
            { label: 'Best-Selling', value: 'best' },
            { label: 'Highest Revenue', value: 'revenue' },
            { label: 'Low-Stock Best Sellers', value: 'low_stock' },
            { label: 'No Sales in Period', value: 'no_sales' },
            { label: 'Out of Stock', value: 'out_of_stock' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveSubFilter(tab.value as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubFilter === tab.value ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
              <tr>
                <th className="p-3.5">Product</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5 text-right">Units Sold</th>
                <th className="p-3.5 text-right">Orders</th>
                <th className="p-3.5 text-right">Revenue</th>
                <th className="p-3.5 text-right">Refunded</th>
                <th className="p-3.5 text-right">Net Sales</th>
                <th className="p-3.5 text-center">Current Stock</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedProducts.length > 0 ? (
                displayedProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{p.sku}</td>
                    <td className="p-3.5 text-right font-bold text-slate-800">{p.unitsSold}</td>
                    <td className="p-3.5 text-right font-medium text-slate-600">{p.ordersCount}</td>
                    <td className="p-3.5 text-right font-semibold text-slate-900">{formatINR(p.revenue)}</td>
                    <td className="p-3.5 text-right font-medium text-rose-600">{formatINR(p.refunded)}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-700">{formatINR(p.netSales)}</td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          p.currentStock === 0
                            ? 'bg-rose-100 text-rose-800'
                            : p.currentStock <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.currentStock} units
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onNavigateToProducts(p.id)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Manage Product"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No products match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
