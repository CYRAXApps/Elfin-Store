import React from 'react';
import { Tag, Truck, CheckCircle, Clock } from 'lucide-react';

interface CouponShippingAnalyticsProps {
  data: any;
  onNavigateToCoupons: () => void;
  onNavigateToOrders: () => void;
}

export function CouponShippingAnalytics({ data, onNavigateToCoupons, onNavigateToOrders }: CouponShippingAnalyticsProps) {
  if (!data?.coupons || !data?.shipping) return <div className="p-8 text-slate-500">Loading coupon & shipping analytics...</div>;

  const { coupons, shipping } = data;
  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8">
      {/* Coupon Analytics Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag size={16} className="text-blue-600" /> Coupon Performance & Promo Analytics
            </h3>
            <p className="text-xs text-slate-500">Discount allocation and total revenue influenced by active promotional codes</p>
          </div>
          <button onClick={onNavigateToCoupons} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            Manage Coupons →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Coupons Used</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{coupons.totalCouponsUsed}</h3>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Discounts Given</span>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{formatINR(coupons.totalDiscountGiven)}</h3>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Coupon Revenue Generated</span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(coupons.totalCouponRevenue)}</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="p-3">Coupon Code</th>
                <th className="p-3 text-right">Uses</th>
                <th className="p-3 text-right">Orders</th>
                <th className="p-3 text-right">Discount Given</th>
                <th className="p-3 text-right">Revenue Generated</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.couponList && coupons.couponList.length > 0 ? (
                coupons.couponList.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{c.coupon}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">{c.uses}</td>
                    <td className="p-3 text-right text-slate-700">{c.orders}</td>
                    <td className="p-3 text-right font-medium text-rose-600">{formatINR(c.discountGiven)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{formatINR(c.revenue)}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">No coupon redemptions recorded in selected timeframe.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipping Analytics Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck size={16} className="text-indigo-600" /> Logistics & Shipping Performance
            </h3>
            <p className="text-xs text-slate-500">Fulfillment speed, free vs paid shipping split, and carrier utilization</p>
          </div>
          <button onClick={onNavigateToOrders} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            Open Order Fulfillment →
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Shipping Revenue</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{formatINR(shipping.shippingCollected)}</h3>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Free Shipping Orders</span>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">{shipping.freeShippingOrders}</h3>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Paid Shipping Orders</span>
            <h3 className="text-xl font-bold text-indigo-600 mt-1">{shipping.paidShippingOrders}</h3>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase">Avg Shipping Fee</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{formatINR(shipping.avgShippingCharge)}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
