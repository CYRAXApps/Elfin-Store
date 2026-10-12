import React from 'react';
import { Users, UserPlus, Repeat, ShoppingBag, DollarSign, Shield } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface CustomerAnalyticsProps {
  data: any;
  onNavigateToCustomers: () => void;
}

export function CustomerAnalytics({ data, onNavigateToCustomers }: CustomerAnalyticsProps) {
  if (!data?.customers) return <div className="p-8 text-slate-500">Loading customer analytics...</div>;

  const { customers } = data;
  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const compareData = [
    {
      type: 'Selected Period',
      'New Customers': customers.newCustomers || 0,
      'Returning Customers': customers.returningCustomers || 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Customer KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Customers</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{customers.totalCustomers}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">New Customers</span>
          <h3 className="text-xl font-bold text-blue-600 mt-1">{customers.newCustomers}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Returning Customers</span>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">{customers.returningCustomers}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Customers w/ Orders</span>
          <h3 className="text-xl font-bold text-indigo-600 mt-1">{customers.customersWithOrders}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Customer Spend</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{formatINR(customers.avgCustomerSpend)}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Avg Orders / Customer</span>
          <h3 className="text-xl font-bold text-slate-900 mt-1">{customers.avgOrdersPerCustomer}</h3>
        </div>
      </div>

      {/* New vs Returning Customer Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">New vs Returning Customers</h3>
            <p className="text-xs text-slate-500 mb-4">Ratio of new user signups against repeat buyers in selected timeframe</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData}>
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="New Customers" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Returning Customers" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Customers by Lifetime Spend</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Shield size={12} className="text-blue-600" /> Customer email privacy protected
              </p>
            </div>
            <button
              onClick={onNavigateToCustomers}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All Customers →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Masked Email</th>
                  <th className="p-3 text-right">Total Orders</th>
                  <th className="p-3 text-right">Lifetime Spend</th>
                  <th className="p-3 text-right">Avg Order Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.topCustomers && customers.topCustomers.length > 0 ? (
                  customers.topCustomers.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.name}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{c.emailMasked}</td>
                      <td className="p-3 text-right font-semibold text-slate-800">{c.orderCount}</td>
                      <td className="p-3 text-right font-bold text-emerald-700">{formatINR(c.totalSpend)}</td>
                      <td className="p-3 text-right text-slate-900">{formatINR(c.aov)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">No customer records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
