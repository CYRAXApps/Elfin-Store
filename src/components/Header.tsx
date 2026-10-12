import React, { useState, useEffect } from 'react';
import { MobileHeader } from './MobileHeader';
import { DesktopHeader } from './DesktopHeader';

/**
 * Custom hook to dynamically detect desktop viewport (>= 1024px).
 * Uses window.matchMedia and resize listeners for instant detection.
 */
function useIsDesktop(breakpoint = 1024) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia ? window.matchMedia(`(min-width: ${breakpoint}px)`).matches : window.innerWidth >= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(min-width: ${breakpoint}px)`);

    const updateMatches = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateMatches();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMatches);
      return () => mediaQuery.removeEventListener('change', updateMatches);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(updateMatches);
      return () => mediaQuery.removeListener(updateMatches);
    }
  }, [breakpoint]);

  return isDesktop;
}

/**
 * Main Header component rendered in Layout.tsx:
 * - Desktop (>= 1024px): Renders DesktopHeader exclusively.
 * - Mobile / Tablet (< 1024px): Renders MobileHeader exclusively.
 * - Guaranteed that only ONE header component is rendered in the DOM at any time.
 */
export function Header() {
  const isDesktop = useIsDesktop(1024);

  return isDesktop ? <DesktopHeader /> : <MobileHeader />;
}

export default Header;
export { MobileHeader, DesktopHeader };
