import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import { 
  Palette, Sparkles, Check, Sun, Moon, Laptop, Type, Sliders, 
  Square, Paintbrush, Image as ImageIcon, Layout, Box, Eye, Upload, Loader2,
  RotateCcw, Smartphone, Monitor, PanelLeft, Maximize2
} from 'lucide-react';
import { getBorderRadiusValue, getButtonRadiusValue } from '../../utils/themeUtils';
import { uploadSiteAsset } from '../../utils/assetUploader';

const DEFAULT_LOGO_SIZES = {
  desktopHeaderWidth: 180,
  mobileHeaderWidth: 150,
  adminPanelWidth: 140,
  footerWidth: 160,
};

interface AppearanceCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  text?: string;
  description: string;
}

const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Electric Blue (Default)',
    primary: '#2563eb',
    secondary: '#0f172a',
    accent: '#ef4444',
    background: '#ffffff',
    text: '#0f172a',
    description: 'Modern, high-trust consumer electronics palette'
  },
  {
    name: 'Emerald Tech',
    primary: '#059669',
    secondary: '#064e3b',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#0f172a',
    description: 'Clean eco-friendly gadget and audio branding'
  },
  {
    name: 'Royal Indigo',
    primary: '#4f46e5',
    secondary: '#1e1b4b',
    accent: '#ec4899',
    background: '#ffffff',
    text: '#0f172a',
    description: 'Premium gaming and high-end hardware aesthetic'
  },
  {
    name: 'Crimson Power',
    primary: '#dc2626',
    secondary: '#0f172a',
    accent: '#f97316',
    background: '#ffffff',
    text: '#0f172a',
    description: 'High-urgency sales, dynamic tech and gaming deals'
  },
  {
    name: 'Sunset Amber',
    primary: '#ea580c',
    secondary: '#1c1917',
    accent: '#3b82f6',
    background: '#ffffff',
    text: '#0f172a',
    description: 'Vibrant smart home tech and lifestyle electronics'
  },
  {
    name: 'Cyber Slate',
    primary: '#0284c7',
    secondary: '#020617',
    accent: '#10b981',
    background: '#ffffff',
    text: '#0f172a',
    description: 'Sleek enterprise computing and futuristic devices'
  }
];

const FONT_OPTIONS = [
  { id: 'Inter', label: 'Inter', category: 'Modern Clean Sans' },
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'Geometric Tech Sans' },
  { id: 'Outfit', label: 'Outfit', category: 'High-Tech Contemporary' },
  { id: 'Poppins', label: 'Poppins', category: 'Soft & Friendly' },
  { id: 'Roboto', label: 'Roboto', category: 'Neutral Standard' },
  { id: 'Manrope', label: 'Manrope', category: 'Refined Corporate' },
];

export function AppearanceCmsEditor({ formState, setFormState }: AppearanceCmsEditorProps) {
  const theme = formState.theme || {
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
    accentColor: '#ef4444',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
    cardStyle: 'shadow-sm border',
    borderRadius: 'md',
    buttonRadius: 'md',
    typographyScale: 'standard',
    headerStyle: 'modern',
    productCardStyle: 'modern',
    fontFamily: 'Inter',
    colorScheme: 'light',
  };

  const branding = formState.branding || {
    primaryLogo: formState.general?.storeLogoUrl || '',
    mobileLogo: '',
    favicon: formState.general?.faviconUrl || '',
    brandName: formState.general?.storeName || 'ELECTRO STORE',
    brandTagline: formState.general?.tagline || '',
    logoSizes: DEFAULT_LOGO_SIZES,
  };

  const logoSizes = {
    desktopHeaderWidth: branding.logoSizes?.desktopHeaderWidth ?? DEFAULT_LOGO_SIZES.desktopHeaderWidth,
    mobileHeaderWidth: branding.logoSizes?.mobileHeaderWidth ?? DEFAULT_LOGO_SIZES.mobileHeaderWidth,
    adminPanelWidth: branding.logoSizes?.adminPanelWidth ?? DEFAULT_LOGO_SIZES.adminPanelWidth,
    footerWidth: branding.logoSizes?.footerWidth ?? DEFAULT_LOGO_SIZES.footerWidth,
  };

  const updateLogoSize = (key: keyof typeof DEFAULT_LOGO_SIZES, val: number) => {
    const num = isNaN(val) ? DEFAULT_LOGO_SIZES[key] : val;
    const clamped = Math.max(30, Math.min(400, num));
    setFormState(prev => {
      const prevBrand = prev.branding || {};
      const currentSizes = prevBrand.logoSizes || DEFAULT_LOGO_SIZES;
      const updatedSizes = {
        ...currentSizes,
        [key]: clamped,
      };
      return {
        ...prev,
        branding: {
          ...prevBrand,
          logoSizes: updatedSizes,
        },
      };
    });
  };

  const resetLogoSize = (key: keyof typeof DEFAULT_LOGO_SIZES) => {
    updateLogoSize(key, DEFAULT_LOGO_SIZES[key]);
  };

  const updateTheme = (updates: Partial<typeof theme>) => {
    setFormState(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        ...updates
      }
    }));
  };

  const updateBranding = (updates: Partial<typeof branding>) => {
    setFormState(prev => {
      const prevBrand = prev.branding || {};
      const prevGen = prev.general || {};

      const newBrandName = updates.brandName !== undefined 
        ? updates.brandName 
        : (prevBrand.brandName || prevGen.storeName || '');

      const newPrimaryLogo = updates.primaryLogo !== undefined 
        ? updates.primaryLogo 
        : (prevBrand.primaryLogo || prevGen.storeLogoUrl || '');

      const newFavicon = updates.favicon !== undefined 
        ? updates.favicon 
        : (prevBrand.favicon || prevGen.faviconUrl || '');

      const newTagline = updates.brandTagline !== undefined 
        ? updates.brandTagline 
        : (prevBrand.brandTagline || prevGen.tagline || '');

      return {
        ...prev,
        branding: {
          ...prevBrand,
          ...updates,
          brandName: newBrandName,
          primaryLogo: newPrimaryLogo,
          adminLogo: newPrimaryLogo,
          loginLogo: newPrimaryLogo,
          emailLogo: newPrimaryLogo,
          favicon: newFavicon,
          brandTagline: newTagline,
        },
        general: {
          ...prevGen,
          storeName: newBrandName,
          shortStoreName: newBrandName ? newBrandName.split(' ')[0] : prevGen.shortStoreName,
          storeLogoUrl: newPrimaryLogo,
          faviconUrl: newFavicon,
          tagline: newTagline,
        },
        contact: {
          ...prev.contact,
          businessName: newBrandName || prev.contact?.businessName,
        }
      };
    });
  };

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: 'primaryLogo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldKey);
    try {
      const assetUrl = await uploadSiteAsset(file, 'branding');
      updateBranding({ [fieldKey]: assetUrl });
    } catch (err: any) {
      console.error('File upload error in Appearance editor:', err);
      alert(err.message || 'Failed to upload image asset.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const applyPreset = (preset: ColorPreset) => {
    updateTheme({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
      backgroundColor: preset.background || '#ffffff',
      textColor: preset.text || '#0f172a',
    });
  };

  const currentFont = theme.fontFamily || 'Inter';
  const currentColorScheme = theme.colorScheme || 'light';
  const previewBorderRadius = getBorderRadiusValue(theme.borderRadius);
  const previewButtonRadius = getButtonRadiusValue(theme.buttonRadius);
  const headerStyle = theme.headerStyle || 'modern';
  const productCardStyle = theme.productCardStyle || 'modern';

  return (
    <div className="space-y-8" id="appearance-cms-editor">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Palette className="text-blue-600" size={20} /> Storefront Appearance & Branding
        </h2>
        <p className="text-slate-500 text-xs mt-1">
          Customize logos, theme color palettes, typography, header styles, and product cards from one unified design center.
        </p>
      </div>

      {/* Preset Palettes Quick Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" /> Recommended Brand Color Presets
          </span>
          <span className="text-[11px] text-slate-400">Click any preset to apply instant palette</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = theme.primaryColor === preset.primary && theme.secondaryColor === preset.secondary;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-full ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: preset.primary }} />
                    <div className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: preset.secondary }} />
                    <div className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{preset.name.split(' (')[0]}</h4>
                </div>
                {isSelected && (
                  <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 mt-2">
                    <Check size={11} /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-6">

          {/* 1. Logo & Favicon */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon size={16} className="text-blue-600" /> Logo & Favicon
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Primary Store Logo
                  </label>
                  <label className={`px-2.5 py-1 ${uploadingField === 'primaryLogo' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-[11px] font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 border border-blue-200/60`}>
                    {uploadingField === 'primaryLogo' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {uploadingField === 'primaryLogo' ? 'Uploading...' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingField !== null}
                      onChange={(e) => handleFileUpload(e, 'primaryLogo')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={branding.primaryLogo || ''}
                    onChange={(e) => updateBranding({ primaryLogo: e.target.value })}
                    placeholder="Enter image URL or upload image"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                  {branding.primaryLogo && (
                    <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={branding.primaryLogo} alt="Logo" className="max-h-8 max-w-8 object-contain" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Displayed in website header, invoices, and email receipts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Favicon / Browser Icon
                    </label>
                    <label className={`px-2.5 py-1 ${uploadingField === 'favicon' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'} text-[11px] font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1 border border-blue-200/60`}>
                      {uploadingField === 'favicon' ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {uploadingField === 'favicon' ? 'Uploading...' : 'Upload Icon'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingField !== null}
                        onChange={(e) => handleFileUpload(e, 'favicon')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={branding.favicon || ''}
                      onChange={(e) => updateBranding({ favicon: e.target.value })}
                      placeholder="/favicon.ico or upload icon"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                    {branding.favicon && (
                      <div className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={branding.favicon} alt="Favicon" className="w-4 h-4 object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brand / Store Name
                  </label>
                  <input
                    type="text"
                    value={branding.brandName || ''}
                    onChange={(e) => updateBranding({ brandName: e.target.value })}
                    placeholder="ELECTRO STORE"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo Size Adjustments */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4" id="branding-logo-sizes">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders size={16} className="text-blue-600" /> Logo Size Adjustments
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Adjust width sliders or enter precise pixel values for Mobile Header, Desktop Header, Admin Panel, and Footer. Original proportions are preserved automatically.
              </p>
            </div>

            <div className="space-y-4">
              {/* 1. Desktop Header Width */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Monitor size={14} className="text-blue-600" /> Desktop Header Logo Width
                  </span>
                  <button
                    type="button"
                    onClick={() => resetLogoSize('desktopHeaderWidth')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset (180px)
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-8">
                    <input
                      type="range"
                      min={50}
                      max={350}
                      step={1}
                      value={logoSizes.desktopHeaderWidth}
                      onChange={(e) => updateLogoSize('desktopHeaderWidth', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-4 relative">
                    <input
                      type="number"
                      min={50}
                      max={350}
                      value={logoSizes.desktopHeaderWidth}
                      onChange={(e) => updateLogoSize('desktopHeaderWidth', parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1 pr-6 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-2 top-1 text-xs font-semibold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>
                {/* Mini Preview Box */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Desktop Header Preview:</span>
                  <div className="h-9 px-3 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-lg flex items-center justify-center overflow-hidden flex-1 max-w-[220px]">
                    {branding.primaryLogo ? (
                      <img
                        src={branding.primaryLogo}
                        alt="Desktop Header Logo Preview"
                        style={{
                          width: `${logoSizes.desktopHeaderWidth}px`,
                          maxWidth: '100%',
                          height: 'auto',
                          maxHeight: '30px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <span className="text-white font-black text-xs italic truncate">{branding.brandName || 'ELECTRO STORE'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Mobile Header Width */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-blue-600" /> Mobile Header Logo Width
                  </span>
                  <button
                    type="button"
                    onClick={() => resetLogoSize('mobileHeaderWidth')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset (150px)
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-8">
                    <input
                      type="range"
                      min={40}
                      max={250}
                      step={1}
                      value={logoSizes.mobileHeaderWidth}
                      onChange={(e) => updateLogoSize('mobileHeaderWidth', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-4 relative">
                    <input
                      type="number"
                      min={40}
                      max={250}
                      value={logoSizes.mobileHeaderWidth}
                      onChange={(e) => updateLogoSize('mobileHeaderWidth', parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1 pr-6 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-2 top-1 text-xs font-semibold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>
                {/* Mini Preview Box */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Mobile Header Preview:</span>
                  <div className="h-9 px-3 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-lg flex items-center justify-center overflow-hidden flex-1 max-w-[180px]">
                    {branding.primaryLogo ? (
                      <img
                        src={branding.primaryLogo}
                        alt="Mobile Header Logo Preview"
                        style={{
                          width: `${logoSizes.mobileHeaderWidth}px`,
                          maxWidth: '100%',
                          height: 'auto',
                          maxHeight: '26px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <span className="text-white font-black text-xs italic truncate">{branding.brandName || 'ELECTRO'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Admin Panel Sidebar Width */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PanelLeft size={14} className="text-blue-600" /> Admin Sidebar Logo Width
                  </span>
                  <button
                    type="button"
                    onClick={() => resetLogoSize('adminPanelWidth')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset (140px)
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-8">
                    <input
                      type="range"
                      min={40}
                      max={220}
                      step={1}
                      value={logoSizes.adminPanelWidth}
                      onChange={(e) => updateLogoSize('adminPanelWidth', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-4 relative">
                    <input
                      type="number"
                      min={40}
                      max={220}
                      value={logoSizes.adminPanelWidth}
                      onChange={(e) => updateLogoSize('adminPanelWidth', parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1 pr-6 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-2 top-1 text-xs font-semibold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>
                {/* Mini Preview Box */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Admin Sidebar Preview:</span>
                  <div className="h-9 px-3 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden flex-1 max-w-[180px]">
                    {branding.primaryLogo ? (
                      <img
                        src={branding.primaryLogo}
                        alt="Admin Sidebar Logo Preview"
                        style={{
                          width: `${logoSizes.adminPanelWidth}px`,
                          maxWidth: '100%',
                          height: 'auto',
                          maxHeight: '26px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <span className="text-white font-extrabold text-xs tracking-tight truncate">{branding.brandName || 'ELECTRO STORE'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Footer Logo Width */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layout size={14} className="text-blue-600" /> Footer Brand Logo Width
                  </span>
                  <button
                    type="button"
                    onClick={() => resetLogoSize('footerWidth')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} /> Reset (160px)
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-8">
                    <input
                      type="range"
                      min={50}
                      max={300}
                      step={1}
                      value={logoSizes.footerWidth}
                      onChange={(e) => updateLogoSize('footerWidth', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="col-span-4 relative">
                    <input
                      type="number"
                      min={50}
                      max={300}
                      value={logoSizes.footerWidth}
                      onChange={(e) => updateLogoSize('footerWidth', parseInt(e.target.value, 10))}
                      className="w-full px-2 py-1 pr-6 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right focus:outline-none focus:border-blue-500"
                    />
                    <span className="absolute right-2 top-1 text-xs font-semibold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>
                {/* Mini Preview Box */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Footer Logo Preview:</span>
                  <div className="h-9 px-3 bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden flex-1 max-w-[200px] border border-slate-800">
                    {branding.primaryLogo ? (
                      <img
                        src={branding.primaryLogo}
                        alt="Footer Logo Preview"
                        style={{
                          width: `${logoSizes.footerWidth}px`,
                          maxWidth: '100%',
                          height: 'auto',
                          maxHeight: '28px',
                          objectFit: 'contain'
                        }}
                      />
                    ) : (
                      <span className="text-white font-black text-xs tracking-tight truncate">{branding.brandName || 'ELECTRO STORE'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Theme / Colors */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Paintbrush size={16} className="text-blue-600" /> Theme Colors
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Color (Buttons & Badges)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor || '#2563eb'}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor || '#2563eb'}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                    placeholder="#2563eb"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Accent Color (Sale & Discounts)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.accentColor || '#ef4444'}
                    onChange={(e) => updateTheme({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.accentColor || '#ef4444'}
                    onChange={(e) => updateTheme({ accentColor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                    placeholder="#ef4444"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Canvas Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.backgroundColor || '#ffffff'}
                    onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor || '#ffffff'}
                    onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Secondary / Header Bar Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secondary / Header Bar Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondaryColor || '#0f172a'}
                    onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor || '#0f172a'}
                    onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                    placeholder="#0f172a"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Font / Typography */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Type size={16} className="text-blue-600" /> Font / Typography
              </h3>
              <select
                value={theme.typographyScale || 'standard'}
                onChange={(e) => updateTheme({ typographyScale: e.target.value as any })}
                className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 font-medium text-slate-700"
              >
                <option value="compact">Compact Scale</option>
                <option value="standard">Standard Scale</option>
                <option value="comfortable">Spacious Scale</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((font) => {
                const isSelected = currentFont === font.id;
                return (
                  <label
                    key={font.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="fontFamily"
                        value={font.id}
                        checked={isSelected}
                        onChange={() => updateTheme({ fontFamily: font.id })}
                        className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block" style={{ fontFamily: font.id }}>
                          {font.label}
                        </span>
                        <span className="text-[10px] text-slate-400">{font.category}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. Header Style (Clean / Modern / Compact) */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layout size={16} className="text-blue-600" /> Header Style
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => updateTheme({ headerStyle: 'clean' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  headerStyle === 'clean'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">Clean Minimal</span>
                <span className="text-[10px] text-slate-500 mt-1 block">White background, slim border, unobtrusive navigation</span>
              </button>

              <button
                type="button"
                onClick={() => updateTheme({ headerStyle: 'modern' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  headerStyle === 'modern'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">Modern Bold</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Floating search bar, prominent category links, active indicators</span>
              </button>

              <button
                type="button"
                onClick={() => updateTheme({ headerStyle: 'compact' })}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  headerStyle === 'compact'
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <span className="text-xs font-bold text-slate-900 block">Compact Dense</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Slim high-density bar for fast electronics browsing</span>
              </button>
            </div>
          </div>

          {/* 5. Product Card Style */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Box size={16} className="text-blue-600" /> Product Card Style
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'classic', label: 'Classic', desc: 'Standard border & button' },
                { id: 'modern', label: 'Modern', desc: 'Soft shadow & hover zoom' },
                { id: 'compact', label: 'Compact', desc: 'Dense catalog grid' },
                { id: 'bordered', label: 'Bordered', desc: 'Crisp minimalist border' }
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => updateTheme({ productCardStyle: style.id as any })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    productCardStyle === style.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">{style.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Border Radii & Buttons */}
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders size={16} className="text-blue-600" /> Border Radius & Shapes
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Border Radius</label>
                <select
                  value={theme.borderRadius || 'md'}
                  onChange={(e) => updateTheme({ borderRadius: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="none">Sharp / Square (0px)</option>
                  <option value="sm">Subtle (4px)</option>
                  <option value="md">Rounded Standard (12px)</option>
                  <option value="xl">Extra Large (20px)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Button Radius Shape</label>
                <select
                  value={theme.buttonRadius || 'md'}
                  onChange={(e) => updateTheme({ buttonRadius: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                >
                  <option value="sm">Crisp Sharp (4px)</option>
                  <option value="md">Rounded Standard (10px)</option>
                  <option value="full">Full Capsule Pill (9999px)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Live Visual Preview Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 sticky top-4 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sparkles size={15} className="text-amber-400" /> Live Interactive Preview
              </span>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                Font: {currentFont}
              </span>
            </div>

            {/* Mock Announcement Bar */}
            <div
              className="py-1.5 px-3 rounded-lg text-center text-xs font-bold text-white transition-colors"
              style={{ backgroundColor: theme.secondaryColor || '#0f172a' }}
            >
              🎉 Free Express Delivery on orders over ₹500! Code: WELCOME10
            </div>

            {/* Mock Header Navigation */}
            <div
              className={`p-3 shadow-xs border flex items-center justify-between transition-colors ${
                headerStyle === 'compact' ? 'py-2' : 'py-3.5'
              }`}
              style={{
                backgroundColor: theme.colorScheme === 'dark' ? '#131b2e' : (theme.backgroundColor || '#ffffff'),
                borderColor: theme.colorScheme === 'dark' ? '#1e293b' : '#e2e8f0',
                borderRadius: previewBorderRadius,
              }}
            >
              <div className="flex items-center gap-2">
                {branding.primaryLogo ? (
                  <img 
                    src={branding.primaryLogo} 
                    alt={branding.brandName || 'Logo'} 
                    className="object-contain shrink-0" 
                    style={{
                      width: `${logoSizes.desktopHeaderWidth}px`,
                      maxWidth: '120px',
                      height: 'auto',
                      maxHeight: '28px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : null}
                <div
                  className={`w-7 h-7 flex items-center justify-center font-black text-xs text-white transition-all ${branding.primaryLogo ? 'hidden' : ''}`}
                  style={{
                    backgroundColor: theme.primaryColor || '#2563eb',
                    borderRadius: previewButtonRadius,
                  }}
                >
                  {(branding.brandName || 'Store').trim().charAt(0).toUpperCase()}
                </div>
                <span
                  className="text-xs font-black tracking-tight"
                  style={{ color: theme.colorScheme === 'dark' ? '#f8fafc' : (theme.textColor || '#0f172a') }}
                >
                  {branding.brandName || 'ELECTRO STORE'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span style={{ color: theme.primaryColor || '#2563eb' }} className="font-bold">Home</span>
                <span style={{ color: theme.colorScheme === 'dark' ? '#94a3b8' : '#64748b' }}>Laptops</span>
                <span style={{ color: theme.colorScheme === 'dark' ? '#94a3b8' : '#64748b' }}>Smartphones</span>
              </div>
            </div>

            {/* Mock Hero Promo Banner */}
            <div
              className="p-5 text-white shadow-md space-y-3 relative overflow-hidden transition-all"
              style={{
                backgroundColor: theme.secondaryColor || '#0f172a',
                borderRadius: previewBorderRadius,
                fontFamily: currentFont
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-black uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: theme.accentColor || '#ef4444' }}
                >
                  FLASH SALE • 15% OFF
                </span>
                <span className="text-[11px] text-slate-300">Limited Period Offer</span>
              </div>
              
              <h4 className="text-lg font-black text-white leading-snug">
                MacBook Air M3 & Flagship 5G Tech
              </h4>
              <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
                Official brand warranty with complimentary express delivery across India.
              </p>

              <button
                type="button"
                className="px-4 py-2 text-xs font-bold text-white shadow-md transition-transform active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: theme.primaryColor || '#2563eb',
                  borderRadius: previewButtonRadius,
                }}
              >
                Shop Festive Deals →
              </button>
            </div>

            {/* Mock Product Card */}
            <div
              className={`p-4 border flex items-center justify-between gap-4 transition-all ${
                productCardStyle === 'modern' ? 'shadow-md hover:shadow-lg' : 'shadow-2xs'
              }`}
              style={{
                backgroundColor: theme.colorScheme === 'dark' ? '#1e293b' : '#ffffff',
                borderColor: theme.colorScheme === 'dark' ? '#334155' : '#e2e8f0',
                borderRadius: previewBorderRadius,
                fontFamily: currentFont
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50"
                  style={{ borderRadius: previewBorderRadius }}
                >
                  <span className="text-xl">🎧</span>
                </div>

                <div className="min-w-0">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider text-white px-1.5 py-0.2 rounded"
                    style={{ backgroundColor: theme.accentColor || '#ef4444' }}
                  >
                    Best Seller
                  </span>
                  <h5
                    className="text-xs font-bold mt-1 line-clamp-1"
                    style={{ color: theme.colorScheme === 'dark' ? '#f8fafc' : (theme.textColor || '#0f172a') }}
                  >
                    Sony WH-1000XM5 Wireless Headphones
                  </h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs font-black"
                      style={{ color: theme.colorScheme === 'dark' ? '#f8fafc' : (theme.textColor || '#0f172a') }}
                    >
                      ₹29,990
                    </span>
                    <span className="text-[11px] text-slate-400 line-through">₹34,990</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="px-3 py-1.5 text-xs font-bold text-white shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: theme.primaryColor || '#2563eb',
                  borderRadius: previewButtonRadius,
                }}
              >
                Add To Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AppearanceCmsEditor;
