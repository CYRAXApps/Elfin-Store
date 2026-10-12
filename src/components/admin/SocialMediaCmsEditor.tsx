import React from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import {
  Share2, Facebook, Instagram, Youtube, Twitter, Linkedin,
  MessageCircle, Send, Globe, ExternalLink, CheckCircle2,
  Phone, Eye, Sliders, ShieldCheck
} from 'lucide-react';

interface SocialMediaCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function SocialMediaCmsEditor({ formState, setFormState }: SocialMediaCmsEditorProps) {
  const social = formState.socialMedia || {
    facebookUrl: '',
    facebookEnabled: false,
    instagramUrl: '',
    instagramEnabled: false,
    youtubeUrl: '',
    youtubeEnabled: false,
    xUrl: '',
    xEnabled: false,
    linkedinUrl: '',
    linkedinEnabled: false,
    whatsappUrl: '',
    whatsappEnabled: false,
    pinterestUrl: '',
    pinterestEnabled: false,
    telegramUrl: '',
    telegramEnabled: false,
    discordUrl: '',
    discordEnabled: false,
    showSocialIcons: true,
    showInHeader: true,
    showInFooter: true,
    showFloatingWhatsapp: false
  };

  const handleFieldChange = (field: keyof typeof social, value: any) => {
    setFormState(prev => {
      const updatedSocial = {
        ...prev.socialMedia,
        [field]: value
      };

      // Also sync to footer.socialLinks so legacy footer readers remain perfectly aligned
      const updatedFooter = {
        ...prev.footer,
        showSocialIcons: updatedSocial.showSocialIcons !== false && updatedSocial.showInFooter !== false,
        socialLinks: {
          ...(prev.footer?.socialLinks || {}),
          facebook: updatedSocial.facebookUrl || '',
          instagram: updatedSocial.instagramUrl || '',
          youtube: updatedSocial.youtubeUrl || '',
          twitter: updatedSocial.xUrl || '',
          linkedin: updatedSocial.linkedinUrl || '',
          whatsapp: updatedSocial.whatsappUrl || ''
        }
      };

      return {
        ...prev,
        socialMedia: updatedSocial,
        footer: updatedFooter
      };
    });
  };

  const platforms = [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-blue-600',
      urlKey: 'facebookUrl' as const,
      enabledKey: 'facebookEnabled' as const,
      placeholder: 'https://facebook.com/yourpage',
      defaultUrl: ''
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-pink-600 hover:bg-pink-700',
      textColor: 'text-pink-600',
      urlKey: 'instagramUrl' as const,
      enabledKey: 'instagramEnabled' as const,
      placeholder: 'https://instagram.com/yourprofile',
      defaultUrl: ''
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      color: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-red-600',
      urlKey: 'youtubeUrl' as const,
      enabledKey: 'youtubeEnabled' as const,
      placeholder: 'https://youtube.com/@yourchannel',
      defaultUrl: ''
    },
    {
      id: 'x',
      name: 'X (formerly Twitter)',
      icon: Twitter,
      color: 'bg-slate-900 hover:bg-slate-800',
      textColor: 'text-slate-900',
      urlKey: 'xUrl' as const,
      enabledKey: 'xEnabled' as const,
      placeholder: 'https://x.com/yourhandle',
      defaultUrl: ''
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business / Direct Chat',
      icon: MessageCircle,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      textColor: 'text-emerald-600',
      urlKey: 'whatsappUrl' as const,
      enabledKey: 'whatsappEnabled' as const,
      placeholder: 'https://wa.me/<countrycode><number>',
      defaultUrl: ''
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Corporate',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      textColor: 'text-blue-700',
      urlKey: 'linkedinUrl' as const,
      enabledKey: 'linkedinEnabled' as const,
      placeholder: 'https://linkedin.com/company/yourcompany',
      defaultUrl: ''
    },
    {
      id: 'telegram',
      name: 'Telegram Channel / VIP Deals',
      icon: Send,
      color: 'bg-sky-500 hover:bg-sky-600',
      textColor: 'text-sky-500',
      urlKey: 'telegramUrl' as const,
      enabledKey: 'telegramEnabled' as const,
      placeholder: 'https://t.me/yourchannel',
      defaultUrl: ''
    },
    {
      id: 'pinterest',
      name: 'Pinterest Inspiration',
      icon: Globe,
      color: 'bg-rose-600 hover:bg-rose-700',
      textColor: 'text-rose-600',
      urlKey: 'pinterestUrl' as const,
      enabledKey: 'pinterestEnabled' as const,
      placeholder: 'https://pinterest.com/yourprofile',
      defaultUrl: ''
    }
  ];

  const activeCount = platforms.filter(p => (social as any)[p.enabledKey] !== false && (social as any)[p.urlKey]).length;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="text-blue-600" size={22} />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Social Media & Channels CMS</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your official social channels, customer WhatsApp hotline, header/footer icon placements, and direct chat links.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-900">
          <CheckCircle2 size={15} className="text-blue-600" />
          <span>{activeCount} Active Channel{activeCount === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Global Visibility Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
          <input
            type="checkbox"
            checked={social.showSocialIcons !== false}
            onChange={(e) => handleFieldChange('showSocialIcons', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded mt-0.5"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">Master Social Display</span>
            <span className="text-[11px] text-slate-500">Enable or disable social links across entire store</span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
          <input
            type="checkbox"
            checked={social.showInFooter !== false}
            onChange={(e) => handleFieldChange('showInFooter', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded mt-0.5"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">Show in Footer</span>
            <span className="text-[11px] text-slate-500">Render active social icons in the footer copyright row</span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/60 transition-colors">
          <input
            type="checkbox"
            checked={social.showFloatingWhatsapp !== false}
            onChange={(e) => handleFieldChange('showFloatingWhatsapp', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded mt-0.5"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">Floating WhatsApp Button</span>
            <span className="text-[11px] text-slate-500">Show quick floating WhatsApp icon at bottom-right of store</span>
          </div>
        </label>
      </div>

      {/* Social Platforms List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Configured Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const urlValue = (social as any)[platform.urlKey] || '';
            const isEnabled = (social as any)[platform.enabledKey] !== false;

            return (
              <div
                key={platform.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isEnabled && urlValue
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl text-white ${platform.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{platform.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleFieldChange(platform.enabledKey, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={urlValue}
                      onChange={(e) => handleFieldChange(platform.urlKey, e.target.value)}
                      placeholder={platform.placeholder}
                      disabled={!isEnabled}
                      className="flex-1 px-3 py-2 bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-blue-500"
                    />
                    {urlValue && isEnabled && (
                      <a
                        href={urlValue.startsWith('http') || urlValue.startsWith('https') ? urlValue : `https://${urlValue}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors"
                        title="Test link in new tab"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Store Preview of Social Icons */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Eye size={14} className="text-blue-400" /> Storefront Live Icon Bar Preview
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Rendered in Footer</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {platforms.map(platform => {
            const Icon = platform.icon;
            const isEnabled = (social as any)[platform.enabledKey] !== false;
            const url = (social as any)[platform.urlKey];
            if (!isEnabled || !url) return null;

            return (
              <div
                key={platform.id}
                className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl flex items-center gap-2 hover:border-slate-700 transition-colors"
              >
                <Icon size={16} className={platform.textColor} />
                <span className="text-xs font-semibold">{platform.name.split(' ')[0]}</span>
              </div>
            );
          })}

          {activeCount === 0 && (
            <p className="text-xs text-slate-500 italic">No social media platforms enabled. Check the switches above to show your channels.</p>
          )}
        </div>
      </div>
    </div>
  );
}
