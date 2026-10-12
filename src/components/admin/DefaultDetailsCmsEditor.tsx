import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import { uploadSiteAsset } from '../../utils/assetUploader';
import {
  Store, Building, Phone, Mail, MapPin, Globe, ShieldCheck, Upload, Loader2,
  FileText, Image as ImageIcon, Sliders, Check, Share2, Sparkles, MessageCircle,
  HelpCircle, Clock, Info, Tag, CheckCircle2
} from 'lucide-react';

interface DefaultDetailsCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function DefaultDetailsCmsEditor({ formState, setFormState }: DefaultDetailsCmsEditorProps) {
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // General & Branding
  const general = (formState.general || {}) as any;
  const branding = (formState.branding || {}) as any;
  const contact = (formState.contact || {}) as any;
  const tax = (formState.tax || {}) as any;
  const footer = (formState.footer || {}) as any;
  const seo = (formState.seo || {}) as any;
  const social = (formState.socialMedia || {}) as any;
  const header = (formState.header || {}) as any;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldKey: string,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldKey);
    try {
      const assetUrl = await uploadSiteAsset(file, 'defaults');
      onSuccess(assetUrl);
    } catch (err: any) {
      console.error('File upload error in DefaultDetails editor:', err);
      alert(err.message || 'Failed to upload asset.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const updateStoreName = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, storeName: val, shortStoreName: val ? val.split(' ')[0] : '' },
      branding: { ...prev.branding, brandName: val },
      contact: { ...prev.contact, businessName: val }
    }));
  };

  const updateShortStoreName = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, shortStoreName: val }
    }));
  };

  const updateTagline = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, tagline: val },
      branding: { ...prev.branding, brandTagline: val }
    }));
  };

  const updateStoreLogo = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, storeLogoUrl: val },
      branding: { ...prev.branding, primaryLogo: val }
    }));
  };

  const updateFavicon = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, faviconUrl: val },
      branding: { ...prev.branding, favicon: val }
    }));
  };

  const updatePhone = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, phone: val },
      contact: { ...prev.contact, phone: val }
    }));
  };

  const updateWhatsapp = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, whatsappNumber: val },
      contact: { ...prev.contact, whatsapp: val }
    }));
  };

  const updateStoreEmail = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, storeEmail: val },
      contact: { ...prev.contact, email: val }
    }));
  };

  const updateSupportEmail = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, supportEmail: val },
      contact: { ...prev.contact, supportEmail: val }
    }));
  };

  const updateAddress = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, businessAddress: val },
      contact: { ...prev.contact, address: val }
    }));
  };

  const updateCity = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, city: val },
      contact: { ...prev.contact, city: val }
    }));
  };

  const updateState = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, state: val },
      contact: { ...prev.contact, state: val }
    }));
  };

  const updatePincode = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, pincode: val },
      contact: { ...prev.contact, pincode: val }
    }));
  };

  const updateCountry = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, country: val },
      contact: { ...prev.contact, country: val }
    }));
  };

  const updateHours = (val: string) => {
    setFormState(prev => ({
      ...prev,
      general: { ...prev.general, businessHours: val },
      contact: { ...prev.contact, openingHours: val }
    }));
  };

  const updateGstin = (val: string) => {
    const cleanGstin = val.toUpperCase().trim();
    setFormState(prev => ({
      ...prev,
      tax: { ...prev.tax, gstin: cleanGstin },
      contact: { ...prev.contact, gstin: cleanGstin }
    }));
  };

  const updateLegalEntity = (val: string) => {
    setFormState(prev => ({
      ...prev,
      contact: { ...prev.contact, legalEntityName: val }
    }));
  };

  const updatePan = (val: string) => {
    setFormState(prev => ({
      ...prev,
      contact: { ...prev.contact, pan: val.toUpperCase().trim() }
    }));
  };

  return (
    <div className="space-y-8" id="default-details-cms-editor">
      {/* Header Overview */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
          <Store className="text-blue-600" size={22} /> Default Details & Content Management
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure authoritative default details for branding, business identities, contact information, website graphics, and content fallbacks. Fields left empty will remain empty on the customer site—no fake data is inserted.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form Fields */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. Store Branding & Identity */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles size={16} className="text-blue-600" /> Branding & Identity Controls
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store / Brand Name
                </label>
                <input
                  type="text"
                  value={general.storeName || branding.brandName || ''}
                  onChange={(e) => updateStoreName(e.target.value)}
                  placeholder="e.g. ELECTRO STORE"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Store Name
                </label>
                <input
                  type="text"
                  value={general.shortStoreName || ''}
                  onChange={(e) => updateShortStoreName(e.target.value)}
                  placeholder="e.g. ELECTRO"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={branding.brandTagline || general.tagline || ''}
                  onChange={(e) => updateTagline(e.target.value)}
                  placeholder="e.g. Your trusted destination for genuine electronics & gadgets"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Global Browser Title (SEO Title)
                </label>
                <input
                  type="text"
                  value={seo.globalTitle || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, seo: { ...prev.seo, globalTitle: e.target.value } }))}
                  placeholder="e.g. ELECTRO STORE — Laptops, Smartphones & Electronics"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Logo & Favicon Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {/* Primary Logo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Primary Store Logo</label>
                  <label className={`px-2.5 py-1 ${uploadingField === 'primaryLogo' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-[11px] font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 border border-blue-200`}>
                    {uploadingField === 'primaryLogo' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {uploadingField === 'primaryLogo' ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e, 'primaryLogo', updateStoreLogo)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={branding.primaryLogo || general.storeLogoUrl || ''}
                    onChange={(e) => updateStoreLogo(e.target.value)}
                    placeholder="/assets/logo.svg or image URL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  {(branding.primaryLogo || general.storeLogoUrl) && (
                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img src={branding.primaryLogo || general.storeLogoUrl} alt="Logo" className="max-h-8 max-w-8 object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Favicon Browser Icon</label>
                  <label className={`px-2.5 py-1 ${uploadingField === 'favicon' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-[11px] font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 border border-blue-200`}>
                    {uploadingField === 'favicon' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {uploadingField === 'favicon' ? 'Uploading...' : 'Upload Icon'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e, 'favicon', updateFavicon)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={branding.favicon || general.faviconUrl || ''}
                    onChange={(e) => updateFavicon(e.target.value)}
                    placeholder="/assets/favicon.svg or image URL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  {(branding.favicon || general.faviconUrl) && (
                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      <img src={branding.favicon || general.faviconUrl} alt="Favicon" className="w-5 h-5 object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Contact Information & Address */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Phone size={16} className="text-blue-600" /> Contact Information & Operating Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Business Phone
                </label>
                <input
                  type="text"
                  value={general.phone || contact.phone || ''}
                  onChange={(e) => updatePhone(e.target.value)}
                  placeholder="Enter business phone number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={general.whatsappNumber || contact.whatsapp || ''}
                  onChange={(e) => updateWhatsapp(e.target.value)}
                  placeholder="Enter WhatsApp support number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Store Email
                </label>
                <input
                  type="email"
                  value={general.storeEmail || contact.email || ''}
                  onChange={(e) => updateStoreEmail(e.target.value)}
                  placeholder="Enter store email address"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={general.supportEmail || contact.supportEmail || ''}
                  onChange={(e) => updateSupportEmail(e.target.value)}
                  placeholder="Enter support email address"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complete Street / Business Address
                </label>
                <textarea
                  rows={2}
                  value={general.businessAddress || contact.address || ''}
                  onChange={(e) => updateAddress(e.target.value)}
                  placeholder="Enter full business street address"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={general.city || contact.city || ''}
                  onChange={(e) => updateCity(e.target.value)}
                  placeholder="Enter city"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={general.state || contact.state || ''}
                  onChange={(e) => updateState(e.target.value)}
                  placeholder="Enter state"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={general.pincode || contact.pincode || ''}
                  onChange={(e) => updatePincode(e.target.value)}
                  placeholder="e.g. 700001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={general.country || contact.country || 'India'}
                  onChange={(e) => updateCountry(e.target.value)}
                  placeholder="India"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operating / Business Hours
                </label>
                <input
                  type="text"
                  value={general.businessHours || contact.openingHours || ''}
                  onChange={(e) => updateHours(e.target.value)}
                  placeholder="e.g. Mon - Sat: 9:30 AM - 8:00 PM IST"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Business Information & Tax Identity */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building size={16} className="text-blue-600" /> Business Registration & Tax ID (GSTIN)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Legal Entity / Business Name
                </label>
                <input
                  type="text"
                  value={contact.legalEntityName || ''}
                  onChange={(e) => updateLegalEntity(e.target.value)}
                  placeholder="Enter official registered business name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  GSTIN (15-Digit Goods & Services Tax Number)
                </label>
                <input
                  type="text"
                  value={tax.gstin || contact.gstin || ''}
                  onChange={(e) => updateGstin(e.target.value)}
                  placeholder="Enter 15-digit GSTIN or leave blank"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAN / Registration Details
                </label>
                <input
                  type="text"
                  value={contact.pan || ''}
                  onChange={(e) => updatePan(e.target.value)}
                  placeholder="Enter 10-digit PAN or business registration code"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Website Content & Announcement Defaults */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText size={16} className="text-blue-600" /> Website Content & Announcement Bar
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Main Store Description / Tagline Content
                </label>
                <textarea
                  rows={2}
                  value={general.storeDescription || seo.metaDescription || ''}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    general: { ...prev.general, storeDescription: e.target.value },
                    seo: { ...prev.seo, metaDescription: e.target.value }
                  }))}
                  placeholder="Enter store description for search engines & website footer..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Footer About Store Paragraph
                </label>
                <textarea
                  rows={2}
                  value={footer.aboutText || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, footer: { ...prev.footer, aboutText: e.target.value } }))}
                  placeholder="Enter custom about text for footer column..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Footer Security & Trust Statement
                </label>
                <input
                  type="text"
                  value={footer.securityBadgesText || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, footer: { ...prev.footer, securityBadgesText: e.target.value } }))}
                  placeholder="e.g. 100% Genuine Products • 256-Bit SSL Encrypted • Authorized Brand Warranties"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Announcement Bar Banner Text
                  </label>
                  <input
                    type="text"
                    value={header.announcementBar?.text || ''}
                    onChange={(e) => setFormState(prev => ({
                      ...prev,
                      header: {
                        ...prev.header,
                        announcementBar: { ...(prev.header?.announcementBar || {}), text: e.target.value, enabled: true }
                      }
                    }))}
                    placeholder="e.g. Free Express Delivery on orders over ₹500 across India!"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Button Text</label>
                  <input
                    type="text"
                    value={header.announcementBar?.linkText || ''}
                    onChange={(e) => setFormState(prev => ({
                      ...prev,
                      header: {
                        ...prev.header,
                        announcementBar: { ...(prev.header?.announcementBar || {}), linkText: e.target.value, enabled: true }
                      }
                    }))}
                    placeholder="e.g. Shop Deals"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Announcement Target Link</label>
                  <input
                    type="text"
                    value={header.announcementBar?.link || ''}
                    onChange={(e) => setFormState(prev => ({
                      ...prev,
                      header: {
                        ...prev.header,
                        announcementBar: { ...(prev.header?.announcementBar || {}), link: e.target.value, enabled: true }
                      }
                    }))}
                    placeholder="/shop or /shop?sale=true"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Social Media Channels */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Share2 size={16} className="text-blue-600" /> Social Media Links & Channels
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facebook Page URL</label>
                <input
                  type="text"
                  value={social.facebookUrl || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, facebookUrl: e.target.value, facebookEnabled: Boolean(e.target.value) } }))}
                  placeholder="https://facebook.com/yourbrand"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instagram Handle URL</label>
                <input
                  type="text"
                  value={social.instagramUrl || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, instagramUrl: e.target.value, instagramEnabled: Boolean(e.target.value) } }))}
                  placeholder="https://instagram.com/yourbrand"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">YouTube Channel URL</label>
                <input
                  type="text"
                  value={social.youtubeUrl || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, youtubeUrl: e.target.value, youtubeEnabled: Boolean(e.target.value) } }))}
                  placeholder="https://youtube.com/@yourbrand"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">X (Twitter) Profile URL</label>
                <input
                  type="text"
                  value={social.xUrl || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, xUrl: e.target.value, xEnabled: Boolean(e.target.value) } }))}
                  placeholder="https://x.com/yourbrand"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn Company Page</label>
                <input
                  type="text"
                  value={social.linkedinUrl || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, linkedinUrl: e.target.value, linkedinEnabled: Boolean(e.target.value) } }))}
                  placeholder="https://linkedin.com/company/yourbrand"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Channel Link</label>
                <input
                  type="text"
                  value={social.whatsappUrl || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, socialMedia: { ...prev.socialMedia, whatsappUrl: e.target.value, whatsappEnabled: Boolean(e.target.value) } }))}
                  placeholder="https://wa.me/91xxxxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 6. Default Images & Graphics */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon size={16} className="text-blue-600" /> Default Images & Graphic Assets
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin Sidebar Logo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Admin Sidebar Logo</label>
                  <label className={`px-2 py-0.5 ${uploadingField === 'adminLogo' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-[10px] font-bold rounded cursor-pointer transition-colors inline-flex items-center gap-1 border border-blue-200`}>
                    {uploadingField === 'adminLogo' ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e, 'adminLogo', (url) => setFormState(prev => ({ ...prev, branding: { ...prev.branding, adminLogo: url } })))}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={branding.adminLogo || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, branding: { ...prev.branding, adminLogo: e.target.value } }))}
                  placeholder="/assets/logo.svg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Login Page Logo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Login / Portal Logo</label>
                  <label className={`px-2 py-0.5 ${uploadingField === 'loginLogo' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-[10px] font-bold rounded cursor-pointer transition-colors inline-flex items-center gap-1 border border-blue-200`}>
                    {uploadingField === 'loginLogo' ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e, 'loginLogo', (url) => setFormState(prev => ({ ...prev, branding: { ...prev.branding, loginLogo: url } })))}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={branding.loginLogo || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, branding: { ...prev.branding, loginLogo: e.target.value } }))}
                  placeholder="/assets/logo.svg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Default Social Share Image (OG) */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Default Social Share Image (OG Banner)</label>
                  <label className={`px-2.5 py-1 ${uploadingField === 'defaultOgImage' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-[11px] font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 border border-blue-200`}>
                    {uploadingField === 'defaultOgImage' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    Upload OG Image
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e, 'defaultOgImage', (url) => setFormState(prev => ({ ...prev, seo: { ...prev.seo, defaultOgImage: url } })))}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={seo.defaultOgImage || ''}
                    onChange={(e) => setFormState(prev => ({ ...prev, seo: { ...prev.seo, defaultOgImage: e.target.value } }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  {seo.defaultOgImage && (
                    <div className="w-12 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={seo.defaultOgImage} alt="OG Banner" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Audit & Live Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 sticky top-4 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" /> Default Values Audit
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={13} className="text-emerald-400" /> No Fake Defaults
                </span>
                <p className="text-[11px] text-slate-300">
                  When address, phone, GSTIN, or email fields are left empty, they will render nothing or neutral labels on the live storefront. Fake numbers or mock addresses will never be generated.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Globe size={13} className="text-blue-400" /> Real Database Persistence
                </span>
                <p className="text-[11px] text-slate-300">
                  Clicking <strong>Save Draft</strong> or <strong>Publish Live</strong> persists these settings directly to the Firestore database. Changes survive logins, page refreshes, and device switches.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Sliders size={13} className="text-amber-400" /> Unified CMS Sync
                </span>
                <p className="text-[11px] text-slate-300">
                  Editing store name, logo, or contact info here automatically updates the Desktop Header, Mobile Header, Footer, and Admin branding seamlessly.
                </p>
              </div>
            </div>

            {/* Quick Live Preview Card */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Storefront Footer Preview
              </span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <p className="font-extrabold text-white text-sm">
                  {general.storeName || branding.brandName || 'ELECTRO STORE'}
                </p>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {footer.aboutText || general.storeDescription || 'Your trusted electronics store.'}
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1 text-slate-300">
                  <p><strong>Phone:</strong> {general.phone || contact.phone || <span className="text-slate-500 italic">Not specified</span>}</p>
                  <p><strong>Email:</strong> {general.storeEmail || contact.email || <span className="text-slate-500 italic">Not specified</span>}</p>
                  <p><strong>Address:</strong> {general.businessAddress || contact.address || <span className="text-slate-500 italic">Not specified</span>}</p>
                  <p><strong>GSTIN:</strong> {tax.gstin || contact.gstin || <span className="text-slate-500 italic">Not specified</span>}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DefaultDetailsCmsEditor;
