import React, { useState } from 'react';
import { Tag, Award, ArrowUpDown } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface CategoryBrandAnalyticsProps {
  categories: any[];
  brands: any[];
}

const COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#475569'];

export function CategoryBrandAnalytics({ categories = [], brands = [] }: CategoryBrandAnalyticsProps) {
  const [brandSortKey, setBrandSortKey] = useState<'revenue' | 'unitsSold' | 'orders'>('revenue');
  const [brandSortAsc, setBrandSortAsc] = useState(false);

  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const sortedBrands = [...brands].sort((a, b) => {
    const valA = a[brandSortKey] || 0;
    const valB = b[brandSortKey] || 0;
    return brandSortAsc ? valA - valB : valB - valA;
  });

  const pieChartData = categories.map(c => ({
    name: c.category || 'Uncategorized',
    value: c.grossSales || 0
  })).filter(c => c.value > 0);

  return (
    <div className="space-y-8">
      {/* Category Performance & Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Tag size={16} className="text-blue-600" /> Category Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Orders</th>
                  <th className="p-3 text-right">Units Sold</th>
                  <th className="p-3 text-right">Gross Sales</th>
                  <th className="p-3 text-right">Discounts</th>
                  <th className="p-3 text-right">Refunds</th>
                  <th className="p-3 text-right">Net Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length > 0 ? (
                  categories.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.category}</td>
                      <td className="p-3 text-right text-slate-700">{c.orders}</td>
                      <td className="p-3 text-right font-semibold text-slate-800">{c.unitsSold}</td>
                      <td className="p-3 text-right font-medium text-slate-900">{formatINR(c.grossSales)}</td>
                      <td className="p-3 text-right text-rose-600">{formatINR(c.discount)}</td>
                      <td className="p-3 text-right text-rose-600">{formatINR(c.refunds)}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">{formatINR(c.netSales)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">No category sales recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Contribution Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-900 mb-2 w-full text-left">Category Contribution</h3>
          {pieChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatINR(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-16 text-xs text-slate-400">No sales data for category chart.</div>
          )}
        </div>
      </div>

      {/* Brand Performance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Award size={16} className="text-amber-600" /> Brand Analytics & Revenue
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Sort by:</span>
            {(['revenue', 'unitsSold', 'orders'] as const).map(key => (
              <button
                key={key}
                onClick={() => {
                  if (brandSortKey === key) setBrandSortAsc(!brandSortAsc);
                  else {
                    setBrandSortKey(key);
                    setBrandSortAsc(false);
                  }
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize flex items-center gap-1 ${
                  brandSortKey === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {key} <ArrowUpDown size={10} />
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="p-3">Brand</th>
                <th className="p-3 text-right">Products in Catalog</th>
                <th className="p-3 text-right">Units Sold</th>
                <th className="p-3 text-right">Orders</th>
                <th className="p-3 text-right">Revenue</th>
                <th className="p-3 text-right">Refunds</th>
                <th className="p-3 text-right">Net Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedBrands.length > 0 ? (
                sortedBrands.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{b.brand}</td>
                    <td className="p-3 text-right text-slate-600">{b.productsCount}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{b.unitsSold}</td>
                    <td className="p-3 text-right text-slate-700">{b.orders}</td>
                    <td className="p-3 text-right font-medium text-slate-900">{formatINR(b.revenue)}</td>
                    <td className="p-3 text-right text-rose-600">{formatINR(b.refunds)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatINR(b.netSales)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">No brand data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
