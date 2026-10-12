import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

export function SeoHeadManager() {
  const location = useLocation();
  const { settings } = useSiteSettings();

  useEffect(() => {
    const seo = settings.seo;
    if (!seo) return;

    const path = location.pathname.toLowerCase();

    // Determine Page Key
    let pageKey = 'home';
    if (path === '/' || path === '') pageKey = 'home';
    else if (path.startsWith('/shop')) pageKey = 'shop';
    else if (path.startsWith('/product')) pageKey = 'productDetails';
    else if (path.startsWith('/cart')) pageKey = 'cart';
    else if (path.startsWith('/checkout')) pageKey = 'checkout';
    else if (path.startsWith('/contact')) pageKey = 'contact';
    else if (path.startsWith('/about')) pageKey = 'about';
    else if (path.startsWith('/support') || path.startsWith('/help')) pageKey = 'support';
    else if (path.startsWith('/privacy')) pageKey = 'privacy';
    else if (path.startsWith('/terms')) pageKey = 'terms';
    else if (path.startsWith('/shipping')) pageKey = 'shipping';
    else if (path.startsWith('/return') || path.startsWith('/refund')) pageKey = 'returns';

    const pageSeo = seo.pageSeo?.[pageKey];

    // Compute title
    const storeName = settings.general?.storeName;
    const computedTitle = pageSeo?.seoTitle || seo.globalTitle || (storeName ? `${storeName} — Electronics & Smart Tech` : '');
    if (computedTitle) {
      document.title = computedTitle;
    }

    // Helper to set or create meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLinkTag = (rel: string, href: string) => {
      if (!href) return;
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 1. Meta Description
    const computedDesc = pageSeo?.metaDescription || seo.metaDescription || 'Shop genuine laptops, smartphones, headphones and electronics with official brand warranty, GST invoice, and express delivery.';
    setMetaTag('description', computedDesc);

    // 2. Keywords
    const computedKeywords = pageSeo?.keywords || seo.defaultKeywords || 'electro store, laptops, smartphones, electronics';
    setMetaTag('keywords', computedKeywords);

    // 3. Robots
    const computedRobots = pageSeo?.noIndex ? 'noindex, nofollow' : (seo.robotsConfig || 'index, follow');
    setMetaTag('robots', computedRobots);

    // 4. Canonical URL
    const baseUrl = seo.canonicalBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const computedCanonical = pageSeo?.canonicalUrl || (baseUrl ? `${baseUrl.replace(/\/$/, '')}${location.pathname}` : '');
    if (computedCanonical) {
      setLinkTag('canonical', computedCanonical);
    }

    // 5. Open Graph Tags
    const ogTitle = pageSeo?.ogTitle || seo.defaultOgTitle || computedTitle;
    const ogDesc = pageSeo?.ogDescription || seo.defaultOgDescription || computedDesc;
    const ogImage = pageSeo?.ogImage || seo.defaultOgImage || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80';

    setMetaTag('og:title', ogTitle, true);
    setMetaTag('og:description', ogDesc, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', 'website', true);

    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', ogTitle);
    setMetaTag('twitter:description', ogDesc);
    setMetaTag('twitter:image', ogImage);

    // 6. Favicon
    const faviconUrl = settings.branding?.favicon || settings.general?.faviconUrl || '/assets/favicon.svg';
    if (faviconUrl) {
      setLinkTag('icon', faviconUrl);
    }
  }, [location.pathname, settings.seo, settings.branding, settings.general]);

  return null;
}
