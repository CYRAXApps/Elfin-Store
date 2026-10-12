import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { SeoHeadManager } from './SeoHeadManager';
import { FloatingWhatsappButton } from './FloatingWhatsappButton';
import { StoreBannerPopupManager } from './StoreBannerPopupManager';
import { MaintenanceGate } from './MaintenanceGate';
import { MobileBottomNav } from './MobileBottomNav';
import { ThemeManager } from './ThemeManager';
import { HyperlocalLocationModal } from './HyperlocalLocationModal';
import { HyperlocalFloatingCart } from './HyperlocalFloatingCart';

export function Layout() {
  return (
    <MaintenanceGate>
      <ThemeManager />
      <div className="storefront-root font-sans bg-slate-50 transition-colors duration-200 min-h-screen flex flex-col justify-between">
        <SeoHeadManager />
        <StoreBannerPopupManager />
        <HyperlocalLocationModal />
        <Header />
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
        <HyperlocalFloatingCart />
        <FloatingWhatsappButton />
        <MobileBottomNav />
      </div>
    </MaintenanceGate>
  );
}


