import React, { useState, useEffect } from 'react';
import { 
  Building2, Percent, FileText, CheckCircle2, 
  HelpCircle, Eye, ShieldCheck 
} from 'lucide-react';
import { SettingItemCard } from '../SettingItemCard';
import { SettingToggleCard } from '../SettingToggleCard';
import { AdvancedOptionsSection } from '../AdvancedOptionsSection';
import { SiteSettings } from '../../../context/SiteSettingsContext';

interface TaxSettingsSectionProps {
  settings: SiteSettings;
  onUpdateField: (category: keyof SiteSettings, field: string, value: any) => Promise<void>;
  onBatchUpdate: (updates: Partial<SiteSettings>) => Promise<void>;
}

export function TaxSettingsSection({ settings, onUpdateField, onBatchUpdate }: TaxSettingsSectionProps) {
  const tax = settings.tax || {
    gstEnabled: true,
    gstin: '',
    taxRate: 18,
    taxDisplay: 'exclusive' as const,
    invoicePrefix: 'EST-2026-',
    invoiceNote: 'Authorized computer-generated tax invoice. 100% Genuine brand warranty valid across India.',
  };

  const contact = settings.contact || {
    businessName: settings.general?.storeName || 'ELECTRO STORE',
    address: settings.general?.businessAddress || '',
    phone: settings.general?.phone || '',
    whatsapp: settings.general?.whatsappNumber || '',
    email: settings.general?.storeEmail || '',
    supportEmail: settings.general?.supportEmail || '',
    openingHours: settings.general?.businessHours || '',
    googleMapsUrl: '',
    showContactForm: true,
  };

  // Local draft states
  const [gstin, setGstin] = useState(tax.gstin || contact.gstin || '');
  const [taxRate, setTaxRate] = useState<number>(tax.taxRate ?? 18);
  const [taxDisplay, setTaxDisplay] = useState<'exclusive' | 'inclusive' | 'both'>(tax.taxDisplay || 'exclusive');
  const [invoicePrefix, setInvoicePrefix] = useState(tax.invoicePrefix || 'EST-2026-');
  const [invoiceNote, setInvoiceNote] = useState(tax.invoiceNote || 'Authorized computer-generated tax invoice.');

  // Synchronize local states when settings update
  useEffect(() => {
    if (settings.tax || settings.contact) {
      setGstin(settings.tax?.gstin || settings.contact?.gstin || '');
      setTaxRate(settings.tax?.taxRate ?? 18);
      setTaxDisplay(settings.tax?.taxDisplay || 'exclusive');
      setInvoicePrefix(settings.tax?.invoicePrefix || 'EST-2026-');
      setInvoiceNote(settings.tax?.invoiceNote || 'Authorized computer-generated tax invoice.');
    }
  }, [settings.tax, settings.contact]);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">GST & Tax Settings</h2>
            <p className="text-xs text-slate-500">
              Configure Goods and Services Tax (GST), tax rates, display preferences, and automated invoice formats.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Enable/Disable GST */}
      <SettingToggleCard
        id="enable-gst"
        name="Enable GST Calculation"
        explanation="Calculate Goods and Services Tax (GST) during checkout and issue compliant GST tax invoices."
        enabled={tax.gstEnabled !== false}
        enabledLabel="GST Active (18%)"
        disabledLabel="GST Disabled (Exempt)"
        icon={Building2}
        onToggle={async (newVal) => {
          await onBatchUpdate({
            tax: {
              ...tax,
              gstEnabled: newVal,
            },
          });
        }}
      />

      {/* 2. GSTIN (GST Identification Number) */}
      <SettingItemCard
        id="gstin"
        name="GSTIN (GST Identification Number)"
        explanation="Your 15-digit government tax registration number printed on official invoices and checkout summaries."
        icon={ShieldCheck}
        currentDisplay={
          tax.gstin ? (
            <span className="font-mono font-bold text-slate-900">{tax.gstin}</span>
          ) : (
            <span className="text-slate-400">Not configured</span>
          )
        }
        onSave={async () => {
          const clean = gstin.trim().toUpperCase();
          if (tax.gstEnabled && clean.length > 0 && clean.length !== 15) {
            throw new Error('A valid Indian GSTIN must be exactly 15 alphanumeric characters.');
          }
          await onBatchUpdate({
            tax: {
              ...tax,
              gstin: clean,
            },
            contact: {
              ...contact,
              gstin: clean,
            },
          });
        }}
        onCancel={() => setGstin(tax.gstin || contact.gstin || '')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">15-Character GSTIN Number</label>
          <input
            type="text"
            maxLength={15}
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 uppercase tracking-wider outline-none focus:border-blue-500"
            placeholder="Enter 15-character GSTIN"
          />
          <p className="text-[11px] text-slate-400">
            Format: 2-digit state code + 10-char PAN + 1 entity code + 'Z' + 1 check digit.
          </p>
        </div>
      </SettingItemCard>

      {/* 3. Tax Settings (GST Rate %) */}
      <SettingItemCard
        id="tax-rate"
        name="Tax Rate Settings"
        explanation="The default GST tax percentage applied to electronics products and accessories."
        icon={Percent}
        currentDisplay={`${tax.taxRate ?? 18}% Standard GST`}
        onSave={async () => {
          const val = Number(taxRate);
          if (isNaN(val) || val < 0 || val > 100) {
            throw new Error('Tax rate must be a valid percentage between 0 and 100.');
          }
          await onBatchUpdate({
            tax: {
              ...tax,
              taxRate: val,
            },
          });
        }}
        onCancel={() => setTaxRate(tax.taxRate ?? 18)}
      >
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">Standard GST Percentage (%)</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[0, 5, 12, 18, 28].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setTaxRate(rate)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  taxRate === rate
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {rate}% {rate === 18 ? '(Electronics)' : ''}
              </button>
            ))}
          </div>
          <div className="pt-2">
            <span className="text-xs text-slate-500">Custom Tax Rate (%):</span>
            <input
              type="number"
              min={0}
              max={100}
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className="mt-1 w-32 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </SettingItemCard>

      {/* Advanced Invoice & Tax Display Options */}
      <AdvancedOptionsSection
        id="advanced-tax-options"
        title="Invoice Formatting & Tax Display Preferences"
        description="Configure custom invoice serial prefixes, legal disclaimers, and inclusive/exclusive price display mode."
      >
        <div className="space-y-4">
          {/* 4. Tax Display */}
          <SettingItemCard
            id="tax-display"
            name="Tax Display on Storefront"
            explanation="Choose whether tax is shown as a separate itemized line at checkout or included in list prices."
            icon={Eye}
            currentDisplay={
              tax.taxDisplay === 'inclusive' ? 'Included in product prices' : 'Itemized separately at checkout'
            }
            onSave={async () => {
              await onBatchUpdate({
                tax: {
                  ...tax,
                  taxDisplay,
                },
              });
            }}
            onCancel={() => setTaxDisplay(tax.taxDisplay || 'exclusive')}
          >
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">Display Mode</label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="taxDisplayOption"
                    checked={taxDisplay === 'exclusive'}
                    onChange={() => setTaxDisplay('exclusive')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Itemized separately at checkout (Recommended)</span>
                    <span className="text-[11px] text-slate-500">
                      Product prices show base amount. GST ({tax.taxRate}%) is clearly itemized in the cart and invoice summary.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="taxDisplayOption"
                    checked={taxDisplay === 'inclusive'}
                    onChange={() => setTaxDisplay('inclusive')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Included in listed product prices</span>
                    <span className="text-[11px] text-slate-500">
                      Prices shown on product cards already include GST ("Incl. of all taxes").
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </SettingItemCard>

          {/* 5. Invoice Settings */}
          <SettingItemCard
            id="invoice-settings"
            name="Invoice Settings & Numbering"
            explanation="Define the invoice serial numbering prefix and legal disclaimer note printed on PDF invoices."
            icon={FileText}
            currentDisplay={`Prefix: ${tax.invoicePrefix || 'EST-2026-'}`}
            onSave={async () => {
              if (!invoicePrefix.trim()) throw new Error('Invoice prefix cannot be empty.');
              await onBatchUpdate({
                tax: {
                  ...tax,
                  invoicePrefix: invoicePrefix.trim(),
                  invoiceNote: invoiceNote.trim(),
                },
              });
            }}
            onCancel={() => {
              setInvoicePrefix(tax.invoicePrefix || 'EST-2026-');
              setInvoiceNote(tax.invoiceNote || 'Authorized computer-generated tax invoice.');
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                  placeholder="EST-2026-"
                />
                <p className="text-[11px] text-slate-400 mt-1">Example generated invoice number: <strong>{invoicePrefix}ORD-98421</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Legal Footer Disclaimer</label>
                <textarea
                  rows={2}
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                  placeholder="Authorized computer-generated tax invoice. 100% Genuine brand warranty valid across India."
                />
              </div>
            </div>
          </SettingItemCard>
        </div>
      </AdvancedOptionsSection>
    </div>
  );
}
