import { useLayoutEffect, useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollRestorationManager
 * 
 * Centralized scroll manager at the router level that guarantees:
 * 1. Immediate reset to top (scrollY = 0) on any new route navigation (PUSH or REPLACE)
 *    such as Home -> Shop, Shop -> Product, Product -> Cart, Cart -> Checkout,
 *    Categories -> Shop, Mobile bottom nav, Header nav, etc.
 * 2. Natural, accurate scroll restoration when using browser Back/Forward (POP navigation).
 * 3. Safe handling of hash links (#section) by scrolling to the target element.
 * 4. Cross-browser & mobile viewport support (iOS Safari, Chrome, Firefox, Edge).
 * 5. Zero arbitrary timeouts, zero visible loading flickers, and zero page reloads.
 */

const STORAGE_PREFIX = 'electro_scroll_pos_';

export function ScrollRestorationManager() {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'

  // In-memory cache of scroll positions keyed by history entry
  const scrollPositions = useRef<Map<string, number>>(new Map());

  // Current history location key ref for active scroll tracking
  const currentKeyRef = useRef<string>('');

  // 1. Configure browser history scrollRestoration to 'manual'
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // 2. Continually track scroll position on the active page
  useEffect(() => {
    const key = location.key || `${location.pathname}${location.search}`;
    currentKeyRef.current = key;

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(() => {
          const currentY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          const activeKey = currentKeyRef.current;
          if (activeKey) {
            scrollPositions.current.set(activeKey, currentY);
            try {
              sessionStorage.setItem(`${STORAGE_PREFIX}${activeKey}`, String(currentY));
            } catch {
              // Ignore session storage quota or privacy mode errors
            }
          }
          rafId = null;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);

      // Save scroll position immediately before location transition
      const exitY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (key) {
        scrollPositions.current.set(key, exitY);
        try {
          sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, String(exitY));
        } catch {
          // Ignore
        }
      }
    };
  }, [location.key, location.pathname, location.search]);

  // 3. Handle scroll adjustment on location change (Immediate before paint)
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useIsomorphicLayoutEffect(() => {
    // If navigating to an anchor hash (e.g. #reviews)
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView();
        return;
      }
    }

    const currentKey = location.key || `${location.pathname}${location.search}`;

    // Handle Browser Back / Forward navigation (POP)
    if (navigationType === 'POP') {
      let savedY: number | null = null;

      if (scrollPositions.current.has(currentKey)) {
        savedY = scrollPositions.current.get(currentKey) ?? null;
      } else {
        try {
          const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${currentKey}`);
          if (stored !== null) {
            savedY = Number(stored);
          }
        } catch {
          savedY = null;
        }
      }

      // If no recorded position found for this key, fallback to pathname+search
      if (savedY === null || isNaN(savedY)) {
        const fallbackKey = `${location.pathname}${location.search}`;
        if (scrollPositions.current.has(fallbackKey)) {
          savedY = scrollPositions.current.get(fallbackKey) ?? null;
        } else {
          try {
            const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${fallbackKey}`);
            if (stored !== null) {
              savedY = Number(stored);
            }
          } catch {
            savedY = null;
          }
        }
      }

      // If saved position is available, restore it; otherwise start at top (0, 0)
      const targetY = savedY !== null && !isNaN(savedY) ? Math.max(0, savedY) : 0;

      window.scrollTo({
        top: targetY,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });
      if (document.documentElement) document.documentElement.scrollTop = targetY;
      if (document.body) document.body.scrollTop = targetY;

      // Re-verify on next animation frame after layout rendering settles
      const raf = window.requestAnimationFrame(() => {
        window.scrollTo({
          top: targetY,
          left: 0,
          behavior: 'instant' as ScrollBehavior,
        });
        if (document.documentElement) document.documentElement.scrollTop = targetY;
        if (document.body) document.body.scrollTop = targetY;
      });

      return () => {
        window.cancelAnimationFrame(raf);
      };
    }

    // Normal navigation to a NEW route or updated query (PUSH or REPLACE)
    // Instantly reset scroll to top (0, 0)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // Follow up in requestAnimationFrame to override any mobile browser inertia
    const raf = window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);

  return null;
}
