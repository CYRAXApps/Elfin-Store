import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, MapPin, Phone, Mail, FileText, ArrowLeft, Copy, Check } from 'lucide-react';
import { CreditNote } from '../../../types';
import { useSiteSettings } from '../../../context/SiteSettingsContext';

interface CreditNoteModalProps {
  creditNote: CreditNote | null;
  onClose: () => void;
}

export function CreditNoteModal({ creditNote, onClose }: CreditNoteModalProps) {
  const { settings } = useSiteSettings();
  const [copied, setCopied] = React.useState(false);

  if (!creditNote) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(creditNote.creditNoteNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seller = creditNote.sellerDetails || {
    businessName: settings.general?.storeName || settings.contact?.businessName || 'ELECTRO STORE',
    businessAddress: settings.general?.businessAddress || settings.contact?.address || '',
    businessPhone: settings.general?.phone || settings.contact?.phone || '',
    businessEmail: settings.general?.storeEmail || settings.contact?.email || '',
    gstin: settings.tax?.gstin || settings.contact?.gstin || '',
    pan: settings.contact?.pan || ''
  };

  const logoUrl = settings.branding?.primaryLogo || settings.general?.storeLogoUrl || '/assets/logo.svg';
  const storeName = settings.general?.storeName || settings.branding?.brandName || 'ElectroStore';

  const dateStr = creditNote.createdAt?.toDate 
    ? creditNote.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date(creditNote.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Convert number to Indian words
  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
      if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
    };

    const rounded = Math.round(num);
    if (rounded === 0) return 'Zero Rupees Only';
    return `Rupees ${inWords(rounded).trim()} Only`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col border border-slate-100 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10 print:hidden">
          <div className="flex items-center gap-3">
            <span className="bg-rose-50 text-rose-700 font-bold text-xs px-2.5 py-1 rounded-full border border-rose-200">
              GST Credit Note
            </span>
            <span className="text-slate-800 font-mono font-bold text-sm">
              #{creditNote.creditNoteNumber}
            </span>
            <button
              onClick={copyNumber}
              className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
              title="Copy Credit Note Number"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
            {creditNote.status === 'cancelled' && (
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded border border-slate-300">
                CANCELLED / VOID
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
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

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 space-y-8 text-slate-800 font-sans" id="printable-credit-note">
          
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
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">{seller.businessAddress}</p>
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p><span className="font-semibold text-slate-700">GSTIN:</span> {seller.gstin}</p>
                {seller.pan && <p><span className="font-semibold text-slate-700">PAN:</span> {seller.pan}</p>}
                <p><span className="font-semibold text-slate-700">Email:</span> {seller.businessEmail}</p>
                <p><span className="font-semibold text-slate-700">Phone:</span> {seller.businessPhone}</p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold uppercase rounded-md tracking-wider mb-3">
                GST Credit Note
              </span>
              <table className="text-xs text-slate-600 sm:ml-auto">
                <tbody>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Credit Note No:</td>
                    <td className="font-bold text-slate-900 py-1 font-mono">{creditNote.creditNoteNumber}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Credit Note Date:</td>
                    <td className="text-slate-800 py-1 font-medium">{dateStr}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Original Invoice No:</td>
                    <td className="font-bold text-blue-700 py-1 font-mono">{creditNote.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Original Order Ref:</td>
                    <td className="text-slate-800 py-1 font-mono text-[11px]">#{creditNote.orderId}</td>
                  </tr>
                  {creditNote.returnNumber && (
                    <tr>
                      <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Return Request:</td>
                      <td className="text-slate-800 py-1 font-mono text-[11px]">{creditNote.returnNumber}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-semibold text-slate-700 pr-3 py-1 sm:text-right">Settlement Mode:</td>
                    <td className="text-slate-800 py-1 capitalize font-medium">{creditNote.refundMethod?.replace('_', ' ') || 'Original Source'}</td>
                  </tr>
                  {creditNote.status === 'cancelled' && (
                    <tr>
                      <td className="font-semibold text-rose-600 pr-3 py-1 sm:text-right">Status:</td>
                      <td className="text-rose-700 font-bold py-1">VOIDED / CANCELLED</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer / Party Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider mb-2 text-[10px]">Credited To (Customer)</h3>
              <p className="font-bold text-slate-900 text-sm">{creditNote.customerName}</p>
              {creditNote.customerGstin && (
                <p className="text-slate-700 font-medium mt-0.5">GSTIN: {creditNote.customerGstin}</p>
              )}
              {creditNote.shippingAddress?.street && (
                <p className="text-slate-600 mt-1">
                  {creditNote.shippingAddress.street}, {creditNote.shippingAddress.city}, {creditNote.shippingAddress.state} - {creditNote.shippingAddress.zipCode}
                </p>
              )}
              <div className="mt-2 text-slate-600 space-y-0.5">
                {creditNote.customerPhone && <p><span className="font-medium">Phone:</span> {creditNote.customerPhone}</p>}
                {creditNote.customerEmail && <p><span className="font-medium">Email:</span> {creditNote.customerEmail}</p>}
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider mb-2 text-[10px]">Credit Note Particulars</h3>
              <div className="space-y-1.5 text-xs">
                <p><span className="font-semibold text-slate-700">Reason for Credit:</span> <span className="text-slate-900">{creditNote.reason}</span></p>
                {creditNote.adminNotes && (
                  <p><span className="font-semibold text-slate-700">Internal Remarks:</span> <span className="text-slate-600">{creditNote.adminNotes}</span></p>
                )}
                <p><span className="font-semibold text-slate-700">Issued By:</span> <span className="text-slate-700">{creditNote.issuedByName || creditNote.issuedByEmail}</span></p>
                {creditNote.refundTransactionId && (
                  <p><span className="font-semibold text-slate-700">Gateway / Tx Ref:</span> <span className="font-mono text-slate-700">{creditNote.refundTransactionId}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* Credited Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50/80 text-slate-700 font-bold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">HSN</th>
                  <th className="py-2.5 px-3 text-right">Qty Credited</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  <th className="py-2.5 px-3 text-right">GST Rate</th>
                  <th className="py-2.5 px-3 text-right">GST Adjusted</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditNote.items && creditNote.items.length > 0 ? (
                  creditNote.items.map((item, index) => {
                    const itemTax = item.taxAmount !== undefined 
                      ? item.taxAmount 
                      : Math.round(((item.totalPrice || item.unitPrice * item.quantity) * ((item.taxRate || 18) / 100)) * 100) / 100;
                    const lineTotal = (item.totalPrice || item.unitPrice * item.quantity) + itemTax;
                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-400 font-medium">{index + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          {item.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>}
                          {item.reason && <p className="text-[10px] text-rose-600 mt-0.5">Reason: {item.reason}</p>}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{item.hsnCode || '8517'}</td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-800">{item.quantity || 1}</td>
                        <td className="py-3 px-3 text-right text-slate-600">₹{Number(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right font-medium text-slate-800">₹{Number(item.totalPrice || (Number(item.unitPrice || 0) * Number(item.quantity || 1))).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right text-slate-600">{item.taxRate ?? 18}%</td>
                        <td className="py-3 px-3 text-right text-slate-600">₹{Number(itemTax || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">₹{Number(lineTotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-4 px-3 text-center text-slate-500">
                      General Return / Order Value Adjustment ({creditNote.reason})
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-4 border-t border-slate-200">
            <div className="w-full sm:w-1/2 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Total Credit Amount in Words:</span>
                <p className="text-slate-800 font-serif italic text-sm">
                  {numberToWords(creditNote.totalCreditAmount)}
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-700" /> GST Compliance Note
                </p>
                <p className="text-amber-800 leading-relaxed">
                  This document is an electronic GST credit note issued under Section 34 of the Central Goods and Services Tax Act, 2017. Tax liabilities for supplier and input tax credits for recipient stand adjusted accordingly.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-5/12 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 py-1">
                <span>Taxable Value Adjusted:</span>
                <span className="font-medium text-slate-900">₹{Number(creditNote.taxableAmount || creditNote.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              {creditNote.cgstAdjustment !== undefined && creditNote.cgstAdjustment > 0 && (
                <div className="flex justify-between text-slate-600 py-1">
                  <span>CGST Adjusted:</span>
                  <span className="font-medium text-slate-900">₹{Number(creditNote.cgstAdjustment).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              {creditNote.sgstAdjustment !== undefined && creditNote.sgstAdjustment > 0 && (
                <div className="flex justify-between text-slate-600 py-1">
                  <span>SGST Adjusted:</span>
                  <span className="font-medium text-slate-900">₹{Number(creditNote.sgstAdjustment).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              {creditNote.igstAdjustment !== undefined && creditNote.igstAdjustment > 0 && (
                <div className="flex justify-between text-slate-600 py-1">
                  <span>IGST Adjusted:</span>
                  <span className="font-medium text-slate-900">₹{Number(creditNote.igstAdjustment).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              {(!creditNote.cgstAdjustment && !creditNote.sgstAdjustment && !creditNote.igstAdjustment && creditNote.taxAdjustment > 0) && (
                <div className="flex justify-between text-slate-600 py-1">
                  <span>Total GST Adjusted:</span>
                  <span className="font-medium text-slate-900">₹{Number(creditNote.taxAdjustment).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="border-t-2 border-slate-900 pt-2.5 mt-2 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900">TOTAL CREDIT VALUE:</span>
                <span className="text-lg font-black text-slate-900">
                  ₹{Number(creditNote.totalCreditAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Footer & Signature */}
          <div className="pt-10 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700 mb-1">Terms & Conditions:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                <li>Credit notes are adjusted against customer ledger balance or refunded via payment source.</li>
                <li>In case of replacement, new tax invoice is generated concurrently.</li>
                <li>This is an authenticated computer generated electronic document.</li>
              </ul>
            </div>

            <div className="text-right sm:ml-auto">
              <div className="h-14 flex items-end justify-end mb-1">
                <div className="border-b border-dashed border-slate-400 w-48 text-center pb-1 text-[11px] font-mono text-slate-600">
                  {creditNote.issuedByName || 'Authorized Signatory'}
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-700">For {seller.businessName}</p>
              <p className="text-[10px] text-slate-400">Authorized Electronic Signatory</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
