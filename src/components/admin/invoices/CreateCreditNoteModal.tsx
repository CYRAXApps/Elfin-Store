import React, { useState, useEffect } from 'react';
import { X, FileText, AlertCircle, CheckCircle2, ArrowRight, ShieldAlert, Loader2, IndianRupee } from 'lucide-react';
import { Order, ReturnRequest, CreditNote, CreditNoteItem } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useSiteSettings } from '../../../context/SiteSettingsContext';

interface CreateCreditNoteModalProps {
  order?: Order | null;
  initialOrder?: Order | null;
  returnRequest?: ReturnRequest | null;
  initialReturnRequest?: ReturnRequest | null;
  onClose: () => void;
  onSuccess: (creditNote: CreditNote) => void;
}

export function CreateCreditNoteModal({
  order: propOrder,
  initialOrder,
  returnRequest: propReturnRequest,
  initialReturnRequest,
  onClose,
  onSuccess
}: CreateCreditNoteModalProps) {
  const order = propOrder || initialOrder;
  const returnRequest = propReturnRequest || initialReturnRequest;
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [orderId, setOrderId] = useState<string>(order?.id || returnRequest?.orderId || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    order?.invoiceNumber || order?.posInvoiceNumber || returnRequest?.invoiceNumber || ''
  );
  const [customerName, setCustomerName] = useState<string>(
    order?.shippingAddress?.fullName || returnRequest?.customerName || ''
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    order?.shippingAddress?.email || order?.customerEmail || returnRequest?.customerEmail || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    order?.shippingAddress?.phone || order?.customerPhone || returnRequest?.customerPhone || ''
  );
  const [customerGstin, setCustomerGstin] = useState<string>('');

  const [reason, setReason] = useState<string>(
    returnRequest ? `Return #${returnRequest.returnNumber} - ${returnRequest.overallReason}` : 'Customer Return & Refund'
  );
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'original_payment' | 'store_credit' | 'bank_transfer' | 'pos_cash' | 'other'>(
    order?.orderSource === 'pos' ? 'pos_cash' : 'original_payment'
  );
  const [refundTransactionId, setRefundTransactionId] = useState<string>(
    returnRequest?.refundDetails?.refundId || returnRequest?.razorpayRefundId || ''
  );

  // Items to credit
  const [items, setItems] = useState<CreditNoteItem[]>([]);

  // Initialize items from ReturnRequest or Order
  useEffect(() => {
    if (returnRequest && Array.isArray(returnRequest.items) && returnRequest.items.length > 0) {
      const initialItems: CreditNoteItem[] = returnRequest.items.map((ri) => {
        const unitPrice = ri.unitPrice || (returnRequest.refundAmount ? Math.round(returnRequest.refundAmount / (ri.quantity || 1)) : 0);
        const totalPrice = unitPrice * (ri.quantity || 1);
        const taxRate = 18;
        const taxable = Math.round((totalPrice / (1 + taxRate / 100)) * 100) / 100;
        const taxAmount = Math.round((totalPrice - taxable) * 100) / 100;

        return {
          productId: ri.productId,
          name: ri.productName || (ri as any).name || 'Product',
          sku: (ri as any).sku || '',
          quantity: ri.quantity || 1,
          unitPrice,
          totalPrice,
          taxRate,
          taxAmount,
          hsnCode: (ri as any).hsnCode || '8517',
          reason: ri.reason || returnRequest.overallReason
        };
      });
      setItems(initialItems);
    } else if (order && Array.isArray(order.items) && order.items.length > 0) {
      const initialItems: CreditNoteItem[] = order.items.map((oi) => {
        const unitPrice = oi.unitPrice || (oi as any).price || 0;
        const totalPrice = oi.totalPrice || unitPrice * (oi.quantity || 1);
        const taxRate = oi.taxRate !== undefined ? oi.taxRate : 18;
        const taxable = Math.round((totalPrice / (1 + taxRate / 100)) * 100) / 100;
        const taxAmount = Math.round((totalPrice - taxable) * 100) / 100;

        return {
          productId: oi.productId,
          name: oi.name,
          sku: oi.sku || '',
          quantity: oi.quantity || 1,
          unitPrice,
          totalPrice,
          taxRate,
          taxAmount,
          hsnCode: (oi as any).hsnCode || '8517',
          reason: 'Item returned/refunded'
        };
      });
      setItems(initialItems);
    } else {
      // Default single item
      setItems([
        {
          productId: 'general_adjustment',
          name: 'Order Refund Credit',
          quantity: 1,
          unitPrice: returnRequest?.refundAmount || order?.grandTotal || 0,
          totalPrice: returnRequest?.refundAmount || order?.grandTotal || 0,
          taxRate: 18,
          taxAmount: 0,
          hsnCode: '8517',
          reason: 'Order adjustment'
        }
      ]);
    }
  }, [order, returnRequest]);

  // Tax calculation
  const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);
  // Assume prices are tax-inclusive by default in India retail
  const defaultGstRate = 18;
  const taxableAmount = Math.round((subtotal / (1 + defaultGstRate / 100)) * 100) / 100;
  const taxAdjustment = Math.round((subtotal - taxableAmount) * 100) / 100;

  // Split into CGST & SGST (assume intra-state Karnataka / local unless state differs)
  const isInterState = order?.shippingAddress?.state && 
    settings?.general?.state && 
    order.shippingAddress.state.toLowerCase() !== settings.general.state.toLowerCase();

  const cgstAdjustment = isInterState ? 0 : Math.round((taxAdjustment / 2) * 100) / 100;
  const sgstAdjustment = isInterState ? 0 : Math.round((taxAdjustment / 2) * 100) / 100;
  const igstAdjustment = isInterState ? taxAdjustment : 0;
  const totalCreditAmount = subtotal;

  const handleItemQtyChange = (index: number, newQty: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      item.quantity = Math.max(1, newQty);
      item.totalPrice = item.unitPrice * item.quantity;
      const taxRate = item.taxRate || 18;
      const taxable = Math.round((item.totalPrice / (1 + taxRate / 100)) * 100) / 100;
      item.taxAmount = Math.round((item.totalPrice - taxable) * 100) / 100;
      next[index] = item;
      return next;
    });
  };

  const handleItemPriceChange = (index: number, newPrice: number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      item.unitPrice = Math.max(0, newPrice);
      item.totalPrice = item.unitPrice * item.quantity;
      const taxRate = item.taxRate || 18;
      const taxable = Math.round((item.totalPrice / (1 + taxRate / 100)) * 100) / 100;
      item.taxAmount = Math.round((item.totalPrice - taxable) * 100) / 100;
      next[index] = item;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Credit note must contain at least one item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      setError('Original Order ID is required.');
      return;
    }
    if (totalCreditAmount <= 0) {
      setError('Total credit amount must be greater than zero.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for issuing this Credit Note.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        orderId,
        invoiceNumber: invoiceNumber || `EST-${orderId.slice(0, 8)}`,
        orderSource: order?.orderSource || 'online',
        returnRequestId: returnRequest?.id || null,
        returnNumber: returnRequest?.returnNumber || null,
        userId: order?.userId || returnRequest?.userId || 'customer',
        customerName: customerName || 'Valued Customer',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        customerGstin: customerGstin || '',
        shippingAddress: order?.shippingAddress || returnRequest?.pickupAddress || null,
        billingAddress: order?.billingAddress || null,
        sellerDetails: {
          businessName: settings.general?.storeName || 'ELECTRO STORE',
          businessAddress: settings.general?.businessAddress || '',
          businessPhone: settings.general?.phone || '',
          businessEmail: settings.general?.storeEmail || '',
          gstin: settings.tax?.gstin || '',
          pan: settings.contact?.pan || ''
        },
        items,
        subtotal,
        taxableAmount,
        taxRate: defaultGstRate,
        taxAdjustment,
        cgstAdjustment,
        sgstAdjustment,
        igstAdjustment,
        totalCreditAmount,
        refundMethod,
        refundTransactionId,
        reason,
        adminNotes,
        issuedByEmail: user?.email || 'Admin',
        issuedByName: user?.displayName || user?.email?.split('@')[0] || 'Store Staff'
      };

      const res = await fetch('/api/admin/credit-notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue credit note.');
      }

      onSuccess(data.creditNote);
    } catch (err: any) {
      console.error('Credit note issuance error:', err);
      setError(err.message || 'Failed to issue credit note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Issue GST Credit Note</h2>
              <p className="text-xs text-slate-500">
                Link to Order #{orderId.slice(0, 10)} {invoiceNumber ? `(${invoiceNumber})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Order Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Order ID *</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Original Invoice #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. EST-2026-0001"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Customer Phone</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Buyer GSTIN (if applicable)</label>
              <input
                type="text"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
                placeholder="29AAAAA0000A1Z5"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Credited Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Credited Items
              </label>
              <span className="text-[11px] text-slate-500">
                Adjust items and quantities to credit
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">HSN: {item.hsnCode || '8517'}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px]">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemQtyChange(idx, Number(e.target.value))}
                        className="w-14 px-2 py-1 border border-slate-200 rounded text-center text-xs font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[11px]">Rate:</span>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-right text-xs font-bold"
                      />
                    </div>

                    <div className="w-20 text-right font-bold text-slate-900">
                      ₹{Number(item.totalPrice || (Number(item.unitPrice || 0) * Number(item.quantity || 1))).toLocaleString('en-IN')}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove item"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason & Settlement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reason for Credit Note *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="Customer Return & Refund">Customer Return & Refund</option>
                <option value="Goods Damaged in Transit">Goods Damaged in Transit</option>
                <option value="Defective / Non-Functional Product">Defective / Non-Functional Product</option>
                <option value="Incorrect Item Shipped">Incorrect Item Shipped</option>
                <option value="Post-Sale Price Discount / Overcharged">Post-Sale Price Discount / Overcharged</option>
                <option value="Order Cancelled Prior to Fulfillment">Order Cancelled Prior to Fulfillment</option>
                <option value="Store Credit Voucher Issued">Store Credit Voucher Issued</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Settlement Method</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="original_payment">Original Payment Gateway (Razorpay/Card/UPI)</option>
                <option value="store_credit">Store Credit Balance</option>
                <option value="pos_cash">POS Cash Return</option>
                <option value="bank_transfer">Direct Bank Transfer (NEFT/IMPS)</option>
                <option value="other">Other / Manual Adjustment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Gateway / Transaction Ref ID</label>
              <input
                type="text"
                value={refundTransactionId}
                onChange={(e) => setRefundTransactionId(e.target.value)}
                placeholder="e.g. rfnd_123456789"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Admin Internal Remarks</label>
              <input
                type="text"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Optional notes for audit logs..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Tax Calculation Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Goods Value Adjusted:</span>
              <span className="font-semibold text-slate-800">₹{Number(taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {!isInterState ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST Adjusted (9%):</span>
                  <span className="font-semibold text-slate-800">₹{Number(cgstAdjustment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST Adjusted (9%):</span>
                  <span className="font-semibold text-slate-800">₹{Number(sgstAdjustment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-600">
                <span>IGST Adjusted (18%):</span>
                <span className="font-semibold text-slate-800">₹{Number(igstAdjustment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-sm">TOTAL CREDIT VALUE:</span>
              <span className="text-base font-black text-rose-700">₹{Number(totalCreditAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Issuing Credit Note...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Issue GST Credit Note
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
