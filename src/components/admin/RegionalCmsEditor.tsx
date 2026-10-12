import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import { MapPin, DollarSign, Globe, Calendar, Calculator, CheckCircle2 } from 'lucide-react';

interface RegionalCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function RegionalCmsEditor({ formState, setFormState }: RegionalCmsEditorProps) {
  const [sampleAmount, setSampleAmount] = useState<number>(49999);

  const reg = formState.regional || {
    country: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en-IN',
    postalCodeFormat: '^[1-9][0-9]{5}$',
    defaultState: formState.general?.state || '',
    enableMultiCurrency: false,
    availableCurrencies: ['INR', 'USD', 'EUR', 'GBP'],
    weightUnit: 'kg',
    dimensionUnit: 'cm',
  };

  const handleUpdate = (field: string, value: any) => {
    const updatedRegional = { ...reg, [field]: value };
    // Also sync currency & symbol to general store settings if changed
    const updatedGeneral = {
      ...formState.general,
      currency: field === 'currency' ? value : formState.general.currency,
      currencySymbol: field === 'currencySymbol' ? value : formState.general.currencySymbol,
      country: field === 'country' ? value : formState.general.country,
    };

    setFormState({
      ...formState,
      regional: updatedRegional,
      general: updatedGeneral,
    });
  };

  const handleCurrencyPreset = (curr: string) => {
    let sym = '₹';
    let numFmt = 'en-IN';
    let country = 'India';
    let tz = 'Asia/Kolkata';

    if (curr === 'USD') {
      sym = '$';
      numFmt = 'en-US';
      country = 'United States';
      tz = 'America/New_York';
    } else if (curr === 'EUR') {
      sym = '€';
      numFmt = 'de-DE';
      country = 'Germany';
      tz = 'Europe/Berlin';
    } else if (curr === 'GBP') {
      sym = '£';
      numFmt = 'en-GB';
      country = 'United Kingdom';
      tz = 'Europe/London';
    } else if (curr === 'AED') {
      sym = 'AED';
      numFmt = 'ar-AE';
      country = 'United Arab Emirates';
      tz = 'Asia/Dubai';
    }

    setFormState({
      ...formState,
      regional: {
        ...reg,
        currency: curr,
        currencySymbol: sym,
        numberFormat: numFmt,
        country,
        timezone: tz,
      },
      general: {
        ...formState.general,
        currency: curr,
        currencySymbol: sym,
        country,
      },
    });
  };

  const formattedSamplePrice = (() => {
    try {
      return new Intl.NumberFormat(reg.numberFormat || 'en-IN', {
        style: 'currency',
        currency: reg.currency || 'INR',
        maximumFractionDigits: 0,
      }).format(sampleAmount);
    } catch (e) {
      return `${reg.currencySymbol || '₹'}${sampleAmount.toLocaleString('en-IN')}`;
    }
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <MapPin className="text-blue-600" size={20} />
            <span>Regional, Localization & Currency Controls</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Configure primary store currency, number formatting, timezone, date formats, and address requirements.
          </p>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700">Quick Regional Presets:</span>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { code: 'INR', label: '🇮🇳 India (INR ₹)' },
            { code: 'USD', label: '🇺🇸 United States (USD $)' },
            { code: 'GBP', label: '🇬🇧 United Kingdom (GBP £)' },
            { code: 'EUR', label: '🇪🇺 European Union (EUR €)' },
            { code: 'AED', label: '🇦🇪 UAE (AED)' },
          ].map((preset) => (
            <button
              key={preset.code}
              type="button"
              onClick={() => handleCurrencyPreset(preset.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                reg.currency === preset.code
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Country */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Target Country / Market</label>
          <input
            type="text"
            value={reg.country || 'India'}
            onChange={(e) => handleUpdate('country', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="India"
          />
        </div>

        {/* Currency Code */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Store Currency Code (ISO 4217)</label>
          <input
            type="text"
            value={reg.currency || 'INR'}
            onChange={(e) => handleUpdate('currency', e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="INR"
          />
        </div>

        {/* Currency Symbol */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol Display</label>
          <input
            type="text"
            value={reg.currencySymbol || '₹'}
            onChange={(e) => handleUpdate('currencySymbol', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="₹"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Store Timezone</label>
          <select
            value={reg.timezone || 'Asia/Kolkata'}
            onChange={(e) => handleUpdate('timezone', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Berlin">Europe/Berlin (CET +1:00)</option>
            <option value="America/New_York">America/New_York (EST/EDT -5:00)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT -8:00)</option>
            <option value="UTC">UTC (Coordinated Universal Time)</option>
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Date Display Format</label>
          <select
            value={reg.dateFormat || 'DD/MM/YYYY'}
            onChange={(e) => handleUpdate('dateFormat', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 13/09/2026 - India/UK)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/13/2026 - US)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-13 - ISO Standard)</option>
          </select>
        </div>

        {/* Number Locale Format */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Number / Price Locale Format</label>
          <select
            value={reg.numberFormat || 'en-IN'}
            onChange={(e) => handleUpdate('numberFormat', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
          >
            <option value="en-IN">en-IN (₹1,50,000 Lakhs / Crores separator)</option>
            <option value="en-US">en-US ($150,000 Millions separator)</option>
            <option value="en-GB">en-GB (£150,000 UK format)</option>
            <option value="de-DE">de-DE (150.000 € Dot separator)</option>
          </select>
        </div>

        {/* Postal Code Regex */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">PIN / Postal Code Validation Regex</label>
          <input
            type="text"
            value={reg.postalCodeFormat || '^[1-9][0-9]{5}$'}
            onChange={(e) => handleUpdate('postalCodeFormat', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="^[1-9][0-9]{5}$"
          />
        </div>

        {/* Default State */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Default State / Region</label>
          <input
            type="text"
            value={reg.defaultState || ''}
            onChange={(e) => handleUpdate('defaultState', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter default state (or configure in Store Settings)"
          />
        </div>

        {/* Weight / Dimension Units */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Shipping Weight & Dimension Units</label>
          <div className="flex gap-2">
            <select
              value={reg.weightUnit || 'kg'}
              onChange={(e) => handleUpdate('weightUnit', e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none"
            >
              <option value="kg">kg (Kilograms)</option>
              <option value="g">g (Grams)</option>
              <option value="lbs">lbs (Pounds)</option>
            </select>
            <select
              value={reg.dimensionUnit || 'cm'}
              onChange={(e) => handleUpdate('dimensionUnit', e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none"
            >
              <option value="cm">cm (Centimeters)</option>
              <option value="mm">mm (Millimeters)</option>
              <option value="in">in (Inches)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Formatter Simulation Card */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 shadow-md border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calculator size={14} className="text-amber-400" /> Live Regional Formatter Simulation
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Test Amount:</span>
            <input
              type="number"
              value={sampleAmount}
              onChange={(e) => setSampleAmount(Number(e.target.value))}
              className="w-24 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Formatted Price Output</span>
            <span className="text-xl font-black text-emerald-400">{formattedSamplePrice}</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Current Date Output</span>
            <span className="text-sm font-bold text-slate-200">
              {reg.dateFormat === 'MM/DD/YYYY' ? '09/13/2026' : reg.dateFormat === 'YYYY-MM-DD' ? '2026-09-13' : '13/09/2026'}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">PIN Code Validation</span>
            <span className="text-xs font-mono text-amber-300">Matches 6-digit Indian PIN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
