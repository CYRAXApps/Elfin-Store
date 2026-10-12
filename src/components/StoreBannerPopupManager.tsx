import React, { useState, useEffect } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Link } from 'react-router-dom';
import { X, Sparkles, ChevronRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/imageOptimizer';

export function StoreBannerPopupManager() {
  const { settings } = useSiteSettings();
  const [activePopup, setActivePopup] = useState<any | null>(null);
  const [dismissedStrips, setDismissedStrips] = useState<string[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('electro_dismissed_strips') || '[]');
    } catch {
      return [];
    }
  });

  const bannersAndPopups = settings.bannersAndPopups || [];

  useEffect(() => {
    // Determine which popup to show
    const now = new Date();
    const isMobile = window.innerWidth < 768;

    const eligiblePopup = bannersAndPopups.find((item) => {
      if (!item.active || item.type !== 'popup') return false;
      if (item.publishStatus === 'draft') return false;

      // Device targeting check
      if (item.deviceTargeting === 'desktop' && isMobile) return false;
      if (item.deviceTargeting === 'mobile' && !isMobile) return false;

      // Scheduling check
      if (item.schedule?.start) {
        const start = new Date(item.schedule.start);
        if (now < start) return false;
      }
      if (item.schedule?.end) {
        const end = new Date(item.schedule.end);
        if (now > end) return false;
      }

      // Frequency check
      if (item.frequency === 'once_per_session') {
        const seen = sessionStorage.getItem(`electro_seen_popup_${item.id}`);
        if (seen) return false;
      }

      return true;
    });

    if (eligiblePopup) {
      // Short delay for natural entrance
      const timer = setTimeout(() => {
        setActivePopup(eligiblePopup);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [bannersAndPopups]);

  const handleClosePopup = () => {
    if (activePopup) {
      if (activePopup.frequency === 'once_per_session') {
        sessionStorage.setItem(`electro_seen_popup_${activePopup.id}`, 'true');
      }
      setActivePopup(null);
    }
  };

  const handleDismissStrip = (id: string) => {
    const updated = [...dismissedStrips, id];
    setDismissedStrips(updated);
    try {
      sessionStorage.setItem('electro_dismissed_strips', JSON.stringify(updated));
    } catch {}
  };

  // Find active header strips
  const activeStrips = bannersAndPopups.filter((item) => {
    if (!item.active || item.type !== 'strip') return false;
    if (item.publishStatus === 'draft') return false;
    if (dismissedStrips.includes(item.id)) return false;

    const now = new Date();
    if (item.schedule?.start && now < new Date(item.schedule.start)) return false;
    if (item.schedule?.end && now > new Date(item.schedule.end)) return false;

    return true;
  });

  return (
    <>
      {/* Modal Popup */}
      {activePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            {activePopup.showCloseButton !== false && (
              <button
                type="button"
                onClick={handleClosePopup}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors shadow-md cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            )}

            {/* Popup Image */}
            {(() => {
              const optPopupImg = getOptimizedImageUrl(activePopup.image, { width: 600, quality: 85 });
              if (!optPopupImg) return null;
              return (
                <div className="h-48 sm:h-56 bg-slate-100 overflow-hidden relative">
                  <img
                    src={optPopupImg}
                    alt={activePopup.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                </div>
              );
            })()}

            {/* Popup Body */}
            <div className="p-6 sm:p-8 text-center space-y-3">
              {activePopup.subtitle && (
                <span className="inline-block text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {activePopup.subtitle}
                </span>
              )}

              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {activePopup.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                {activePopup.description}
              </p>

              {activePopup.url && (
                <div className="pt-3">
                  <Link
                    to={activePopup.url}
                    onClick={handleClosePopup}
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                  >
                    <span>{activePopup.buttonText || 'Claim Offer Now'}</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
