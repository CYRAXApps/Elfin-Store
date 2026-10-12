import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  X, 
  Share2, 
  CheckCircle2, 
  Receipt, 
  FileText, 
  Building2, 
  Phone, 
  Mail, 
  Copy, 
  ExternalLink,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Download,
  Eye,
  Calendar,
  User,
  Tag,
  Percent,
  Clock
} from 'lucide-react';
import { useSiteSettings, defaultPosSettings, type PosSettings } from '../../../context/SiteSettingsContext';

interface PosInvoiceModalProps {
  order: any;
  onClose: () => void;
  onNewSale?: () => void;
}

export const PosInvoiceModal: React.FC<PosInvoiceModalProps> = ({ order, onClose, onNewSale = () => {} }) => {
  const { settings } = useSiteSettings();
  const posSettings: PosSettings = { ...defaultPosSettings, ...(settings.pos || {}) };
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>(
    posSettings.invoiceFormat === 'a4' ? 'a4' : 'thermal'
  );
  const [viewMode, setViewMode] = useState<'preview' | 'details'>('preview');
  const [copied, setCopied] = useState(false);

  // Auto-print effect if configured in POS settings
  useEffect(() => {
    if (posSettings.autoPrintAfterSale) {
      const timer = setTimeout(() => {
        window.print();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [posSettings.autoPrintAfterSale]);

  if (!order) return null;

  const seller = order.sellerDetails || {
    businessName: settings.general?.storeName || 'ELECTRO STORE',
    businessAddress: settings.general?.businessAddress || '',
    businessPhone: settings.general?.phone || '',
    businessEmail: settings.general?.storeEmail || '',
    gstin: settings.tax?.gstin || '',
    pan: settings.contact?.pan || ''
  };

  const invoiceNum = order.invoiceNumber || `EST-POS-${order.id?.slice(0, 8).toUpperCase()}`;
  const orderDate = (order.createdAt && typeof order.createdAt.toDate === 'function')
    ? order.createdAt.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date(order.createdAt || Date.now()).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const buyer = order.buyerDetails || order.shippingAddress || {
    name: order.customerName || 'Walk-in Customer',
    phone: order.customerPhone || '',
    email: order.customerEmail || '',
    gstin: ''
  };

  const payment = order.payment || {
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    amountPaid: order.grandTotal,
    changeGiven: 0
  };

  const splitDetails: any[] = Array.isArray(payment.splitDetails) 
    ? payment.splitDetails 
    : (Array.isArray(payment.payments) ? payment.payments : []);
  const isSplitPayment = payment.paymentMethod === 'split' || splitDetails.length > 0;

  const paymentStatus = payment.paymentStatus || 'paid';
  const isPaid = paymentStatus === 'paid' || paymentStatus === 'captured';

  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const subtotal = order.subtotal || 0;
  const discount = order.discount || 0;
  const taxableAmount = order.taxableAmount || Math.max(0, subtotal - discount);
  const tax = order.tax || 0;
  const cgst = order.cgst !== undefined ? order.cgst : Math.round((tax / 2) * 100) / 100;
  const sgst = order.sgst !== undefined ? order.sgst : Math.round((tax - cgst) * 100) / 100;
  const igst = order.igst || 0;
  const grandTotal = order.grandTotal || order.totalAmount || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const custPhone = (buyer.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = custPhone.length === 10 ? `91${custPhone}` : custPhone;
    
    const paymentMethodText = isSplitPayment
      ? `SPLIT PAYMENT (${splitDetails.map((p: any) => `${p.method.toUpperCase()}: ₹${Number(p.amount).toLocaleString('en-IN')}`).join(', ')})`
      : String(payment.paymentMethod).toUpperCase();

    const message = 
      `*${seller.businessName} - Tax Invoice Receipt*\n` +
      `----------------------------------------\n` +
      `*Invoice No:* ${invoiceNum}\n` +
      `*Date:* ${orderDate}\n` +
      `*Customer:* ${buyer.name}\n` +
      `*Items:* ${items.length} product(s)\n` +
      `*Grand Total:* ₹${grandTotal.toLocaleString('en-IN')}\n` +
      `*Payment Method:* ${paymentMethodText}\n` +
      `*Payment Status:* ${isPaid ? 'PAID' : paymentStatus.toUpperCase()}\n` +
      `----------------------------------------\n` +
      `Thank you for shopping with us! For assistance call ${seller.businessPhone}.`;

    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  const handleCopySummary = () => {
    const paymentText = isSplitPayment 
      ? `Split (${splitDetails.map((p: any) => `${p.method.toUpperCase()}: ₹${p.amount}`).join(', ')})` 
      : String(payment.paymentMethod).toUpperCase();
    const text = `Invoice #${invoiceNum} | Customer: ${buyer.name} | Total: ₹${grandTotal.toLocaleString('en-IN')} | Payment: ${paymentText} | Status: ${isPaid ? 'PAID' : paymentStatus.toUpperCase()} | ${seller.businessName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadInvoice = () => {
    const splitRowsHtml = isSplitPayment && splitDetails.length > 0
      ? `<div style="font-size: 11px; margin-top: 4px; color: #475569;">
          ${splitDetails.map((p: any) => `&bull; ${p.method.toUpperCase()}: ₹${Number(p.amount).toLocaleString('en-IN')}${p.reference ? ` (Ref: ${p.reference})` : ''}${p.cardLast4 ? ` (..${p.cardLast4})` : ''}`).join('<br>')}
        </div>`
      : '';

    const invoiceHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${invoiceNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; line-height: 1.5; font-size: 13px; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
    .store-name { font-size: 20px; font-weight: 800; text-transform: uppercase; }
    .meta-grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
    td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
    .text-right { text-align: right; }
    .totals { margin-left: auto; width: 280px; margin-top: 16px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .grand-total { font-weight: 900; font-size: 16px; border-top: 2px solid #0f172a; padding-top: 8px; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; background: #dcfce7; color: #166534; }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${seller.businessName}</div>
    <div>${seller.businessAddress}</div>
    <div>Phone: ${seller.businessPhone} | GSTIN: ${seller.gstin}</div>
  </div>
  <div class="meta-grid">
    <div>
      <strong>Invoice No:</strong> ${invoiceNum}<br>
      <strong>Date:</strong> ${orderDate}<br>
      <strong>Payment:</strong> ${isSplitPayment ? 'SPLIT PAYMENT' : String(payment.paymentMethod).toUpperCase()} (<span class="status-badge">${paymentStatus.toUpperCase()}</span>)
      ${splitRowsHtml}
    </div>
    <div class="text-right">
      <strong>Customer:</strong> ${buyer.name}<br>
      ${buyer.phone ? `<strong>Phone:</strong> ${buyer.phone}<br>` : ''}
      ${buyer.gstin ? `<strong>GSTIN:</strong> ${buyer.gstin}<br>` : ''}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Price</th>
        <th class="text-right">Discount</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it: any) => `
        <tr>
          <td>${it.name} ${it.sku ? `<small>(${it.sku})</small>` : ''}</td>
          <td class="text-right">${it.quantity || 1}</td>
          <td class="text-right">₹${Number(it.unitPrice || 0).toLocaleString('en-IN')}</td>
          <td class="text-right">${it.discount > 0 ? `-₹${it.discount}` : '—'}</td>
          <td class="text-right">₹${Number((Number(it.quantity || 1) * Number(it.unitPrice || 0)) - Number(it.discount || 0)).toLocaleString('en-IN')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-row"><span>Subtotal:</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
    ${discount > 0 ? `<div class="totals-row"><span>Discount:</span><span>-₹${discount.toLocaleString('en-IN')}</span></div>` : ''}
    <div class="totals-row"><span>Taxable:</span><span>₹${taxableAmount.toLocaleString('en-IN')}</span></div>
    <div class="totals-row"><span>GST:</span><span>₹${tax.toLocaleString('en-IN')}</span></div>
    <div class="totals-row grand-total"><span>Grand Total:</span><span>₹${grandTotal.toLocaleString('en-IN')}</span></div>
  </div>
  <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 11px;">
    Thank you for your business! Goods once sold carry manufacturer warranty.
  </div>
</body>
</html>`;

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${invoiceNum}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] overflow-y-auto flex flex-col border border-slate-200 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        
        {/* ======================================================== */}
        {/* TOP CONTROLS BAR (Hidden during printing) */}
        {/* ======================================================== */}
        <div className="sticky top-0 bg-slate-900 text-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 z-10 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide">Sale Completed</span>
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  #{invoiceNum}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                  isPaid ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'
                }`}>
                  {paymentStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400">Inventory updated & order recorded in database</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-medium">
              <button
                onClick={() => setViewMode('details')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'details' 
                    ? 'bg-blue-600 text-white shadow-sm font-semibold' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="View sale summary"
              >
                <Eye size={13} /> Summary
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'preview' 
                    ? 'bg-blue-600 text-white shadow-sm font-semibold' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="View printable format"
              >
                <FileText size={13} /> Invoice
              </button>
            </div>

            {/* Format Toggle (When in invoice preview) */}
            {viewMode === 'preview' && (
              <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-medium">
                <button
                  onClick={() => setPrintFormat('thermal')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    printFormat === 'thermal' 
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Receipt size={13} /> Thermal (80mm)
                </button>
                <button
                  onClick={() => setPrintFormat('a4')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${
                    printFormat === 'a4' 
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold' 
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText size={13} /> A4 Tax Invoice
                </button>
              </div>
            )}

            {/* Action 1: Print */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Printer size={14} /> Print
            </button>

            {/* Action 2: Download */}
            <button
              onClick={handleDownloadInvoice}
              title="Download HTML/PDF Printable Invoice"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700 cursor-pointer"
            >
              <Download size={14} /> Download
            </button>

            {/* Action 3: WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              title="Share receipt via WhatsApp"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <Share2 size={14} /> WhatsApp
            </button>

            {/* Action 4: New Sale */}
            <button
              onClick={onNewSale}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              New Sale <ArrowRight size={14} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SALE COMPLETED SUMMARY BANNER (Requirement 4 details) */}
        {/* ======================================================== */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3.5 print:hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10.5px]">Invoice ID</span>
              <span className="font-mono font-bold text-slate-900">{invoiceNum}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px]">Date & Time</span>
              <span className="font-medium text-slate-800">{orderDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px]">Customer</span>
              <span className="font-bold text-slate-900">{buyer.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px]">Items Sold</span>
              <span className="font-bold text-slate-900">{items.length} product(s)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px]">Payment Method</span>
              <span className="font-bold uppercase text-slate-900">{payment.paymentMethod}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10.5px]">Grand Total</span>
              <span className="font-mono font-black text-blue-700 text-sm">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW MODE: DETAILS / SUMMARY */}
        {/* ======================================================== */}
        {viewMode === 'details' && (
          <div className="p-6 space-y-6 print:hidden">
            {/* Items Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Purchased Products ({items.length})
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Discount</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{it.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">SKU: {it.sku}</div>
                        </td>
                        <td className="p-3 text-right font-mono">₹{Number(it.unitPrice || 0).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center font-bold">{it.quantity || 1}</td>
                        <td className="p-3 text-right text-emerald-600 font-mono">
                          {it.discount > 0 ? `-₹${it.discount}` : '—'}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 font-mono">
                          ₹{Number((Number(it.quantity || 1) * Number(it.unitPrice || 0)) - Number(it.discount || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Payment Breakdown</h4>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Method:</span>
                  {isSplitPayment ? (
                    <span className="font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Split Payment
                    </span>
                  ) : (
                    <span className="font-bold uppercase text-slate-900">{payment.paymentMethod}</span>
                  )}
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Status:</span>
                  <span className={`font-bold uppercase px-2 py-0.5 rounded text-[10.5px] ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {paymentStatus}
                  </span>
                </div>

                {isSplitPayment && splitDetails.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <p className="font-bold text-slate-700 text-[10.5px]">Payment Breakdown:</p>
                    {splitDetails.map((entry: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-slate-700 font-mono">
                        <div>
                          <span className="font-bold uppercase text-slate-900">{entry.method}</span>
                          {entry.method === 'cash' && entry.cashTendered && entry.cashTendered > entry.amount && (
                            <span className="text-[10px] text-slate-500 block font-sans">
                              Tendered: ₹{Number(entry.cashTendered || 0).toLocaleString('en-IN')} (Change: ₹{Number(entry.changeGiven || (entry.cashTendered - entry.amount) || 0).toLocaleString('en-IN')})
                            </span>
                          )}
                          {entry.method === 'upi' && entry.reference && (
                            <span className="text-[10px] text-slate-500 block font-mono">
                              Ref: {entry.reference}
                            </span>
                          )}
                          {entry.method === 'card' && (
                            <span className="text-[10px] text-slate-500 block font-sans">
                              {entry.cardType || 'Card'} {entry.cardLast4 ? `(ending ${entry.cardLast4})` : ''} {entry.reference ? `Ref: ${entry.reference}` : ''}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">₹{Number(entry.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Amount Paid:</span>
                  <span className="font-bold font-mono text-slate-900">₹{Number(payment.amountPaid || grandTotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {Boolean(payment.changeGiven && payment.changeGiven > 0) && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Change Returned:</span>
                    <span className="font-bold font-mono">₹{Number(payment.changeGiven || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {!isSplitPayment && payment.referenceNumber && (
                  <div className="flex justify-between text-slate-600">
                    <span>Ref / UTR:</span>
                    <span className="font-mono text-slate-900">{payment.referenceNumber}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Bill Totals</h4>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Amount:</span>
                  <span className="font-mono text-slate-900">₹{taxableAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Total:</span>
                  <span className="font-mono text-slate-900">₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-300 text-base font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-blue-700 font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCopySummary}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Copy size={14} /> {copied ? 'Copied!' : 'Copy Summary'}
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt size={14} /> View Printable Invoice
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PRINTABLE CONTENT AREA (Thermal or A4) */}
        {/* ======================================================== */}
        {viewMode === 'preview' && (
          <div className="p-4 sm:p-8 flex justify-center bg-slate-100/70 print:bg-white print:p-0">
            
            {/* FORMAT A: THERMAL RECEIPT */}
            {printFormat === 'thermal' && (
              <div 
                id="pos-thermal-receipt" 
                className={`w-full ${posSettings.printerWidthMm === 58 ? 'max-w-[260px]' : 'max-w-[340px]'} bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-lg font-mono text-[11px] leading-relaxed text-slate-900 print:shadow-none print:border-none ${posSettings.printerWidthMm === 58 ? 'print:w-[58mm] print:max-w-[58mm]' : 'print:w-[80mm] print:max-w-[80mm]'} print:p-2 print:m-0`}
              >
                {/* Header */}
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  {posSettings.showStoreLogo !== false && (settings.general?.logo || settings.general?.favicon) && (
                    <img 
                      src={settings.general?.logo || settings.general?.favicon} 
                      alt="Logo" 
                      className="h-8 mx-auto mb-1 object-contain"
                    />
                  )}
                  <div className="font-black text-base uppercase tracking-tight text-slate-950 font-sans">
                    {seller.businessName}
                  </div>
                  {posSettings.showStoreAddress !== false && (
                    <p className="text-[10px] text-slate-600 mt-0.5">{seller.businessAddress}</p>
                  )}
                  {posSettings.showStorePhone !== false && seller.businessPhone && (
                    <p className="text-[10px] text-slate-600">Ph: {seller.businessPhone}</p>
                  )}
                  {posSettings.showGstin !== false && seller.gstin && (
                    <p className="text-[10px] font-bold text-slate-800 mt-1">GSTIN: {seller.gstin}</p>
                  )}
                  <div className="inline-block mt-2 px-2 py-0.5 bg-slate-100 border border-slate-300 text-[10px] font-bold uppercase rounded">
                    POS Counter Receipt
                  </div>
                </div>

                {/* Meta Info */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice No:</span>
                    <span className="font-bold text-slate-900">{invoiceNum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date/Time:</span>
                    <span>{orderDate}</span>
                  </div>
                  {posSettings.showCustomerDetails !== false && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer:</span>
                        <span className="font-semibold text-slate-900">{buyer.name}</span>
                      </div>
                      {buyer.phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Mobile:</span>
                          <span>{buyer.phone}</span>
                        </div>
                      )}
                      {buyer.gstin && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cust GSTIN:</span>
                          <span>{buyer.gstin}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className="font-bold uppercase text-emerald-700">{paymentStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cashier:</span>
                    <span>{order.cashier?.name || 'Ritam Saha'}</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="py-2.5 border-b border-dashed border-slate-300">
                  <div className="flex justify-between font-bold text-[10px] uppercase pb-1 border-b border-slate-200 mb-1.5">
                    <span className="w-1/2">Item Description</span>
                    <span className="w-1/6 text-center">Qty</span>
                    <span className="w-1/3 text-right">Amount</span>
                  </div>

                  <div className="space-y-2">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="text-[10.5px]">
                        <div className="flex justify-between">
                          <span className="w-1/2 font-semibold text-slate-900 leading-tight">
                            {item.name}
                          </span>
                          <span className="w-1/6 text-center text-slate-700">
                            {item.quantity || 1}
                          </span>
                          <span className="w-1/3 text-right font-bold text-slate-900">
                            ₹{Number((Number(item.quantity || 1) * Number(item.unitPrice || 0)) - Number(item.discount || 0)).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[9.5px] text-slate-500 pl-1">
                          <span>₹{Number(item.unitPrice || 0).toLocaleString('en-IN')} each</span>
                          {posSettings.showDiscount !== false && item.discount > 0 && (
                            <span className="text-emerald-700">-₹{item.discount} off</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Breakdown */}
                <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10.5px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {posSettings.showDiscount !== false && discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Total Discount:</span>
                      <span>-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {posSettings.showTaxBreakdown !== false && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Amount:</span>
                        <span>₹{taxableAmount.toLocaleString('en-IN')}</span>
                      </div>
                      {igst > 0 ? (
                        <div className="flex justify-between text-slate-600">
                          <span>IGST (18%):</span>
                          <span>₹{igst.toLocaleString('en-IN')}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>CGST (9%):</span>
                            <span>₹{cgst.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>SGST (9%):</span>
                            <span>₹{sgst.toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-baseline font-black text-xs text-slate-950 pt-1.5 border-t border-slate-200">
                    <span>NET GRAND TOTAL:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment Breakdown */}
                {posSettings.showPaymentMethod !== false && (
                  <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Mode:</span>
                      <span className="font-bold uppercase">{isSplitPayment ? 'SPLIT PAYMENT' : payment.paymentMethod}</span>
                    </div>
                    {isSplitPayment && splitDetails.length > 0 && (
                      <div className="space-y-0.5 py-1 border-y border-dotted border-slate-200 my-1">
                        {splitDetails.map((sp: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span className="capitalize">{sp.method} {sp.cardLast4 ? `(..${sp.cardLast4})` : ''}:</span>
                            <span className="font-bold font-mono">₹{Number(sp.amount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Tendered:</span>
                      <span>₹{Number(payment.amountPaid || grandTotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {Boolean(payment.changeGiven && payment.changeGiven > 0) && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Change Given:</span>
                        <span>₹{Number(payment.changeGiven || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {!isSplitPayment && payment.referenceNumber && (
                      <div className="flex justify-between text-slate-500">
                        <span>Ref / UTR:</span>
                        <span className="font-mono">{payment.referenceNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 text-center text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-800">
                    {posSettings.receiptFooterNote || 'THANK YOU FOR YOUR VISIT!'}
                  </p>
                  <p>Exchange allowed within 7 days with bill.</p>
                  <p className="text-[9px] text-slate-400 mt-1">Computer Generated POS Receipt</p>
                </div>
              </div>
            )}

            {/* FORMAT B: A4 FULL TAX INVOICE */}
            {printFormat === 'a4' && (
              <div 
                id="pos-a4-invoice" 
                className="w-full max-w-[760px] bg-white p-8 sm:p-10 rounded-xl border border-slate-200 shadow-lg text-slate-900 font-sans print:shadow-none print:border-none print:w-full print:p-4 print:m-0"
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                  <div>
                    {posSettings.showStoreLogo !== false && (settings.general?.logo || settings.general?.favicon) && (
                      <img 
                        src={settings.general?.logo || settings.general?.favicon} 
                        alt="Logo" 
                        className="h-10 mb-2 object-contain"
                      />
                    )}
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                      {seller.businessName}
                    </h1>
                    {posSettings.showStoreAddress !== false && (
                      <p className="text-xs text-slate-600 mt-1 max-w-sm leading-relaxed">{seller.businessAddress}</p>
                    )}
                    <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                      {posSettings.showStorePhone !== false && seller.businessPhone && (
                        <p><span className="font-bold text-slate-800">Phone:</span> {seller.businessPhone}</p>
                      )}
                      {seller.businessEmail && (
                        <p><span className="font-bold text-slate-800">Email:</span> {seller.businessEmail}</p>
                      )}
                      {posSettings.showGstin !== false && seller.gstin && (
                        <p><span className="font-bold text-slate-800">GSTIN:</span> {seller.gstin} {seller.pan ? `| PAN: ${seller.pan}` : ''}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-block bg-slate-900 text-white font-bold text-sm px-3 py-1 uppercase tracking-wider rounded">
                      TAX INVOICE
                    </div>
                    <div className="mt-3 text-xs space-y-1">
                      <p><span className="text-slate-500">Invoice No:</span> <span className="font-bold font-mono text-slate-900">{invoiceNum}</span></p>
                      <p><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-900">{orderDate}</span></p>
                      <p><span className="text-slate-500">POS Counter:</span> <span className="font-semibold text-slate-900">Billing Counter 01</span></p>
                      <p><span className="text-slate-500">Status:</span> <span className="font-bold uppercase text-emerald-700">{paymentStatus}</span></p>
                    </div>
                  </div>
                </div>

                {/* Buyer Details */}
                {posSettings.showCustomerDetails !== false && (
                  <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Billed To / Buyer</span>
                      <p className="font-bold text-slate-900 text-sm mt-1">{buyer.name}</p>
                      {buyer.phone && <p className="text-slate-600 mt-0.5">Phone: {buyer.phone}</p>}
                      {buyer.email && <p className="text-slate-600">Email: {buyer.email}</p>}
                      {buyer.address && <p className="text-slate-600 mt-0.5">{buyer.address}, {buyer.city}</p>}
                    </div>
                    <div>
                      <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Tax & Counter Info</span>
                      {buyer.gstin ? (
                        <p className="font-bold text-slate-900 mt-0.5">Buyer GSTIN: {buyer.gstin}</p>
                      ) : (
                        <p className="text-slate-600 mt-0.5">Customer Type: Consumer / Retail</p>
                      )}
                      <p className="text-slate-600 mt-0.5">Cashier: {order.cashier?.name || 'Ritam Saha'}</p>
                      {posSettings.showPaymentMethod !== false && (
                        <p className="text-slate-600">
                          Payment: <span className="font-bold uppercase text-emerald-700">
                            {isSplitPayment ? `SPLIT (${splitDetails.map((p: any) => `${p.method.toUpperCase()}: ₹${Number(p.amount).toLocaleString('en-IN')}`).join(', ')})` : payment.paymentMethod}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div className="overflow-x-auto my-6 border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                        <th className="p-3">#</th>
                        <th className="p-3">Product Description</th>
                        <th className="p-3">HSN</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Discount</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</div>
                          </td>
                          <td className="p-3 font-mono text-slate-600">{item.hsnCode || '8517'}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{item.quantity || 1}</td>
                          <td className="p-3 text-right">₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-emerald-600">
                            {item.discount > 0 ? `-₹${item.discount}` : '—'}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ₹{Number((Number(item.quantity || 1) * Number(item.unitPrice || 0)) - Number(item.discount || 0)).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Calculation */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-2 text-xs border-t border-slate-200 pt-3">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {posSettings.showDiscount !== false && discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Total Discount:</span>
                        <span className="font-semibold">-₹{discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {posSettings.showTaxBreakdown !== false && (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>Taxable Amount:</span>
                          <span className="font-semibold text-slate-800">₹{taxableAmount.toLocaleString('en-IN')}</span>
                        </div>
                        {igst > 0 ? (
                          <div className="flex justify-between text-slate-600">
                            <span>IGST (18%):</span>
                            <span className="font-semibold text-slate-800">₹{igst.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-slate-600">
                              <span>CGST (9%):</span>
                              <span className="font-semibold text-slate-800">₹{cgst.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>SGST (9%):</span>
                              <span className="font-semibold text-slate-800">₹{sgst.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div className="flex justify-between text-sm font-black text-slate-950 border-t-2 border-slate-900 pt-2">
                      <span>Grand Total:</span>
                      <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures & Terms */}
                <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-[11px] text-slate-500">
                  <div>
                    <p className="font-bold text-slate-700">Terms & Conditions:</p>
                    <p className="mt-1">1. Goods once sold carry official brand warranty.</p>
                    <p>2. Keep this original tax invoice safe for warranty claims.</p>
                    {posSettings.receiptFooterNote && (
                      <p className="mt-2 text-slate-700 font-semibold italic">{posSettings.receiptFooterNote}</p>
                    )}
                  </div>
                  <div className="text-right flex flex-col justify-end items-end">
                    <div className="h-10 border-b border-slate-300 w-40 mb-1"></div>
                    <p className="font-bold text-slate-800">Authorized Signatory</p>
                    <p className="text-[10px] text-slate-400">{seller.businessName}</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
