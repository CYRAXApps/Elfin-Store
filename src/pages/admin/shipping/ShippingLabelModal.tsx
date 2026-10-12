import React from 'react';
import { X, Printer, Package, Truck, QrCode } from 'lucide-react';
import { Order } from '../../../types';
import { formatCurrency, formatOrderDateTime } from '../orders/orderUtils';
import { PincodeDisplay } from '../../../components/common/PincodeDisplay';
import { useSiteSettings } from '../../../context/SiteSettingsContext';

interface ShippingLabelModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function ShippingLabelModal({ order, isOpen, onClose }: ShippingLabelModalProps) {
  const { settings } = useSiteSettings();
  if (!isOpen) return null;

  const inv = order.invoiceNumber || `EST-${order.id.slice(0, 8).toUpperCase()}`;
  const addr = order.shippingAddress;
  const items = order.items || [];
  const isCod = order.payment?.paymentMethod?.toLowerCase().includes('cod') || order.payment?.provider?.toLowerCase().includes('cod');
  const total = order.grandTotal || order.totalAmount || 0;
  const returnAddress = settings?.general?.businessAddress || '';
  const supportPhone = settings?.general?.phone;
  const supportEmail = settings?.general?.storeEmail;
  const gstin = settings?.tax?.gstin;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Controls Header (Hidden during print) */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-blue-600" />
            <span className="font-bold text-slate-800 text-sm">Shipping Slip & Dispatch Label</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Printer size={13} /> Print Label
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Label Area */}
        <div className="p-6 overflow-y-auto bg-slate-100/50 flex justify-center">
          <div className="bg-white border-2 border-slate-900 rounded-lg p-5 w-full max-w-md shadow-sm text-slate-900 font-sans space-y-4 print:border-2 print:shadow-none print:m-0">
            {/* Top Bar: Brand & AWB Barcode simulation */}
            <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight uppercase">ELECTRO STORE</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Standard Express Logistics</p>
                <div className="mt-1 text-[11px] font-bold">
                  Carrier: <span className="uppercase">{order.carrier || order.courier || 'Delhivery'}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block px-2.5 py-1 text-xs font-black uppercase rounded border ${
                  isCod 
                    ? 'border-rose-900 bg-rose-50 text-rose-900' 
                    : 'border-emerald-900 bg-emerald-50 text-emerald-900'
                }`}>
                  {isCod ? `COD: ${formatCurrency(total)}` : 'PREPAID'}
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  {formatOrderDateTime(order.createdAt)}
                </p>
              </div>
            </div>

            {/* Tracking Code & Simulated Barcode */}
            <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1.5">
              <div className="tracking-widest font-mono text-sm font-black">
                {order.trackingNumber || `EST-${order.id.slice(0, 10).toUpperCase()}`}
              </div>
              {/* Visual simulated Barcode SVG */}
              <div className="flex justify-center items-center h-10 overflow-hidden space-x-1">
                {[4, 2, 6, 3, 1, 5, 2, 4, 3, 6, 2, 1, 4, 3, 5, 2, 6, 3, 2, 4, 1, 5, 3, 2, 4, 3].map((w, i) => (
                  <div key={i} className="bg-slate-900 h-10" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">AWB Routing Code</p>
            </div>

            {/* Ship To & Return Address Grid */}
            <div className="border-b-2 border-slate-900 pb-3 grid grid-cols-2 gap-3 text-xs">
              {/* Ship To */}
              <div className="space-y-0.5 border-r border-slate-200 pr-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Deliver To:
                </span>
                <p className="font-bold text-sm text-slate-900">{addr?.fullName || 'Customer'}</p>
                <p className="text-slate-700 leading-tight">
                  {addr?.addressLine1}
                  {addr?.addressLine2 ? `, ${addr.addressLine2}` : ''}
                </p>
                <p className="text-slate-700 leading-tight">
                  {addr?.city}, {addr?.state}
                </p>
                <p className="font-black text-sm text-slate-900 mt-1">
                  <PincodeDisplay pincode={addr?.pincode} showPrefix />
                </p>
                <p className="font-bold text-[11px] text-slate-800 pt-1">
                  Ph: {addr?.phone}
                </p>
              </div>

              {/* Return Address */}
              <div className="space-y-0.5 pl-1 text-[11px] text-slate-600">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Return / Origin Address:
                </span>
                <p className="font-bold text-slate-900">{settings?.general?.storeName || 'Store Dispatch Center'}</p>
                {returnAddress ? (
                  <p className="leading-tight">{returnAddress}</p>
                ) : (
                  <p className="leading-tight text-slate-400">Registered Fulfillment Center</p>
                )}
                {supportPhone && <p className="font-bold text-slate-800 mt-1">Support: {supportPhone}</p>}
                {gstin && <p className="text-[10px] text-slate-400 font-mono mt-0.5">GSTIN: {gstin}</p>}
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 pb-1 border-b border-slate-200">
                <span>Order #{inv} Contents</span>
                <span>Qty</span>
              </div>
              <div className="space-y-1 pt-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <span className="truncate max-w-[280px] font-medium">{it.name}</span>
                    <span className="font-bold font-mono">x{it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer notes */}
            <div className="border-t border-dashed border-slate-300 pt-2 text-[10px] text-slate-500 text-center">
              Please inspect package upon delivery.{supportEmail ? ` For queries, contact ${supportEmail}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
