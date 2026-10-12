import { MessageCircle } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useLocation } from 'react-router-dom';

export function FloatingWhatsappButton() {
  const { settings } = useSiteSettings();
  const location = useLocation();

  // Don't show in admin view
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const social = settings.socialMedia;
  const contact = settings.contact;
  const general = settings.general;

  if (social?.showFloatingWhatsapp === false) {
    return null;
  }

  const whatsappNum = social?.whatsappUrl || contact?.whatsapp || general?.whatsappNumber || '';
  const cleanNumber = whatsappNum.replace(/[^0-9]/g, '');
  const storeName = general?.storeName || 'Store';

  if (!cleanNumber) return null;

  return (
    <a
      href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hello ${storeName} Support, I would like assistance with products/order tracking.`)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Support on WhatsApp"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2 group cursor-pointer"
    >
      <MessageCircle size={24} className="shrink-0 animate-pulse" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-1">
        Chat with Support
      </span>
    </a>
  );
}
