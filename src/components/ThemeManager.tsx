import { useEffect } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { applyThemeToDocument } from '../utils/themeUtils';

export function ThemeManager() {
  const { settings } = useSiteSettings();

  useEffect(() => {
    applyThemeToDocument(settings.theme);

    // If color scheme is 'system', listen to system preference changes
    if (settings.theme?.colorScheme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyThemeToDocument(settings.theme);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  return null;
}
