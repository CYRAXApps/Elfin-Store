import React from 'react';
import { Layout, Plus, Trash2, ArrowUp, ArrowDown, Phone, Mail, MapPin, Clock, Share2, ShieldCheck, CreditCard, Sparkles, Send, Globe } from 'lucide-react';
import { SiteSettings } from '../../context/SiteSettingsContext';

interface FooterCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function FooterCmsEditor({ formState, setFormState }: FooterCmsEditorProps) {
  const footer = formState.footer || {
    showFooterLogo: true,
    customLogoUrl: '',
    showAboutText: true,
    aboutText: 'Your trusted destination for genuine electronics, smart gadgets, and computing solutions with certified brand warranties and GST invoices.',
    showAddress: true,
    address: formState.general?.businessAddress || '',
    showPhone: true,
    phone: formState.general?.phone || '',
    showEmail: true,
    email: formState.general?.storeEmail || '',
    showBusinessHours: true,
    businessHours: formState.general?.businessHours || '',
    columns: [],
    showSocialIcons: true,
    socialLinks: {
      facebook: '',
      instagram: '',
      youtube: '',
      twitter: '',
      linkedin: '',
      whatsapp: '',
    },
    showNewsletter: true,
    newsletterTitle: 'Stay in the loop with tech releases',
    newsletterSubtitle: 'Subscribe to get secret deals, firmware updates, and promo codes.',
    newsletterButtonText: 'Subscribe',
    newsletterPlaceholder: 'Enter your email address...',
    showPaymentIcons: true,
    showSecurityBadges: true,
    securityBadgesText: '100% Genuine Products • 256-Bit SSL Encrypted • Authorized Brand Warranties',
    copyrightText: formState.general?.storeName ? `${formState.general.storeName}. All rights reserved.` : 'All rights reserved.',
    copyrightYear: new Date().getFullYear().toString(),
  };

  const updateFooter = (updates: Partial<typeof footer>) => {
    setFormState(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        ...updates
      }
    }));
  };

  const updateSocial = (network: string, val: string) => {
    setFormState(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        socialLinks: {
          ...(prev.footer?.socialLinks || {}),
          [network]: val
        }
      }
    }));
  };

  const addColumn = () => {
    const newCol = {
      id: `col-${Date.now()}`,
      title: 'New Navigation Column',
      enabled: true,
      order: (footer.columns?.length || 0) + 1,
      links: [
        { label: 'All Products', url: '/shop' },
        { label: 'Special Deals', url: '/shop?sale=true' }
      ]
    };
    updateFooter({
      columns: [...(footer.columns || []), newCol]
    });
  };

  const updateColumn = (index: number, updates: any) => {
    const newCols = [...(footer.columns || [])];
    newCols[index] = { ...newCols[index], ...updates };
    updateFooter({ columns: newCols });
  };

  const removeColumn = (index: number) => {
    const newCols = (footer.columns || []).filter((_, i) => i !== index);
    updateFooter({ columns: newCols });
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newCols = [...(footer.columns || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newCols.length) return;
    const temp = newCols[index];
    newCols[index] = newCols[targetIdx];
    newCols[targetIdx] = temp;
    updateFooter({ columns: newCols });
  };

  const addLinkToColumn = (colIndex: number) => {
    const newCols = [...(footer.columns || [])];
    const currentLinks = newCols[colIndex].links || [];
    newCols[colIndex].links = [...currentLinks, { label: 'New Link', url: '/shop' }];
    updateFooter({ columns: newCols });
  };

  const updateColumnLink = (colIndex: number, linkIndex: number, field: 'label' | 'url', val: string) => {
    const newCols = [...(footer.columns || [])];
    const currentLinks = [...(newCols[colIndex].links || [])];
    currentLinks[linkIndex] = { ...currentLinks[linkIndex], [field]: val };
    newCols[colIndex].links = currentLinks;
    updateFooter({ columns: newCols });
  };

  const removeColumnLink = (colIndex: number, linkIndex: number) => {
    const newCols = [...(footer.columns || [])];
    newCols[colIndex].links = (newCols[colIndex].links || []).filter((_, i) => i !== linkIndex);
    updateFooter({ columns: newCols });
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Layout size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Footer CMS & Navigation Structure</h2>
            <p className="text-xs text-slate-500">Manage brand bio, navigation columns, custom quick links, contact badges, newsletter promo, social media profiles, and copyright compliance.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Section 1: Brand Info & About Text */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Globe size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Brand Identity & About Bio</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Show Brand Logo in Footer</span>
              <input
                type="checkbox"
                checked={footer.showFooterLogo !== false}
                onChange={(e) => updateFooter({ showFooterLogo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Custom Footer Logo URL (Optional)</label>
              <input
                type="text"
                value={footer.customLogoUrl ?? ''}
                onChange={(e) => updateFooter({ customLogoUrl: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Leave blank to use primary store logo"
              />
            </div>

            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Show About / Store Description</span>
              <input
                type="checkbox"
                checked={footer.showAboutText !== false}
                onChange={(e) => updateFooter({ showAboutText: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Footer About Text</label>
              <textarea
                rows={3}
                value={footer.aboutText ?? ''}
                onChange={(e) => updateFooter({ aboutText: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Enter footer about text"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Details */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Phone size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Direct Contact & Address Disclosures</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Official Phone Number</label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={footer.showPhone !== false}
                    onChange={(e) => updateFooter({ showPhone: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>Show</span>
                </label>
              </div>
              <input
                type="text"
                value={footer.phone ?? ''}
                onChange={(e) => updateFooter({ phone: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Official Support Email</label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={footer.showEmail !== false}
                    onChange={(e) => updateFooter({ showEmail: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>Show</span>
                </label>
              </div>
              <input
                type="text"
                value={footer.email ?? ''}
                onChange={(e) => updateFooter({ email: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Physical Business Address</label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={footer.showAddress !== false}
                    onChange={(e) => updateFooter({ showAddress: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>Show</span>
                </label>
              </div>
              <input
                type="text"
                value={footer.address ?? ''}
                onChange={(e) => updateFooter({ address: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Enter address"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Business Working Hours</label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={footer.showBusinessHours !== false}
                    onChange={(e) => updateFooter({ showBusinessHours: e.target.checked })}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span>Show</span>
                </label>
              </div>
              <input
                type="text"
                value={footer.businessHours ?? ''}
                onChange={(e) => updateFooter({ businessHours: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                placeholder="Enter business hours"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Social Media Links */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Social Media Profile Links</h3>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={footer.showSocialIcons !== false}
                onChange={(e) => updateFooter({ showSocialIcons: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>Display Icons</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Facebook URL', key: 'facebook', placeholder: 'https://facebook.com' },
              { label: 'Instagram URL', key: 'instagram', placeholder: 'https://instagram.com' },
              { label: 'YouTube Channel URL', key: 'youtube', placeholder: 'https://youtube.com' },
              { label: 'X (Twitter) URL', key: 'twitter', placeholder: 'https://twitter.com' },
              { label: 'LinkedIn Page URL', key: 'linkedin', placeholder: 'https://linkedin.com' },
              { label: 'WhatsApp Link / Number', key: 'whatsapp', placeholder: 'https://wa.me/' },
            ].map(item => (
              <div key={item.key}>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">{item.label}</label>
                <input
                  type="text"
                  value={(footer.socialLinks as any)?.[item.key] ?? ''}
                  onChange={(e) => updateSocial(item.key, e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  placeholder={item.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Newsletter & Badges */}
        <div className="bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Send size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Newsletter Promo & Trust Badges</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <span className="text-xs font-bold text-slate-800">Enable Newsletter Box in Footer</span>
              <input
                type="checkbox"
                checked={footer.showNewsletter !== false}
                onChange={(e) => updateFooter({ showNewsletter: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            {footer.showNewsletter !== false && (
              <div className="space-y-2.5 pl-2 border-l-2 border-blue-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Newsletter Title</label>
                  <input
                    type="text"
                    value={footer.newsletterTitle ?? 'Stay in the loop with tech releases'}
                    onChange={(e) => updateFooter({ newsletterTitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Newsletter Subtitle</label>
                  <input
                    type="text"
                    value={footer.newsletterSubtitle ?? 'Subscribe to get secret deals and updates.'}
                    onChange={(e) => updateFooter({ newsletterSubtitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <span className="text-xs font-bold text-slate-800">Display Verified Payment Badges (Visa, Mastercard, UPI, etc.)</span>
                <input
                  type="checkbox"
                  checked={footer.showPaymentIcons !== false}
                  onChange={(e) => updateFooter({ showPaymentIcons: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <span className="text-xs font-bold text-slate-800">Display Security & Genuine Guarantee Badges</span>
                <input
                  type="checkbox"
                  checked={footer.showSecurityBadges !== false}
                  onChange={(e) => updateFooter({ showSecurityBadges: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 5: Copyright & Compliance */}
        <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Copyright Bar & Legal Disclosures</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Copyright Legal Entity Text</label>
              <input
                type="text"
                value={footer.copyrightText ?? (formState.general?.storeName ? `${formState.general.storeName}. All rights reserved.` : '')}
                onChange={(e) => updateFooter({ copyrightText: e.target.value })}
                placeholder="Enter copyright notice"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Copyright Year</label>
              <input
                type="text"
                value={footer.copyrightYear ?? new Date().getFullYear().toString()}
                onChange={(e) => updateFooter({ copyrightYear: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Navigation Columns Manager */}
        <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layout size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Footer Navigation Columns & Quick Links</h3>
            </div>
            <button
              onClick={addColumn}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={15} /> Add Column
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(footer.columns || []).map((col, cIdx) => (
              <div key={col.id || cIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                {/* Column Header */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveColumn(cIdx, 'up')}
                      disabled={cIdx === 0}
                      className="p-1 hover:bg-white rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="Move Left/Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveColumn(cIdx, 'down')}
                      disabled={cIdx === (footer.columns?.length || 0) - 1}
                      className="p-1 hover:bg-white rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                      title="Move Right/Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={col.title}
                    onChange={(e) => updateColumn(cIdx, { title: e.target.value })}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none flex-1 focus:border-blue-600"
                    placeholder="Enter column title"
                  />

                  <button
                    onClick={() => removeColumn(cIdx)}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                    title="Delete Column"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Column Links List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(col.links || []).map((lnk, lIdx) => (
                    <div key={lIdx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={lnk.label}
                        onChange={(e) => updateColumnLink(cIdx, lIdx, 'label', e.target.value)}
                        className="w-1/2 px-2 py-1 bg-white border border-slate-300 rounded text-xs outline-none focus:border-blue-600"
                        placeholder="Enter link label"
                      />
                      <input
                        type="text"
                        value={lnk.url}
                        onChange={(e) => updateColumnLink(cIdx, lIdx, 'url', e.target.value)}
                        className="w-1/2 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono outline-none focus:border-blue-600"
                        placeholder="Enter URL"
                      />
                      <button
                        onClick={() => removeColumnLink(cIdx, lIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Link Button */}
                <button
                  onClick={() => addLinkToColumn(cIdx)}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-blue-600 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus size={13} /> Add Link
                </button>
              </div>
            ))}
          </div>

          {(footer.columns || []).length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No navigation columns added. Click "+ Add Column" to construct your footer links.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
