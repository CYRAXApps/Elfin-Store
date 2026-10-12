import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, MapPin, Phone, Mail } from 'lucide-react';
import { Order } from '../types';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { PincodeDisplay } from './common/PincodeDisplay';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const { settings } = useSiteSettings();
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const seller = order.sellerDetails || {
    businessName: settings.general?.storeName || settings.contact?.businessName || 'ELECTRO STORE',
    businessAddress: settings.general?.businessAddress || settings.contact?.address || '',
    businessPhone: settings.general?.phone || settings.contact?.phone || '',
    businessEmail: settings.general?.storeEmail || settings.contact?.email || '',
    gstin: settings.tax?.gstin || settings.contact?.gstin || '',
    pan: settings.contact?.pan || '',
    supportEmail: settings.general?.supportEmail || settings.contact?.supportEmail || '',
    supportPhone: settings.general?.phone || settings.contact?.phone || ''
  };

  const buyer = order.shippingAddress;
  const billing = order.billingAddress || order.shippingAddress;
  const invoiceNum = order.invoiceNumber || `EST-2026-${order.id.slice(0, 8).toUpperCase()}`;
  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');
  
  const subtotal = Number(order.subtotal || (order.items || []).reduce((sum, item) => sum + Number(item.totalPrice ?? ((item.unitPrice ?? item.price ?? 0) * (item.quantity || 1))), 0));
  const discount = Number(order.discount || 0);
  const taxableAmount = Math.max(0, subtotal - discount);

  const isGstActive = order.tax !== undefined
    ? Number(order.tax) > 0
    : (settings.tax?.gstEnabled !== false && Number(settings.tax?.taxRate ?? 18) > 0);
  const totalTax = isGstActive
    ? (order.tax !== undefined ? Number(order.tax) : Math.round((taxableAmount * 0.18) * 100) / 100)
    : 0;
  const effectiveTaxRate = isGstActive ? (Number((order as any).taxRate || settings.tax?.taxRate || 18)) : 0;
  const halfRate = (effectiveTaxRate / 2).toFixed(1);
  const cgst = isGstActive ? Math.round((totalTax / 2) * 100) / 100 : 0;
  const sgst = isGstActive ? Math.round((totalTax / 2) * 100) / 100 : 0;
  const shippingCharge = Number(order.shippingCharge || 0);
  const grandTotal = Number(order.grandTotal || order.totalAmount || (taxableAmount + totalTax + shippingCharge));

  const logoUrl = settings.branding?.primaryLogo || settings.general?.storeLogoUrl || '/assets/logo.svg';
  const storeName = settings.general?.storeName || settings.branding?.brandName || 'Store';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col border border-slate-100 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 print:hidden">
          <div className="flex items-center gap-2">
            <span className={`font-bold text-xs px-2.5 py-1 rounded-full border ${isGstActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              {isGstActive ? 'Tax Invoice' : 'Commercial Invoice'}
            </span>
            <span className="text-slate-500 text-sm font-medium">#{invoiceNum}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Printer size={16} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-8 sm:p-10 space-y-8 text-slate-800 font-sans" id="printable-invoice">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            <div>
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-10 object-contain mb-3 max-w-[200px]" />
              ) : (
                <div className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                  {storeName}
                </div>
              )}
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{seller.businessName}</p>
              {seller.businessAddress && <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">{seller.businessAddress}</p>}
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                {isGstActive && seller.gstin && <p><span className="font-semibold text-slate-700">GSTIN:</span> {seller.gstin}</p>}
                {seller.pan && <p><span className="font-semibold text-slate-700">PAN:</span> {seller.pan}</p>}
                {seller.businessEmail && <p><span className="font-semibold text-slate-700">Email:</span> {seller.businessEmail}</p>}
                {seller.businessPhone && <p><span className="font-semibold text-slate-700">Phone:</span> {seller.businessPhone}</p>}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold uppercase rounded-md tracking-wider mb-3">
                {isGstActive ? 'Original Tax Invoice' : 'Original Invoice / Receipt'}
              </span>
              <table className="text-xs text-slate-600 sm:ml-auto">
                <tbody>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Invoice No:</td>
                    <td className="font-bold text-slate-900 py-1">{invoiceNum}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Invoice Date:</td>
                    <td className="text-slate-800 py-1">{orderDate}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Order Ref ID:</td>
                    <td className="text-slate-800 py-1 font-mono text-[11px]">#{order.id.slice(0, 10).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Payment Mode:</td>
                    <td className="text-slate-800 py-1 capitalize font-medium">{order.payment?.provider || 'Razorpay (Online)'}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Payment Status:</td>
                    <td className="py-1">
                      <span className={`font-bold uppercase text-[11px] ${order.payment?.paymentStatus === 'captured' ? 'text-green-600' : 'text-orange-600'}`}>
                        {order.payment?.paymentStatus === 'captured' ? 'Paid' : (order.payment?.paymentStatus || 'Pending')}
                      </span>
                    </td>
                  </tr>
                  {order.payment?.razorpayPaymentId && (
                    <tr>
                      <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Transaction ID:</td>
                      <td className="text-slate-600 py-1 font-mono text-[11px]">{order.payment.razorpayPaymentId}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing & Shipping Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs bg-slate-50/80 p-5 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-blue-600">Bill To (Customer)</p>
              <p className="font-bold text-slate-800 text-sm">{billing.fullName || 'Valued Customer'}</p>
              {billing.phone && <p className="text-slate-600 mt-0.5">Phone: {billing.phone}</p>}
              <p className="text-slate-600 mt-1 leading-relaxed">
                {billing.street}{billing.addressLine2 ? `, ${billing.addressLine2}` : ''}
                {billing.landmark ? `, Landmark: ${billing.landmark}` : ''}
              </p>
              <p className="text-slate-600">{billing.city}, {billing.state} - <PincodeDisplay pincode={billing.zipCode} /></p>
              <p className="text-slate-600">{billing.country || 'India'}</p>
            </div>

            <div>
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2 text-blue-600">Ship To (Delivery Address)</p>
              <p className="font-bold text-slate-800 text-sm">{buyer.fullName || 'Valued Customer'}</p>
              {buyer.phone && <p className="text-slate-600 mt-0.5">Phone: {buyer.phone}</p>}
              <p className="text-slate-600 mt-1 leading-relaxed">
                {buyer.street}{buyer.addressLine2 ? `, ${buyer.addressLine2}` : ''}
                {buyer.landmark ? `, Landmark: ${buyer.landmark}` : ''}
              </p>
              <p className="text-slate-600">{buyer.city}, {buyer.state} - <PincodeDisplay pincode={buyer.zipCode} /></p>
              <p className="text-slate-600">{buyer.country || 'India'}</p>
              {order.carrier && (
                <p className="text-slate-700 mt-2 font-medium">
                  Shipped via: <span className="font-bold">{order.carrier}</span> {order.trackingNumber && `(Tracking: ${order.trackingNumber})`}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">HSN/SAC</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  {isGstActive && <th className="p-3 text-center">GST %</th>}
                  <th className="p-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(order.items || []).map((item, index) => {
                  const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
                  const quantity = Number(item.quantity || 1);
                  const lineTotal = Number(item.totalPrice ?? (unitPrice * quantity));
                  return (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center text-slate-400 font-medium">{index + 1}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        {item.sku && <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">{item.hsnCode || '8517'}</td>
                      <td className="p-3 text-center font-semibold text-slate-800">{quantity}</td>
                      <td className="p-3 text-right text-slate-700">₹{Number(unitPrice || 0).toLocaleString('en-IN')}</td>
                      {isGstActive && (
                        <td className="p-3 text-center text-slate-600 font-medium">{item.taxRate || effectiveTaxRate}%</td>
                      )}
                      <td className="p-3 text-right font-bold text-slate-900">₹{Number(lineTotal || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculation & Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 max-w-sm space-y-2">
              <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Terms & Conditions:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                <li>Goods once sold are covered by manufacturer warranty as applicable.</li>
                <li>Return & replacement eligible within 7 days of delivery in original packaging.</li>
                {isGstActive ? (
                  <li>This is an electronically generated valid tax invoice under Indian GST law.</li>
                ) : (
                  <li>This is an electronically generated valid sales receipt and proof of purchase.</li>
                )}
              </ul>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 py-1">
                <span>Subtotal (Gross):</span>
                <span className="font-semibold text-slate-800">₹{Number(subtotal || 0).toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-600 py-1 font-medium">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span>-₹{Number(discount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              {isGstActive && (
                <>
                  <div className="flex justify-between text-slate-600 py-1">
                    <span>Taxable Amount:</span>
                    <span className="font-semibold text-slate-800">₹{Number(taxableAmount || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 py-1">
                    <span>CGST ({halfRate}%):</span>
                    <span className="font-medium text-slate-700">₹{Number(cgst || 0).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 py-1">
                    <span>SGST ({halfRate}%):</span>
                    <span className="font-medium text-slate-700">₹{Number(sgst || 0).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-slate-600 py-1">
                <span>Shipping & Delivery:</span>
                <span className="font-semibold text-slate-800">
                  {shippingCharge === 0 ? 'FREE' : `₹${Number(shippingCharge || 0).toLocaleString('en-IN')}`}
                </span>
              </div>

              <div className="border-t-2 border-slate-900 pt-2.5 mt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Total Amount (INR):</span>
                <span className="text-base text-blue-600">₹{Number(grandTotal || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer & Authorized Signatory */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-600 mb-0.5">Thank you for shopping with ELECTRO STORE!</p>
              <p>For support, contact {seller.supportEmail} or call {seller.supportPhone}</p>
            </div>
            <div className="text-right sm:text-right">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-8">For {seller.businessName}</div>
              <div className="border-t border-slate-300 pt-1 font-semibold text-slate-600 text-[11px]">
                Authorized Signatory
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
