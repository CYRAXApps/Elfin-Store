/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScrollRestorationManager } from './components/ScrollRestorationManager';
import { ShopProvider } from './context/ShopContext';
import { AuthProvider } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { LocationProvider } from './context/LocationContext';
import { Layout } from './components/Layout';
import { RouteLoadingFallback, AdminLoadingFallback } from './components/RouteLoadingFallback';
import { APIProvider } from '@vis.gl/react-google-maps';

// Eagerly loaded core storefront pages for instant startup
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { CategoriesPage } from './pages/CategoriesPage';
import { Account } from './pages/Account';

// Helper for resilient lazy component loading with automatic reload on chunk failure
function safeLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | { [key: string]: T }>
) {
  return lazy(async () => {
    try {
      const module = await importFn();
      if ('default' in module && module.default) {
        return { default: module.default };
      }
      const keys = Object.keys(module);
      if (keys.length > 0) {
        return { default: (module as any)[keys[0]] };
      }
      throw new Error('No valid export found in module');
    } catch (error) {
      console.warn('Lazy import warning, retrying once:', error);
      const module = await importFn();
      return { default: (module as any).default || (module as any)[Object.keys(module)[0]] };
    }
  });
}

// Lazy-loaded secondary, checkout, and admin pages
const ProductDetails = safeLazy(() => import('./pages/ProductDetails'));
const Cart = safeLazy(() => import('./pages/Cart'));
const Checkout = safeLazy(() => import('./pages/Checkout'));
const Wishlist = safeLazy(() => import('./pages/Wishlist'));
const Login = safeLazy(() => import('./pages/Login'));
const Orders = safeLazy(() => import('./pages/Orders'));
const OrderDetails = safeLazy(() => import('./pages/OrderDetails'));
const LoyaltyRewards = safeLazy(() => import('./pages/LoyaltyRewards'));
const CustomerNotifications = safeLazy(() => import('./pages/account/CustomerNotifications'));
const SupportCenter = safeLazy(() => import('./pages/SupportCenter'));
const StorePage = safeLazy(() => import('./pages/StorePage'));
const AboutUs = safeLazy(() => import('./pages/AboutUs'));
const ContactUs = safeLazy(() => import('./pages/ContactUs'));
const LegalPage = safeLazy(() => import('./pages/LegalPage'));
const NotFound = safeLazy(() => import('./pages/NotFound'));
import { Admin } from './pages/Admin';

import { PartnerAuthProvider } from './context/PartnerAuthContext';
import { PartnerLogin } from './pages/partner/PartnerLogin';
import { PartnerLayout } from './pages/partner/PartnerLayout';
import { PartnerDashboard } from './pages/partner/PartnerDashboard';
import { PartnerProducts } from './pages/partner/PartnerProducts';
import { PartnerInventory } from './pages/partner/PartnerInventory';
import { PartnerOrders } from './pages/partner/PartnerOrders';
import { PartnerPOS } from './pages/partner/PartnerPOS';
import { PartnerCustomers } from './pages/partner/PartnerCustomers';
import { PartnerAnalytics } from './pages/partner/PartnerAnalytics';
import { PartnerStaff } from './pages/partner/PartnerStaff';
import { PartnerSettings } from './pages/partner/PartnerSettings';
import { PartnerSupport } from './pages/partner/PartnerSupport';

export default function App() {
  return (
    <AuthProvider>
      <PartnerAuthProvider>
        <SiteSettingsProvider>
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''} libraries={['places', 'geocoding', 'marker']}>
            <LocationProvider>
            <ShopProvider>
              <BrowserRouter>
                <ScrollRestorationManager />
              <Routes>
                <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="store/:storeId" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <StorePage />
                  </Suspense>
                } />
                <Route path="product/:id" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ProductDetails />
                  </Suspense>
                } />
                <Route path="cart" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Cart />
                  </Suspense>
                } />
                <Route path="checkout" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Checkout />
                  </Suspense>
                } />
                <Route path="wishlist" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Wishlist />
                  </Suspense>
                } />
                <Route path="login" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Login />
                  </Suspense>
                } />
                <Route path="account" element={<Account />} />
                <Route path="orders" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Orders />
                  </Suspense>
                } />
                <Route path="orders/:orderId" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <OrderDetails />
                  </Suspense>
                } />
                <Route path="order/:orderId" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <OrderDetails />
                  </Suspense>
                } />
                <Route path="rewards" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <LoyaltyRewards />
                  </Suspense>
                } />
                <Route path="loyalty" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <LoyaltyRewards />
                  </Suspense>
                } />
                <Route path="notifications" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <CustomerNotifications />
                  </Suspense>
                } />
                <Route path="support" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <SupportCenter />
                  </Suspense>
                } />
                <Route path="help" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <SupportCenter />
                  </Suspense>
                } />
                <Route path="about" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <AboutUs />
                  </Suspense>
                } />
                <Route path="contact" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <ContactUs />
                  </Suspense>
                } />
                <Route path="privacy" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <LegalPage />
                  </Suspense>
                } />
                <Route path="terms" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <LegalPage />
                  </Suspense>
                } />
                <Route path="shipping-policy" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <LegalPage />
                  </Suspense>
                } />
                <Route path="returns-refunds" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <LegalPage />
                  </Suspense>
                } />
                <Route path="*" element={
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <NotFound />
                  </Suspense>
                } />
              </Route>
              {/* Admin route outside of main layout */}
              <Route path="/admin" element={
                <Suspense fallback={<AdminLoadingFallback />}>
                  <Admin />
                </Suspense>
              } />
              <Route path="/admin/*" element={
                <Suspense fallback={<AdminLoadingFallback />}>
                  <Admin />
                </Suspense>
              } />

              {/* Dedicated Partner Login */}
              <Route path="/partner/login" element={<PartnerLogin />} />

              {/* Protected Partner Portal Routes */}
              <Route path="/partner" element={<PartnerLayout />}>
                <Route index element={<PartnerDashboard />} />
                <Route path="dashboard" element={<PartnerDashboard />} />
                <Route path="products" element={<PartnerProducts />} />
                <Route path="products/*" element={<PartnerProducts />} />
                <Route path="inventory" element={<PartnerInventory />} />
                <Route path="orders" element={<PartnerOrders />} />
                <Route path="orders/*" element={<PartnerOrders />} />
                <Route path="pos" element={<PartnerPOS />} />
                <Route path="pos/*" element={<PartnerPOS />} />
                <Route path="customers" element={<PartnerCustomers />} />
                <Route path="customers/*" element={<PartnerCustomers />} />
                <Route path="reports" element={<PartnerAnalytics />} />
                <Route path="reports/*" element={<PartnerAnalytics />} />
                <Route path="earnings" element={<PartnerAnalytics />} />
                <Route path="staff" element={<PartnerStaff />} />
                <Route path="support" element={<PartnerSupport />} />
                <Route path="support/*" element={<PartnerSupport />} />
                <Route path="settings" element={<PartnerSettings />} />
                <Route path="settings/*" element={<PartnerSettings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ShopProvider>
        </LocationProvider>
          </APIProvider>
      </SiteSettingsProvider>
      </PartnerAuthProvider>
    </AuthProvider>
  );
}
// force update app.tsx
