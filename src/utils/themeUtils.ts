import { SiteSettings } from '../context/SiteSettingsContext';

// Color utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== 'string') return null;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(37, 99, 235, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function darkenHex(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex || '#1d4ed8';
  const factor = 1 - percent / 100;
  const r = Math.max(0, Math.min(255, Math.round(rgb.r * factor)));
  const g = Math.max(0, Math.min(255, Math.round(rgb.g * factor)));
  const b = Math.max(0, Math.min(255, Math.round(rgb.b * factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function lightenHex(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex || '#60a5fa';
  const factor = percent / 100;
  const r = Math.max(0, Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function getContrastTextColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

export function getBorderRadiusValue(radius?: string): string {
  switch (radius) {
    case 'none': return '0px';
    case 'sm': return '4px';
    case 'md': return '16px';
    case 'lg': return '16px';
    case 'xl': return '16px';
    case 'full': return '9999px';
    default: return '16px';
  }
}

export function getButtonRadiusValue(radius?: string): string {
  switch (radius) {
    case 'sm': return '4px';
    case 'md': return '12px';
    case 'lg': return '16px';
    case 'full': return '9999px';
    default: return '12px';
  }
}

export function getTypographyScaleMultiplier(scale?: string): number {
  switch (scale) {
    case 'compact': return 0.92;
    case 'generous':
    case 'comfortable': return 1.08;
    case 'standard':
    default: return 1.0;
  }
}

const SUPPORTED_FONTS: Record<string, string> = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'Plus Jakarta Sans': 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
  'Outfit': 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
  'Montserrat': 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap',
  'Manrope': 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap',
};

export function loadGoogleFont(fontFamily: string = 'Inter') {
  if (typeof document === 'undefined') return;
  const linkId = 'theme-google-font-stylesheet';
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  const url = SUPPORTED_FONTS[fontFamily] || SUPPORTED_FONTS['Inter'];

  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== url) {
    link.href = url;
  }
}

export function applyThemeToDocument(themeConfig?: SiteSettings['theme']) {
  if (typeof document === 'undefined') return;

  const theme = themeConfig || {
    primaryColor: '#2563eb',
    secondaryColor: '#0f172a',
    accentColor: '#ef4444',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
    cardStyle: 'shadow-sm border',
    borderRadius: 'md',
    buttonRadius: 'md',
    typographyScale: 'standard',
    headerStyle: 'light',
    productCardStyle: 'standard',
    fontFamily: 'Inter',
    colorScheme: 'light',
  };

  const primary = theme.primaryColor || '#2563eb';
  const primaryHover = darkenHex(primary, 12);
  const primaryLight = lightenHex(primary, 18);
  const primary50 = hexToRgba(primary, 0.08);
  const primary100 = hexToRgba(primary, 0.16);
  const primaryShadow = hexToRgba(primary, 0.28);
  const primaryContrast = getContrastTextColor(primary);

  const secondary = theme.secondaryColor || '#0f172a';
  const secondaryHover = darkenHex(secondary, 10);
  const secondaryContrast = getContrastTextColor(secondary);

  const accent = theme.accentColor || '#ef4444';
  const accentHover = darkenHex(accent, 10);
  const accent50 = hexToRgba(accent, 0.1);
  const accentContrast = getContrastTextColor(accent);

  const bg = theme.backgroundColor || '#ffffff';
  const text = theme.textColor || '#0f172a';
  const fontFamily = theme.fontFamily || 'Inter';
  const borderRadius = getBorderRadiusValue(theme.borderRadius);
  const buttonRadius = getButtonRadiusValue(theme.buttonRadius);
  const scaleMultiplier = getTypographyScaleMultiplier(theme.typographyScale);

  // 1. Load Font
  loadGoogleFont(fontFamily);

  // 2. Set CSS custom properties on document root
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-primary-hover', primaryHover);
  root.style.setProperty('--theme-primary-light', primaryLight);
  root.style.setProperty('--theme-primary-50', primary50);
  root.style.setProperty('--theme-primary-100', primary100);
  root.style.setProperty('--theme-primary-shadow', primaryShadow);
  root.style.setProperty('--theme-primary-contrast', primaryContrast);

  root.style.setProperty('--theme-secondary', secondary);
  root.style.setProperty('--theme-secondary-hover', secondaryHover);
  root.style.setProperty('--theme-secondary-contrast', secondaryContrast);

  root.style.setProperty('--theme-accent', accent);
  root.style.setProperty('--theme-accent-hover', accentHover);
  root.style.setProperty('--theme-accent-50', accent50);
  root.style.setProperty('--theme-accent-contrast', accentContrast);

  root.style.setProperty('--theme-bg', bg);
  root.style.setProperty('--theme-text', text);
  root.style.setProperty('--theme-font', `"${fontFamily}", sans-serif`);
  root.style.setProperty('--theme-radius', borderRadius);
  root.style.setProperty('--theme-btn-radius', buttonRadius);
  root.style.setProperty('--theme-scale', scaleMultiplier.toString());

  // 3. Handle Color Scheme (Light / Dark / System)
  const isDark =
    theme.colorScheme === 'dark' ||
    (theme.colorScheme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }

  // 4. Inject or Update Dynamic Stylesheet
  const styleId = 'storefront-dynamic-theme-rules';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    /* Storefront Dynamic Font & Scale */
    body, #root, .storefront-root, input, select, textarea, button {
      font-family: var(--theme-font, 'Inter', sans-serif);
    }

    /* Storefront Base Background & Text */
    .storefront-root {
      background-color: var(--theme-bg, #f8fafc);
      color: var(--theme-text, #0f172a);
      font-size: calc(1rem * var(--theme-scale, 1));
    }

    /* Primary Color Overrides */
    .storefront-root .bg-blue-600,
    .storefront-root .bg-\\[\\#0066ff\\],
    .storefront-root .bg-primary-theme,
    .storefront-theme-active .bg-blue-600,
    .storefront-theme-active .bg-\\[\\#0066ff\\] {
      background-color: var(--theme-primary) !important;
      color: var(--theme-primary-contrast, #ffffff);
    }

    .storefront-root .hover\\:bg-blue-700:hover,
    .storefront-root .hover\\:bg-blue-600:hover,
    .storefront-root .hover\\:bg-blue-500:hover,
    .storefront-theme-active .hover\\:bg-blue-700:hover,
    .storefront-theme-active .hover\\:bg-blue-600:hover {
      background-color: var(--theme-primary-hover) !important;
    }

    .storefront-root .text-blue-600,
    .storefront-root .text-blue-500,
    .storefront-root .text-primary-theme,
    .storefront-theme-active .text-blue-600 {
      color: var(--theme-primary) !important;
    }

    .storefront-root .hover\\:text-blue-600:hover,
    .storefront-root .hover\\:text-blue-700:hover {
      color: var(--theme-primary-hover) !important;
    }

    .storefront-root .border-blue-600,
    .storefront-root .border-blue-500,
    .storefront-root .border-primary-theme {
      border-color: var(--theme-primary) !important;
    }

    .storefront-root .bg-blue-50 {
      background-color: var(--theme-primary-50) !important;
    }

    .storefront-root .bg-blue-100 {
      background-color: var(--theme-primary-100) !important;
    }

    .storefront-root .text-blue-700 {
      color: var(--theme-primary-hover) !important;
    }

    .storefront-root .focus\\:ring-blue-500:focus,
    .storefront-root .focus\\:ring-blue-600:focus {
      --tw-ring-color: var(--theme-primary) !important;
    }

    .storefront-root .focus\\:border-blue-500:focus,
    .storefront-root .focus\\:border-blue-600:focus {
      border-color: var(--theme-primary) !important;
    }

    /* Button Border Radius */
    .storefront-root button:not([class*="rounded-full"]):not([class*="rounded-none"]):not(.keep-radius),
    .storefront-root a[class*="rounded-"]:not([class*="rounded-full"]):not([class*="rounded-none"]):not(.keep-radius) {
      border-radius: var(--theme-btn-radius, 12px) !important;
    }

    /* Add to Cart Button Radius: strictly 12px */
    .storefront-root .add-to-cart-btn,
    .storefront-root [data-action="add-to-cart"],
    .add-to-cart-btn {
      border-radius: 12px !important;
    }

    /* Card & Container Border Radius */
    .storefront-root .theme-card,
    .storefront-root [class*="rounded-2xl"]:not([class*="rounded-full"]):not(.keep-radius),
    .storefront-root [class*="rounded-xl"]:not([class*="rounded-full"]):not([class*="w-"]):not(.keep-radius) {
      border-radius: var(--theme-radius, 16px) !important;
    }

    /* Secondary Color Elements */
    .theme-secondary-bg,
    [data-theme-element="secondary-bg"] {
      background-color: var(--theme-secondary) !important;
      color: var(--theme-secondary-contrast, #ffffff) !important;
    }

    .theme-secondary-text,
    [data-theme-element="secondary-text"] {
      color: var(--theme-secondary) !important;
    }

    /* Accent Color Elements */
    .theme-accent-bg,
    [data-theme-element="accent-bg"] {
      background-color: var(--theme-accent) !important;
      color: var(--theme-accent-contrast, #ffffff) !important;
    }

    .theme-accent-text,
    [data-theme-element="accent-text"] {
      color: var(--theme-accent) !important;
    }

    /* Dark Mode Storefront Overrides */
    html.dark .storefront-root {
      background-color: #0b0f19 !important;
      color: #f1f5f9 !important;
    }

    html.dark .storefront-root .bg-white:not(.admin-panel *) {
      background-color: #131b2e !important;
      color: #f8fafc !important;
    }

    html.dark .storefront-root .bg-slate-50:not(.admin-panel *) {
      background-color: #0b0f19 !important;
    }

    html.dark .storefront-root .bg-slate-100:not(.admin-panel *) {
      background-color: #1e293b !important;
    }

    html.dark .storefront-root .text-slate-900:not(.admin-panel *) {
      color: #f8fafc !important;
    }

    html.dark .storefront-root .text-slate-800:not(.admin-panel *) {
      color: #e2e8f0 !important;
    }

    html.dark .storefront-root .text-slate-700:not(.admin-panel *) {
      color: #cbd5e1 !important;
    }

    html.dark .storefront-root .text-slate-600:not(.admin-panel *) {
      color: #94a3b8 !important;
    }

    html.dark .storefront-root .border-slate-200:not(.admin-panel *),
    html.dark .storefront-root .border-slate-100:not(.admin-panel *) {
      border-color: #1e293b !important;
    }

    html.dark .storefront-root .border-slate-300:not(.admin-panel *) {
      border-color: #334155 !important;
    }
  `;
}
