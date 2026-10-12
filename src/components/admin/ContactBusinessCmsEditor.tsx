import React from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import {
  Building2, Phone, Mail, MapPin, Clock, MessageSquare,
  Globe, ShieldCheck, Eye, ExternalLink, CheckCircle2, FileText
} from 'lucide-react';

interface ContactBusinessCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function ContactBusinessCmsEditor({ formState, setFormState }: ContactBusinessCmsEditorProps) {
  const contact = formState.contact || {
    businessName: formState.general?.storeName || '',
    address: formState.general?.businessAddress || '',
    city: formState.general?.city || '',
    district: '',
    state: formState.general?.state || '',
    pincode: formState.general?.pincode || '',
    country: formState.general?.country || 'India',
    phone: formState.general?.phone || '',
    secondaryPhone: '',
    whatsapp: formState.general?.whatsappNumber || '',
    email: formState.general?.storeEmail || '',
    supportEmail: formState.general?.supportEmail || '',
    openingHours: formState.general?.businessHours || '',
    googleMapsUrl: '',
    showContactForm: true,
    contactFormRecipientEmail: formState.general?.storeEmail || '',
    gstin: formState.tax?.gstin || '',
    pan: ''
  };

  const handleContactChange = (field: keyof typeof contact, value: any) => {
    setFormState(prev => {
      const updatedContact = {
        ...prev.contact,
        [field]: value
      };

      // Also sync basic fields into general & footer to maintain absolute storewide consistency
      const updatedGeneral = {
        ...prev.general,
        storeName: field === 'businessName' ? value : prev.general?.storeName,
        phone: field === 'phone' ? value : prev.general?.phone,
        whatsappNumber: field === 'whatsapp' ? value : prev.general?.whatsappNumber,
        storeEmail: field === 'email' ? value : prev.general?.storeEmail,
        supportEmail: field === 'supportEmail' ? value : prev.general?.supportEmail,
        businessAddress: field === 'address' ? value : prev.general?.businessAddress,
        city: field === 'city' ? value : prev.general?.city,
        state: field === 'state' ? value : prev.general?.state,
        pincode: field === 'pincode' ? value : prev.general?.pincode,
        country: field === 'country' ? value : prev.general?.country,
        businessHours: field === 'openingHours' ? value : prev.general?.businessHours
      };

      const updatedFooter = {
        ...prev.footer,
        phone: field === 'phone' ? value : prev.footer?.phone,
        email: field === 'supportEmail' || field === 'email' ? value : prev.footer?.email,
        address: field === 'address' ? value : prev.footer?.address,
        businessHours: field === 'openingHours' ? value : prev.footer?.businessHours
      };

      return {
        ...prev,
        contact: updatedContact,
        general: updatedGeneral,
        footer: updatedFooter
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" size={22} />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Contact & Business Information CMS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure registered company details, GST compliance, phone hotlines, support emails, location coordinates, and customer contact forms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-5">
          {/* Company Legal Identity */}
          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" /> Company Identity & Registration
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Registered Business / Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact.businessName || ''}
                  onChange={(e) => handleContactChange('businessName', e.target.value)}
                  placeholder="Enter registered business name"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">GSTIN (Tax ID)</label>
                  <input
                    type="text"
                    value={contact.gstin || ''}
                    onChange={(e) => handleContactChange('gstin', e.target.value)}
                    placeholder="Enter GSTIN"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Printed on customer GST invoices.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Company PAN</label>
                  <input
                    type="text"
                    value={contact.pan || ''}
                    onChange={(e) => handleContactChange('pan', e.target.value)}
                    placeholder="Enter PAN number"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Physical Address Breakdown */}
          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" /> Physical Address & Location
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Street Address / Building / Tech Park <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact.address || ''}
                  onChange={(e) => handleContactChange('address', e.target.value)}
                  placeholder="Enter street address"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={contact.city || ''}
                    onChange={(e) => handleContactChange('city', e.target.value)}
                    placeholder="Enter city"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={contact.district || ''}
                    onChange={(e) => handleContactChange('district', e.target.value)}
                    placeholder="Enter district"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={contact.state || ''}
                    onChange={(e) => handleContactChange('state', e.target.value)}
                    placeholder="Enter state"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={contact.pincode || ''}
                    onChange={(e) => handleContactChange('pincode', e.target.value)}
                    placeholder="Enter pincode"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={contact.country || 'India'}
                    onChange={(e) => handleContactChange('country', e.target.value)}
                    placeholder="Enter country"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Google Maps Link</label>
                  <input
                    type="text"
                    value={contact.googleMapsUrl || ''}
                    onChange={(e) => handleContactChange('googleMapsUrl', e.target.value)}
                    placeholder="Enter Google Maps link"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Communications Channels */}
          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Phone size={16} className="text-blue-600" /> Phones, Emails & Business Hours
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Primary Support Hotline</label>
                <input
                  type="text"
                  value={contact.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  placeholder="Enter hotline phone number"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Support WhatsApp Number</label>
                <input
                  type="text"
                  value={contact.whatsapp || ''}
                  onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                  placeholder="Enter WhatsApp number"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Customer Support Email</label>
                <input
                  type="email"
                  value={contact.supportEmail || ''}
                  onChange={(e) => handleContactChange('supportEmail', e.target.value)}
                  placeholder="Enter support email"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">General Inquiries Email</label>
                <input
                  type="email"
                  value={contact.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  placeholder="Enter general email"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Official Business / Support Hours</label>
              <input
                type="text"
                value={contact.openingHours || ''}
                onChange={(e) => handleContactChange('openingHours', e.target.value)}
                placeholder="Enter business hours"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contact Form Preferences */}
          <div className="bg-slate-50 p-5 border border-slate-200 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-600" /> Contact Page Form Controls
            </h3>

            <label className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={contact.showContactForm !== false}
                onChange={(e) => handleContactChange('showContactForm', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded mt-0.5"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Enable Interactive Contact Form on /contact</span>
                <span className="text-[11px] text-slate-500">Allows shoppers to submit support tickets, bulk quote inquiries, and RMA requests.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Right Column: Live Contact Page Card Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye size={14} className="text-blue-400" /> Live Contact Card Preview
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                /contact
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {contact.businessName || formState.general?.storeName || 'Not configured'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Official Authorized Brand Retailer & Fulfillment Center</p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Customer Care Hotline</p>
                    <p className="font-semibold text-white">{contact.phone || 'Not configured'}</p>
                    {contact.whatsapp && (
                      <p className="text-[11px] text-emerald-400 font-medium">WhatsApp: {contact.whatsapp}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Support Email</p>
                    <p className="font-semibold text-white">{contact.supportEmail || 'Not configured'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Registered Office</p>
                    <p className="font-semibold text-white leading-relaxed">
                      {contact.address ? `${contact.address}${contact.city ? `, ${contact.city}` : ''}${contact.state ? `, ${contact.state}` : ''}${contact.pincode ? ` ${contact.pincode}` : ''}` : 'Not configured'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Operating Hours</p>
                    <p className="font-semibold text-white">{contact.openingHours || 'Not configured'}</p>
                  </div>
                </div>

                {contact.gstin && (
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">GSTIN:</span>
                    <span className="font-mono text-blue-400 font-bold">{contact.gstin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
