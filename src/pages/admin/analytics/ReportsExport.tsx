import React, { useState } from 'react';
import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface ReportsExportProps {
  filter: any;
}

export function ReportsExport({ filter }: ReportsExportProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'sales',
      title: 'Sales Report',
      desc: 'Order numbers, order dates, customer names, subtotals, discounts, shipping, tax, totals, payment & order status.',
      columns: 'Order Number, Order Date, Customer, Subtotal, Discount, Shipping, Tax, Total, Payment Status, Order Status'
    },
    {
      id: 'orders',
      title: 'Orders Report',
      desc: 'Complete status log, delivery tracking numbers, carriers, and address records.',
      columns: 'Order ID, Customer, Items Count, Total Amount, Status, Carrier, Tracking Number, Date'
    },
    {
      id: 'products',
      title: 'Products Performance Report',
      desc: 'SKU sales numbers, units sold, order frequency, gross revenue, refunded amounts, net sales, and stock levels.',
      columns: 'Product Name, SKU, Units Sold, Orders, Revenue, Refunded, Net Sales, Current Stock'
    },
    {
      id: 'customers',
      title: 'Customers Report',
      desc: 'Anonymized customer lifetime order counts and spend numbers.',
      columns: 'Customer Name, Masked Email, Order Count, Lifetime Spend, Average Order Value'
    },
    {
      id: 'payments',
      title: 'Payments Report',
      desc: 'Razorpay transaction logs, payment status, payment method channels, created & captured dates.',
      columns: 'Payment ID, Order Number, Amount, Payment Status, Payment Method, Created Date, Captured Date'
    },
    {
      id: 'inventory',
      title: 'Inventory & Stock Report',
      desc: 'Current stock count, reserved units, threshold status, and low-stock indicators.',
      columns: 'Product Name, SKU, Current Stock, Reserved Stock, Available Stock, Low Stock Threshold, Status'
    },
    {
      id: 'tax',
      title: 'GST / Tax Compliance Report',
      desc: 'Taxable sales, CGST, SGST, and IGST breakdowns for tax filing.',
      columns: 'Order ID, Taxable Amount, CGST, SGST, IGST, Total Tax'
    },
    {
      id: 'coupons',
      title: 'Coupon Usage Report',
      desc: 'Coupon redemptions, total discount given, and revenue attributed to coupon codes.',
      columns: 'Coupon Code, Redemptions, Discount Given, Influenced Revenue, Status'
    }
  ];

  const handleDownload = (typeId: string) => {
    setDownloading(typeId);
    const query = new URLSearchParams({
      type: typeId,
      rangePreset: filter.rangePreset || 'last_30_days',
      startDate: filter.startDate || '',
      endDate: filter.endDate || ''
    }).toString();

    window.open(`/api/admin/analytics/export?${query}`, '_blank');
    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-blue-600" /> Export Business & Financial CSV Reports
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Exported reports automatically apply the currently active date range filter ({filter.rangePreset.replace('_', ' ')}).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((rep) => (
          <div key={rep.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-sm text-slate-900">{rep.title}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 uppercase">
                  CSV
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{rep.desc}</p>
              <p className="text-[11px] text-slate-400 font-mono bg-slate-50 p-2 rounded border border-slate-100 truncate mb-4">
                Columns: {rep.columns}
              </p>
            </div>

            <button
              onClick={() => handleDownload(rep.id)}
              disabled={downloading === rep.id}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              {downloading === rep.id ? (
                <>Preparing CSV...</>
              ) : (
                <>
                  <Download size={14} /> Export {rep.title} (CSV)
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
