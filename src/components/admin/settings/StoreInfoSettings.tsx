import React, { useState, useEffect } from 'react';
import { 
  Store, Image, Phone, Mail, MessageSquare, MapPin, 
  Clock, DollarSign, Globe, Navigation, Hash, Upload, ExternalLink, Loader2 
} from 'lucide-react';
import { SettingItemCard } from '../SettingItemCard';
import { AdvancedOptionsSection } from '../AdvancedOptionsSection';
import { SiteSettings } from '../../../context/SiteSettingsContext';
import { uploadSiteAsset } from '../../../utils/assetUploader';

interface StoreInfoSettingsProps {
  settings: SiteSettings;
  onUpdateField: (category: keyof SiteSettings, field: string, value: any) => Promise<void>;
  onBatchUpdate: (updates: Partial<SiteSettings>) => Promise<void>;
}

export function StoreInfoSettings({ settings, onUpdateField, onBatchUpdate }: StoreInfoSettingsProps) {
  const general = settings.general || {
    storeName: 'ELECTRO STORE',
    shortStoreName: 'ELECTRO',
    tagline: 'India\'s Premium Electronics Destination',
    storeDescription: '',
    storeLogoUrl: '/assets/logo.svg',
    faviconUrl: '/assets/favicon.svg',
    storeEmail: '',
    supportEmail: '',
    phone: '',
    whatsappNumber: '',
    businessAddress: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    businessHours: '',
    storeStatus: 'active' as const,
    defaultLanguage: 'en',
    currency: 'INR',
    currencySymbol: '₹',
  };

  const contact = settings.contact || {
    businessName: general.storeName || 'ELECTRO STORE',
    address: general.businessAddress || '',
    phone: general.phone || '',
    whatsapp: general.whatsappNumber || '',
    email: general.storeEmail || '',
    supportEmail: general.supportEmail || '',
    openingHours: general.businessHours || '',
    googleMapsUrl: '',
    showContactForm: true,
  };

  // Local draft states for editing
  const [storeName, setStoreName] = useState(general.storeName || 'ELECTRO STORE');
  const [storeLogoUrl, setStoreLogoUrl] = useState(general.storeLogoUrl || '/assets/logo.svg');
  const [faviconUrl, setFaviconUrl] = useState(general.faviconUrl || settings.branding?.favicon || '/assets/favicon.svg');
  const [phone, setPhone] = useState(general.phone || '');
  const [email, setEmail] = useState(general.storeEmail || '');
  const [whatsapp, setWhatsapp] = useState(general.whatsappNumber || '');
  const [address, setAddress] = useState(general.businessAddress || '');
  const [hours, setHours] = useState(general.businessHours || '');
  const [currency, setCurrency] = useState(general.currency || 'INR');
  const [currencySymbol, setCurrencySymbol] = useState(general.currencySymbol || '₹');
  const [country, setCountry] = useState(general.country || 'India');
  const [state, setState] = useState(general.state || '');
  const [pin, setPin] = useState(general.pincode || '');

  // Synchronize local editable fields whenever settings prop updates from server/context
  useEffect(() => {
    const currentGen = settings.general;
    const currentBranding = settings.branding;
    const currentContact = settings.contact;
    const effName = currentGen?.storeName || currentBranding?.brandName || 'ELECTRO STORE';
    const effLogo = currentBranding?.primaryLogo || currentGen?.storeLogoUrl || '/assets/logo.svg';
    const effFav = currentBranding?.favicon || currentGen?.faviconUrl || '/assets/favicon.svg';

    setStoreName(effName);
    setStoreLogoUrl(effLogo);
    setFaviconUrl(effFav);
    setPhone(currentGen?.phone || currentContact?.phone || '');
    setEmail(currentGen?.storeEmail || currentContact?.email || '');
    setWhatsapp(currentGen?.whatsappNumber || currentContact?.whatsapp || '');
    setAddress(currentGen?.businessAddress || currentContact?.address || '');
    setHours(currentGen?.businessHours || currentContact?.openingHours || '');
    setCurrency(currentGen?.currency || 'INR');
    setCurrencySymbol(currentGen?.currencySymbol || '₹');
    setCountry(currentGen?.country || 'India');
    setState(currentGen?.state || '');
    setPin(currentGen?.pincode || '');
  }, [settings]);

  // Default store branding
  const sampleLogos = [
    { name: 'Default Store Logo', url: '/assets/logo.svg' },
  ];

  const sampleFavicons = [
    { name: 'Default Favicon', url: '/favicon.ico' },
    { name: 'Lightning SVG', url: '/assets/favicon.svg' },
    { name: 'Blue Shield', url: 'https://api.iconify.design/lucide:shield-check.svg?color=%232563eb' },
    { name: 'Yellow Zap', url: 'https://api.iconify.design/lucide:zap.svg?color=%23eab308' },
  ];

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    setLoading: (val: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setLoading(true);

    try {
      const assetUrl = await uploadSiteAsset(file, 'store-info');
      setter(assetUrl);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Failed to upload image asset.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Store size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Store Information</h2>
            <p className="text-xs text-slate-500">
              Basic identity, public contact info, physical address, and operating currency displayed across your store.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Store Name */}
      <SettingItemCard
        id="store-name"
        name="Store Name"
        explanation="The primary public business name shown on the header, invoices, emails, and browser title."
        icon={Store}
        currentDisplay={general.storeName || 'ELECTRO STORE'}
        onSave={async () => {
          if (!storeName.trim()) throw new Error('Store name cannot be empty.');
          const trimmed = storeName.trim();
          await onBatchUpdate({
            general: {
              ...general,
              storeName: trimmed,
              shortStoreName: trimmed.split(' ')[0],
            },
            branding: {
              ...settings.branding,
              brandName: trimmed,
            },
            contact: {
              ...contact,
              businessName: trimmed,
            },
          });
        }}
        onCancel={() => setStoreName(general.storeName || 'ELECTRO STORE')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Official Brand Name</label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter brand name"
          />
          <p className="text-[11px] text-slate-400">Recommended: Keep under 30 characters for clean mobile header layout.</p>
        </div>
      </SettingItemCard>

      {/* 2. Logo */}
      <SettingItemCard
        id="store-logo"
        name="Store Logo"
        explanation="The brand graphic or logo icon displayed in the navigation header, checkout bar, and invoices."
        icon={Image}
        currentDisplay={
          <div className="flex items-center gap-2">
            <div className="h-6 w-12 bg-slate-100 p-0.5 rounded border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={general.storeLogoUrl || '/assets/logo.svg'}
                alt="Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.endsWith('/assets/logo.svg')) {
                    target.src = '/assets/logo.svg';
                  }
                }}
              />
            </div>
            <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
              {general.storeLogoUrl?.slice(0, 24) || '/assets/logo.svg'}...
            </span>
          </div>
        }
        onSave={async () => {
          if (!storeLogoUrl.trim()) throw new Error('Logo URL cannot be empty.');
          const trimmed = storeLogoUrl.trim();
          await onBatchUpdate({
            general: {
              ...general,
              storeLogoUrl: trimmed,
            },
            branding: {
              ...settings.branding,
              primaryLogo: trimmed,
              adminLogo: trimmed,
              loginLogo: trimmed,
              emailLogo: trimmed,
            },
          });
        }}
        onCancel={() => setStoreLogoUrl(general.storeLogoUrl || '/assets/logo.svg')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">Logo Image URL or File Upload</label>
            <label className={`px-3 py-1 ${uploadingLogo ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-xs font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5 border border-blue-200/60`}>
              {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingLogo}
                onChange={(e) => handleFileUpload(e, setStoreLogoUrl, setUploadingLogo)}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              <img
                src={storeLogoUrl || '/assets/logo.svg'}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.endsWith('/assets/logo.svg')) {
                    target.src = '/assets/logo.svg';
                  }
                }}
              />
            </div>
            <input
              type="text"
              value={storeLogoUrl}
              onChange={(e) => setStoreLogoUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter logo image URL or upload above"
            />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quick Presets:</span>
            <div className="flex flex-wrap gap-2">
              {sampleLogos.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setStoreLogoUrl(s.url)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingItemCard>

      {/* 2b. Website Icon / Favicon */}
      <SettingItemCard
        id="website-icon"
        name="Website Icon (Favicon)"
        explanation="The browser tab icon, mobile web app shortcut icon, and store branding mark."
        icon={Globe}
        currentDisplay={
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
              <img
                src={faviconUrl || '/assets/favicon.svg'}
                alt="Favicon"
                className="w-4 h-4 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.endsWith('/assets/favicon.svg')) {
                    target.src = '/assets/favicon.svg';
                  }
                }}
              />
            </div>
            <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
              {faviconUrl?.slice(0, 24) || '/assets/favicon.svg'}...
            </span>
          </div>
        }
        onSave={async () => {
          if (!faviconUrl.trim()) throw new Error('Favicon URL cannot be empty.');
          const trimmed = faviconUrl.trim();
          await onBatchUpdate({
            general: {
              ...general,
              faviconUrl: trimmed,
            },
            branding: {
              ...settings.branding,
              favicon: trimmed,
            },
          });
        }}
        onCancel={() => setFaviconUrl(general.faviconUrl || settings.branding?.favicon || '/assets/favicon.svg')}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">Icon Image URL or File Upload</label>
            <label className={`px-3 py-1 ${uploadingFavicon ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-xs font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5 border border-blue-200/60`}>
              {uploadingFavicon ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploadingFavicon ? 'Uploading...' : 'Upload Icon'}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingFavicon}
                onChange={(e) => handleFileUpload(e, setFaviconUrl, setUploadingFavicon)}
                className="hidden"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden">
              <img
                src={faviconUrl || '/assets/favicon.svg'}
                alt="Favicon Preview"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.endsWith('/assets/favicon.svg')) {
                    target.src = '/assets/favicon.svg';
                  }
                }}
              />
            </div>
            <input
              type="text"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter favicon / icon URL or upload above"
            />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Preset Icons:</span>
            <div className="flex flex-wrap gap-2">
              {sampleFavicons.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setFaviconUrl(s.url)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingItemCard>

      {/* 3. Phone */}
      <SettingItemCard
        id="store-phone"
        name="Customer Support Phone"
        explanation="The primary telephone number shown to customers for support and helpline inquiries."
        icon={Phone}
        currentDisplay={general.phone || 'Not configured'}
        onSave={async () => {
          if (!phone.trim()) throw new Error('Phone number cannot be empty.');
          const clean = phone.trim();
          await onBatchUpdate({
            general: {
              ...general,
              phone: clean,
              supportEmail: general.supportEmail || general.storeEmail,
            },
            contact: {
              ...contact,
              phone: clean,
            },
          });
        }}
        onCancel={() => setPhone(general.phone || '')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Support Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter support phone number"
          />
          <p className="text-[11px] text-slate-400">Include country code for international shoppers (e.g. +91 for India).</p>
        </div>
      </SettingItemCard>

      {/* 4. Email */}
      <SettingItemCard
        id="store-email"
        name="Store Email Address"
        explanation="Official contact email address for customer inquiries, order updates, and replies."
        icon={Mail}
        currentDisplay={general.storeEmail || 'Not configured'}
        onSave={async () => {
          if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address.');
          const clean = email.trim();
          await onBatchUpdate({
            general: {
              ...general,
              storeEmail: clean,
              supportEmail: clean,
            },
            contact: {
              ...contact,
              email: clean,
              supportEmail: clean,
            },
          });
        }}
        onCancel={() => setEmail(general.storeEmail || '')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Public Customer Care Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter email address"
          />
        </div>
      </SettingItemCard>

      {/* 5. WhatsApp */}
      <SettingItemCard
        id="store-whatsapp"
        name="WhatsApp Business Number"
        explanation="Enables the quick 'Chat on WhatsApp' button on product pages and order confirmations."
        icon={MessageSquare}
        currentDisplay={general.whatsappNumber || 'Not configured'}
        onSave={async () => {
          const clean = whatsapp.trim();
          await onBatchUpdate({
            general: {
              ...general,
              whatsappNumber: clean,
            },
            contact: {
              ...contact,
              whatsapp: clean,
            },
            socialMedia: {
              ...settings.socialMedia,
              whatsappUrl: clean ? `https://wa.me/${clean.replace(/[^0-9]/g, '')}` : '',
              whatsappEnabled: Boolean(clean),
            },
          });
        }}
        onCancel={() => setWhatsapp(general.whatsappNumber || '')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">WhatsApp Number (with Country Code)</label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter WhatsApp number"
          />
          <p className="text-[11px] text-slate-400">Used to initiate direct WhatsApp chats with customers from product pages and footer.</p>
        </div>
      </SettingItemCard>

      {/* 6. Physical Address */}
      <SettingItemCard
        id="store-address"
        name="Physical Store / Warehouse Address"
        explanation="Printed on tax invoices, dispatch packing slips, and the Contact Us page."
        icon={MapPin}
        currentDisplay={general.businessAddress || 'Not configured'}
        onSave={async () => {
          if (!address.trim()) throw new Error('Address cannot be empty.');
          const clean = address.trim();
          await onBatchUpdate({
            general: {
              ...general,
              businessAddress: clean,
            },
            contact: {
              ...contact,
              address: clean,
            },
          });
        }}
        onCancel={() => setAddress(general.businessAddress || '')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Office or Fulfillment Center Address</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter office or warehouse address"
          />
        </div>
      </SettingItemCard>

      {/* 7. Business Hours */}
      <SettingItemCard
        id="store-hours"
        name="Business Hours"
        explanation="Customer support and fulfillment operating times shown on the Contact page and website footer."
        icon={Clock}
        currentDisplay={general.businessHours || 'Not configured'}
        onSave={async () => {
          const clean = hours.trim();
          await onBatchUpdate({
            general: {
              ...general,
              businessHours: clean,
            },
            footer: {
              ...settings.footer,
              businessHours: clean,
            },
            contact: {
              ...contact,
              openingHours: clean,
            },
          });
        }}
        onCancel={() => setHours(general.businessHours || '')}
      >
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">Working Days & Hours</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter working days and hours"
          />
        </div>
      </SettingItemCard>

      {/* Advanced Regional & Currency Options */}
      <AdvancedOptionsSection
        id="advanced-store-regional"
        title="Advanced Regional & Currency Settings"
        description="Configure store currency symbol, base operating country, tax state, and dispatch warehouse PIN code."
      >
        <div className="space-y-4">
          {/* 8. Currency */}
          <SettingItemCard
            id="store-currency"
            name="Store Currency"
            explanation="The primary currency used to calculate and format all product prices, cart subtotals, and payments."
            icon={DollarSign}
            currentDisplay={`${general.currencySymbol || '₹'} (${general.currency || 'INR'})`}
            onSave={async () => {
              await onBatchUpdate({
                general: {
                  ...general,
                  currency,
                  currencySymbol,
                },
                regional: {
                  ...settings.regional,
                  currency,
                  currencySymbol,
                },
              });
            }}
            onCancel={() => {
              setCurrency(general.currency || 'INR');
              setCurrencySymbol(general.currencySymbol || '₹');
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Currency Code</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCurrency(val);
                    if (val === 'INR') setCurrencySymbol('₹');
                    else if (val === 'USD') setCurrencySymbol('$');
                    else if (val === 'EUR') setCurrencySymbol('€');
                    else if (val === 'GBP') setCurrencySymbol('£');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="GBP">GBP — British Pound (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                  placeholder="Enter currency symbol"
                />
              </div>
            </div>
          </SettingItemCard>

          {/* 9. Country */}
          <SettingItemCard
            id="store-country"
            name="Operating Country"
            explanation="Country of operations for tax computation, international shipping, and merchant billing."
            icon={Globe}
            currentDisplay={general.country || 'India'}
            onSave={async () => {
              const clean = country.trim();
              await onBatchUpdate({
                general: {
                  ...general,
                  country: clean,
                },
                contact: {
                  ...contact,
                  country: clean,
                },
                regional: {
                  ...settings.regional,
                  country: clean,
                },
              });
            }}
            onCancel={() => setCountry(general.country || 'India')}
          >
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
                placeholder="Enter country"
              />
            </div>
          </SettingItemCard>

          {/* 10. State */}
          <SettingItemCard
            id="store-state"
            name="Registered State / Province"
            explanation="Your base state used for Goods and Services Tax (CGST + SGST vs IGST) determination."
            icon={Navigation}
            currentDisplay={general.state || 'Not configured'}
            onSave={async () => {
              const clean = state.trim();
              await onBatchUpdate({
                general: {
                  ...general,
                  state: clean,
                },
                contact: {
                  ...contact,
                  state: clean,
                },
              });
            }}
            onCancel={() => setState(general.state || '')}
          >
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Base Origin State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
                placeholder="Enter state"
              />
            </div>
          </SettingItemCard>

          {/* 11. PIN Code */}
          <SettingItemCard
            id="store-pin"
            name="Store / Dispatch PIN Code"
            explanation="6-digit postal PIN code of your primary fulfillment warehouse or store."
            icon={Hash}
            currentDisplay={general.pincode || 'Not configured'}
            onSave={async () => {
              const clean = pin.trim();
              if (clean && !/^\d{6}$/.test(clean)) {
                throw new Error('Please enter a valid 6-digit postal PIN code.');
              }
              await onBatchUpdate({
                general: {
                  ...general,
                  pincode: clean,
                },
                contact: {
                  ...contact,
                  pincode: clean,
                },
              });
            }}
            onCancel={() => setPin(general.pincode || '')}
          >
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Postal PIN Code (6 digits)</label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-900 outline-none focus:border-blue-500"
                placeholder="Enter 6-digit pincode"
              />
              <p className="text-[11px] text-slate-400">Used as the package dispatch origin for courier route calculations.</p>
            </div>
          </SettingItemCard>

          {/* 12. Country Code Selection Option */}
          <SettingItemCard
            id="store-country-code-selection"
            name="Mobile Country Code Selection"
            explanation="Allow customers and staff to select international country codes (+1, +44, +971, etc.) on login and staff creation. If disabled, all phone inputs stay locked to +91 (India)."
            icon={Phone}
            currentDisplay={general.enableCountryCodeSelector ? 'Enabled (International Allowed)' : 'Disabled (Locked to +91 India)'}
            onSave={async () => {
              await onUpdateField('general', 'enableCountryCodeSelector', !general.enableCountryCodeSelector);
            }}
            onCancel={() => {}}
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Choose whether users and administrators can select international country codes or if phone typing should remain locked to India (+91):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateField('general', 'enableCountryCodeSelector', false)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    !general.enableCountryCodeSelector
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">🔒 Disabled (Fixed +91)</span>
                    {!general.enableCountryCodeSelector && <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">Active</span>}
                  </div>
                  <p className="text-[11px] text-slate-500">Phone inputs show a fixed non-clickable +91 badge (India standard 10 digits).</p>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateField('general', 'enableCountryCodeSelector', true)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    general.enableCountryCodeSelector
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">🌐 Enabled (Multi-Country)</span>
                    {general.enableCountryCodeSelector && <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded">Active</span>}
                  </div>
                  <p className="text-[11px] text-slate-500">Users can open the dropdown with search to pick other country flags & dial codes.</p>
                </button>
              </div>
            </div>
          </SettingItemCard>
        </div>
      </AdvancedOptionsSection>
    </div>
  );
}
