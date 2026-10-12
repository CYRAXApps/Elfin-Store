import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Package, Users, ShoppingCart, Tag, LayoutDashboard, Settings, Search, 
  BarChart3, Boxes, Menu, X, ArrowRight, Loader2, Globe, ChevronDown, 
  ChevronRight, Sliders, ChevronRight as BreadcrumbChevron,
  ExternalLink, Home, MessageSquare, Store, CreditCard, ShieldAlert, Lock, ShieldX, UserCheck, Bell, FileText, LogIn, Building2
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth, isAdminEmail, isOwnerUser, isAdminOrOwner, isOwnerPhone, PRIMARY_OWNER_UID } from '../context/AuthContext';
import { isUserAdminOrOwner, canAccessAdminTab, getTabDisplayName } from '../utils/staffPermissions';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { AdminProducts } from './admin/AdminProducts';
import { AdminOrders } from './admin/AdminOrders';
import { AdminPOS } from './admin/AdminPOS';
import { AdminInvoices } from './admin/AdminInvoices';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminAnalytics } from './admin/AdminAnalytics';
import { AdminCategories } from './admin/AdminCategories';
import { AdminBrands } from './admin/AdminBrands';
import { AdminCustomers } from './admin/AdminCustomers';
import { AdminInventory } from './admin/AdminInventory';
import { AdminLoyalty } from './admin/AdminLoyalty';
import { AdminWebsiteControl } from './admin/AdminWebsiteControl';
import { AdminMarketing } from './admin/AdminMarketing';
import { AdminStoreSettings } from './admin/AdminStoreSettings';
import { AdminAdvancedSettings } from './admin/AdminAdvancedSettings';
import { AdminPayments } from './admin/AdminPayments';
import { AdminNotifications } from './admin/AdminNotifications';
import { AdminNotificationDropdown } from '../components/admin/AdminNotificationDropdown';
import { AdminInquiries } from './admin/AdminInquiries';
import { AdminIBPStores } from './admin/AdminIBPStores';
import { AdminPosSettings } from './admin/pos/AdminPosSettings';
import { AdminReviews } from './admin/AdminReviews';
import { AdminStaff } from './admin/AdminStaff';
import { ShippingDashboard } from './admin/shipping/ShippingDashboard';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface NavSubItem {
  id: string;
  label: string;
  path: string;
  tab: string;
  params?: any;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  tab: string;
  params?: any;
  subItems?: NavSubItem[];
}

export const navItems: NavItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/admin',
    tab: 'dashboard' 
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    path: '/admin/products',
    tab: 'products',
    subItems: [
      { id: 'products_list', label: 'Products', path: '/admin/products', tab: 'products' },
      { id: 'categories', label: 'Categories', path: '/admin/products/categories', tab: 'categories' },
      { id: 'brands', label: 'Brands', path: '/admin/products/brands', tab: 'brands' },
      { id: 'inventory', label: 'Inventory', path: '/admin/products/inventory', tab: 'inventory' },
      { id: 'reviews', label: 'Reviews', path: '/admin/products/reviews', tab: 'reviews' },
    ]
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    path: '/admin/orders',
    tab: 'orders',
    subItems: [
      { id: 'all_orders', label: 'All Orders', path: '/admin/orders', tab: 'orders', params: { initialStatusFilter: 'all' } },
      { id: 'orders_returns', label: 'Returns & Replacements', path: '/admin/orders/returns', tab: 'orders', params: { initialStatusFilter: 'returns' } },
      { id: 'orders_shipping', label: 'Shipping', path: '/admin/orders/shipping', tab: 'shipping' },
      { id: 'orders_invoices', label: 'Invoices', path: '/admin/orders/invoices', tab: 'invoices' },
      { id: 'orders_payments', label: 'Payments', path: '/admin/orders/payments', tab: 'payments' },
    ]
  },
  {
    id: 'pos',
    label: 'POS',
    icon: Store,
    path: '/admin/pos',
    tab: 'pos',
    subItems: [
      { id: 'pos_counter', label: 'Counter Billing', path: '/admin/pos', tab: 'pos', params: { initialSubTab: 'counter' } },
      { id: 'pos_sales', label: 'Sales History', path: '/admin/pos/sales', tab: 'pos', params: { initialSubTab: 'history' } },
      { id: 'pos_settings', label: 'POS Settings', path: '/admin/pos/settings', tab: 'pos-settings' },
    ]
  },
  {
    id: 'ibp',
    label: 'IBP / Partner Stores',
    icon: Building2,
    path: '/admin/ibp',
    tab: 'ibp',
    subItems: [
      { id: 'ibp_stores', label: 'All Stores', path: '/admin/ibp', tab: 'ibp' },
    ]
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    path: '/admin/customers',
    tab: 'customers',
    subItems: [
      { id: 'all_customers', label: 'Customers', path: '/admin/customers', tab: 'customers', params: { initialSubTab: 'all' } },
      { id: 'support_inquiries', label: 'Support & Inquiries', path: '/admin/customers/support', tab: 'inquiries' },
      { id: 'loyalty_rewards', label: 'Loyalty / Store Credit', path: '/admin/customers/loyalty', tab: 'loyalty' },
    ]
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Tag,
    path: '/admin/marketing/promotions',
    tab: 'marketing',
    subItems: [
      { id: 'marketing_promotions', label: 'Promotions', path: '/admin/marketing/promotions', tab: 'marketing', params: { initialSubTab: 'promotions' } },
      { id: 'marketing_coupons', label: 'Coupons', path: '/admin/marketing/coupons', tab: 'marketing', params: { initialSubTab: 'coupons' } },
      { id: 'marketing_content', label: 'Content', path: '/admin/marketing/content', tab: 'marketing', params: { initialSubTab: 'content' } },
      { id: 'marketing_subscribers', label: 'Subscribers', path: '/admin/marketing/subscribers', tab: 'marketing', params: { initialSubTab: 'subscribers' } },
    ]
  },
  {
    id: 'website_settings',
    label: 'Website Control Center',
    icon: Globe,
    path: '/admin/website/homepage',
    tab: 'website',
    subItems: [
      { id: 'website_homepage', label: 'Homepage', path: '/admin/website/homepage', tab: 'website', params: { initialSubTab: 'homepage' } },
      { id: 'website_navigation', label: 'Header & Navigation', path: '/admin/website/navigation', tab: 'website', params: { initialSubTab: 'navigation' } },
      { id: 'website_footer', label: 'Footer', path: '/admin/website/footer', tab: 'website', params: { initialSubTab: 'footer' } },
      { id: 'website_content', label: 'Website Content', path: '/admin/website/content', tab: 'website', params: { initialSubTab: 'content' } },
      { id: 'website_appearance', label: 'Website Appearance', path: '/admin/website/appearance', tab: 'website', params: { initialSubTab: 'appearance' } },
      { id: 'website_seo', label: 'SEO & Social', path: '/admin/website/seo', tab: 'website', params: { initialSubTab: 'seo' } },
    ]
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    path: '/admin/reports/sales',
    tab: 'analytics',
    subItems: [
      { id: 'reports_sales', label: 'Sales', path: '/admin/reports/sales', tab: 'analytics', params: { initialSubTab: 'sales' } },
      { id: 'reports_orders', label: 'Orders', path: '/admin/reports/orders', tab: 'analytics', params: { initialSubTab: 'overview' } },
      { id: 'reports_products', label: 'Products', path: '/admin/reports/products', tab: 'analytics', params: { initialSubTab: 'products' } },
      { id: 'reports_inventory', label: 'Inventory', path: '/admin/reports/inventory', tab: 'analytics', params: { initialSubTab: 'inventory' } },
      { id: 'reports_customers', label: 'Customers', path: '/admin/reports/customers', tab: 'analytics', params: { initialSubTab: 'customers' } },
      { id: 'reports_tax', label: 'GST / Tax', path: '/admin/reports/tax', tab: 'analytics', params: { initialSubTab: 'tax' } },
    ]
  },
  {
    id: 'store_settings',
    label: 'Store Settings',
    icon: Settings,
    path: '/admin/settings/store',
    tab: 'store-settings',
    subItems: [
      { id: 'settings_general', label: 'Store Information', path: '/admin/settings/store', tab: 'store-settings', params: { initialSubTab: 'store' } },
      { id: 'settings_shipping', label: 'Shipping & Delivery Rules', path: '/admin/settings/shipping', tab: 'store-settings', params: { initialSubTab: 'shipping' } },
      { id: 'settings_payments', label: 'Payments', path: '/admin/settings/payments', tab: 'store-settings', params: { initialSubTab: 'payments' } },
      { id: 'settings_tax', label: 'GST & Tax', path: '/admin/settings/tax', tab: 'store-settings', params: { initialSubTab: 'tax' } },
      { id: 'settings_notifications', label: 'Notifications', path: '/admin/settings/notifications', tab: 'store-settings', params: { initialSubTab: 'notifications' } },
      { id: 'settings_status', label: 'Store Status', path: '/admin/settings/status', tab: 'store-settings', params: { initialSubTab: 'status' } },
    ]
  },
  {
    id: 'advanced_settings',
    label: 'Advanced',
    icon: Sliders,
    path: '/admin/advanced/staff',
    tab: 'advanced-settings',
    subItems: [
      { id: 'adv_codebase_defaults', label: 'Codebase Audit & Form', path: '/admin/advanced/codebase-defaults', tab: 'advanced-settings', params: { initialSubTab: 'codebase_defaults' } },
      { id: 'adv_admin_staff', label: 'Admin & Staff', path: '/admin/advanced/staff', tab: 'admin-staff', params: { initialSubTab: 'admin_staff' } },
      { id: 'adv_integrations', label: 'Integrations', path: '/admin/advanced/integrations', tab: 'advanced-settings', params: { initialSubTab: 'integrations' } },
      { id: 'adv_import_export', label: 'Import / Export', path: '/admin/advanced/import-export', tab: 'advanced-settings', params: { initialSubTab: 'import_export' } },
      { id: 'adv_audit_logs', label: 'Audit Logs', path: '/admin/advanced/audit-logs', tab: 'advanced-settings', params: { initialSubTab: 'audit_logs' } },
      { id: 'adv_database', label: 'System / Database', path: '/admin/advanced/database', tab: 'advanced-settings', params: { initialSubTab: 'database' } },
    ]
  }
];

export function resolveAdminRoute(
  pathname: string, 
  searchParams: URLSearchParams
): { parentId: string; subItemId: string; tab: string; params: any } {
  const cleanPath = pathname.replace(/\/+$/, '') || '/admin';

  // Products
  if (cleanPath === '/admin/products/categories' || cleanPath === '/admin/categories') {
    return { parentId: 'products', subItemId: 'categories', tab: 'categories', params: {} };
  }
  if (cleanPath === '/admin/products/brands' || cleanPath === '/admin/brands') {
    return { parentId: 'products', subItemId: 'brands', tab: 'brands', params: {} };
  }
  if (cleanPath === '/admin/products/inventory' || cleanPath === '/admin/inventory') {
    return { parentId: 'products', subItemId: 'inventory', tab: 'inventory', params: {} };
  }
  if (cleanPath === '/admin/products/reviews' || cleanPath === '/admin/reviews') {
    return { parentId: 'products', subItemId: 'reviews', tab: 'reviews', params: {} };
  }
  if (cleanPath === '/admin/products') {
    return { 
      parentId: 'products', 
      subItemId: 'products_list', 
      tab: 'products', 
      params: { openAddModal: searchParams.get('modal') === 'add' } 
    };
  }

  // Orders
  if (cleanPath === '/admin/orders/returns' || cleanPath === '/admin/returns' || cleanPath === '/admin/orders/replacements') {
    return { parentId: 'orders', subItemId: 'orders_returns', tab: 'orders', params: { initialStatusFilter: 'returns' } };
  }
  if (cleanPath === '/admin/orders/shipping' || cleanPath === '/admin/shipping') {
    return { parentId: 'orders', subItemId: 'orders_shipping', tab: 'shipping', params: {} };
  }
  if (cleanPath === '/admin/orders/invoices' || cleanPath === '/admin/invoices') {
    return { parentId: 'orders', subItemId: 'orders_invoices', tab: 'invoices', params: {} };
  }
  if (cleanPath === '/admin/orders/payments' || cleanPath === '/admin/payments') {
    return { parentId: 'orders', subItemId: 'orders_payments', tab: 'payments', params: {} };
  }
  if (cleanPath === '/admin/orders') {
    const filter = searchParams.get('filter') || 'all';
    const isReturns = filter === 'returns' || searchParams.get('sub') === 'orders_returns';
    return { 
      parentId: 'orders', 
      subItemId: isReturns ? 'orders_returns' : 'all_orders', 
      tab: 'orders', 
      params: { initialStatusFilter: filter, customerEmail: searchParams.get('customerEmail') || undefined } 
    };
  }

  // POS
  if (cleanPath === '/admin/pos/sales' || cleanPath === '/admin/pos/history') {
    return { parentId: 'pos', subItemId: 'pos_sales', tab: 'pos', params: { initialSubTab: 'history' } };
  }
  if (cleanPath === '/admin/pos/settings' || cleanPath === '/admin/pos-settings') {
    return { parentId: 'pos', subItemId: 'pos_settings', tab: 'pos-settings', params: {} };
  }
  if (cleanPath === '/admin/pos' || cleanPath === '/admin/pos/counter' || cleanPath === '/admin/pos/billing') {
    return { parentId: 'pos', subItemId: 'pos_counter', tab: 'pos', params: { initialSubTab: 'counter' } };
  }

  // IBP / Partner Stores
  if (cleanPath === '/admin/ibp' || cleanPath === '/admin/ibp/stores' || cleanPath === '/admin/stores' || cleanPath === '/admin/partner-stores') {
    return { parentId: 'ibp', subItemId: 'ibp_stores', tab: 'ibp', params: {} };
  }

  // Customers
  if (cleanPath === '/admin/customers/support' || cleanPath === '/admin/customers/inquiries' || cleanPath === '/admin/inquiries' || cleanPath === '/admin/support') {
    return { parentId: 'customers', subItemId: 'support_inquiries', tab: 'inquiries', params: {} };
  }
  if (cleanPath === '/admin/customers/loyalty' || cleanPath === '/admin/loyalty' || cleanPath === '/admin/customers/store-credit' || cleanPath === '/admin/store-credit') {
    return { parentId: 'customers', subItemId: 'loyalty_rewards', tab: 'loyalty', params: {} };
  }
  if (cleanPath === '/admin/customers') {
    return { parentId: 'customers', subItemId: 'all_customers', tab: 'customers', params: { initialSubTab: 'all' } };
  }

  // Marketing
  if (cleanPath === '/admin/marketing/subscribers' || cleanPath === '/admin/subscribers') {
    return { parentId: 'marketing', subItemId: 'marketing_subscribers', tab: 'marketing', params: { initialSubTab: 'subscribers' } };
  }
  if (cleanPath === '/admin/marketing/coupons' || cleanPath === '/admin/coupons') {
    return { parentId: 'marketing', subItemId: 'marketing_coupons', tab: 'marketing', params: { initialSubTab: 'coupons' } };
  }
  if (cleanPath === '/admin/marketing/content') {
    return { parentId: 'marketing', subItemId: 'marketing_content', tab: 'marketing', params: { initialSubTab: 'content' } };
  }
  if (cleanPath === '/admin/marketing' || cleanPath === '/admin/marketing/promotions' || cleanPath === '/admin/promotions') {
    return { parentId: 'marketing', subItemId: 'marketing_promotions', tab: 'marketing', params: { initialSubTab: 'promotions' } };
  }

  // Website Settings
  if (cleanPath === '/admin/website/homepage' || cleanPath === '/admin/website-control/homepage') {
    return { parentId: 'website_settings', subItemId: 'website_homepage', tab: 'website', params: { initialSubTab: 'homepage' } };
  }
  if (cleanPath === '/admin/website/navigation' || cleanPath === '/admin/website/header' || cleanPath === '/admin/website-control/navigation') {
    return { parentId: 'website_settings', subItemId: 'website_navigation', tab: 'website', params: { initialSubTab: 'navigation' } };
  }
  if (cleanPath === '/admin/website/footer' || cleanPath === '/admin/website-control/footer') {
    return { parentId: 'website_settings', subItemId: 'website_footer', tab: 'website', params: { initialSubTab: 'footer' } };
  }
  if (cleanPath === '/admin/website/content' || cleanPath === '/admin/website/pages' || cleanPath === '/admin/website-control/content') {
    return { parentId: 'website_settings', subItemId: 'website_content', tab: 'website', params: { initialSubTab: 'content' } };
  }
  if (cleanPath === '/admin/website/appearance' || cleanPath === '/admin/website/theme' || cleanPath === '/admin/website-control/appearance') {
    return { parentId: 'website_settings', subItemId: 'website_appearance', tab: 'website', params: { initialSubTab: 'appearance' } };
  }
  if (cleanPath === '/admin/website/seo' || cleanPath === '/admin/website/social' || cleanPath === '/admin/website-control/seo') {
    return { parentId: 'website_settings', subItemId: 'website_seo', tab: 'website', params: { initialSubTab: 'seo' } };
  }
  if (cleanPath.startsWith('/admin/website') || cleanPath.startsWith('/admin/website-control')) {
    return { parentId: 'website_settings', subItemId: 'website_homepage', tab: 'website', params: { initialSubTab: 'homepage' } };
  }

  // Reports
  if (cleanPath === '/admin/reports/orders') {
    return { parentId: 'reports', subItemId: 'reports_orders', tab: 'analytics', params: { initialSubTab: 'overview' } };
  }
  if (cleanPath === '/admin/reports/products') {
    return { parentId: 'reports', subItemId: 'reports_products', tab: 'analytics', params: { initialSubTab: 'products' } };
  }
  if (cleanPath === '/admin/reports/inventory') {
    return { parentId: 'reports', subItemId: 'reports_inventory', tab: 'analytics', params: { initialSubTab: 'inventory' } };
  }
  if (cleanPath === '/admin/reports/customers') {
    return { parentId: 'reports', subItemId: 'reports_customers', tab: 'analytics', params: { initialSubTab: 'customers' } };
  }
  if (cleanPath === '/admin/reports/tax' || cleanPath === '/admin/reports/gst') {
    return { parentId: 'reports', subItemId: 'reports_tax', tab: 'analytics', params: { initialSubTab: 'tax' } };
  }
  if (cleanPath === '/admin/reports' || cleanPath === '/admin/reports/sales' || cleanPath === '/admin/analytics') {
    return { parentId: 'reports', subItemId: 'reports_sales', tab: 'analytics', params: { initialSubTab: 'sales' } };
  }

  // Store Settings
  if (cleanPath === '/admin/settings/shipping' || cleanPath === '/admin/store-settings/shipping') {
    return { parentId: 'store_settings', subItemId: 'settings_shipping', tab: 'store-settings', params: { initialSubTab: 'shipping' } };
  }
  if (cleanPath === '/admin/settings/payments' || cleanPath === '/admin/store-settings/payments') {
    return { parentId: 'store_settings', subItemId: 'settings_payments', tab: 'store-settings', params: { initialSubTab: 'payments' } };
  }
  if (cleanPath === '/admin/settings/tax' || cleanPath === '/admin/store-settings/tax') {
    return { parentId: 'store_settings', subItemId: 'settings_tax', tab: 'store-settings', params: { initialSubTab: 'tax' } };
  }
  if (cleanPath === '/admin/settings/notifications' || cleanPath === '/admin/store-settings/notifications') {
    return { parentId: 'store_settings', subItemId: 'settings_notifications', tab: 'store-settings', params: { initialSubTab: 'notifications' } };
  }
  if (cleanPath === '/admin/settings/status' || cleanPath === '/admin/store-settings/status') {
    return { parentId: 'store_settings', subItemId: 'settings_status', tab: 'store-settings', params: { initialSubTab: 'status' } };
  }
  if (cleanPath === '/admin/settings' || cleanPath === '/admin/settings/store' || cleanPath === '/admin/store-settings') {
    return { parentId: 'store_settings', subItemId: 'settings_general', tab: 'store-settings', params: { initialSubTab: 'store' } };
  }

  // Advanced
  if (cleanPath === '/admin/advanced/codebase-defaults' || cleanPath === '/admin/codebase-defaults' || cleanPath === '/admin/advanced/codebase-audit') {
    return { parentId: 'advanced_settings', subItemId: 'adv_codebase_defaults', tab: 'advanced-settings', params: { initialSubTab: 'codebase_defaults' } };
  }
  if (cleanPath === '/admin/advanced/staff' || cleanPath === '/admin/admin-staff' || cleanPath === '/admin/staff') {
    return { parentId: 'advanced_settings', subItemId: 'adv_admin_staff', tab: 'admin-staff', params: { initialSubTab: 'admin_staff' } };
  }
  if (cleanPath === '/admin/advanced/import-export' || cleanPath === '/admin/advanced-settings/import-export') {
    return { parentId: 'advanced_settings', subItemId: 'adv_import_export', tab: 'advanced-settings', params: { initialSubTab: 'import_export' } };
  }
  if (cleanPath === '/admin/advanced/audit-logs' || cleanPath === '/admin/advanced-settings/audit-logs') {
    return { parentId: 'advanced_settings', subItemId: 'adv_audit_logs', tab: 'advanced-settings', params: { initialSubTab: 'audit_logs' } };
  }
  if (cleanPath === '/admin/advanced/database' || cleanPath === '/admin/advanced-settings/database') {
    return { parentId: 'advanced_settings', subItemId: 'adv_database', tab: 'advanced-settings', params: { initialSubTab: 'database' } };
  }
  if (cleanPath === '/admin/advanced' || cleanPath === '/admin/advanced/integrations' || cleanPath === '/admin/advanced-settings') {
    return { parentId: 'advanced_settings', subItemId: 'adv_integrations', tab: 'advanced-settings', params: { initialSubTab: 'integrations' } };
  }

  // Fallback to query params if present on /admin
  const queryTab = searchParams.get('tab');
  if (queryTab) {
    const sub = searchParams.get('sub') || '';
    const filter = searchParams.get('filter') || '';
    const isAddModal = searchParams.get('modal') === 'add';

    switch (queryTab) {
      case 'dashboard':
        return { parentId: 'dashboard', subItemId: 'dashboard', tab: 'dashboard', params: {} };
      case 'products':
        return { parentId: 'products', subItemId: 'products_list', tab: 'products', params: { openAddModal: isAddModal } };
      case 'categories':
        return { parentId: 'products', subItemId: 'categories', tab: 'categories', params: {} };
      case 'brands':
        return { parentId: 'products', subItemId: 'brands', tab: 'brands', params: {} };
      case 'inventory':
        return { parentId: 'products', subItemId: 'inventory', tab: 'inventory', params: {} };
      case 'reviews':
        return { parentId: 'products', subItemId: 'reviews', tab: 'reviews', params: {} };

      case 'orders':
        const isReturns = filter === 'returns' || sub === 'orders_returns';
        return { 
          parentId: 'orders', 
          subItemId: isReturns ? 'orders_returns' : 'all_orders', 
          tab: 'orders', 
          params: { initialStatusFilter: filter || (isReturns ? 'returns' : 'all'), customerEmail: searchParams.get('customerEmail') || undefined } 
        };
      case 'shipping':
      case 'shipments':
        return { parentId: 'orders', subItemId: 'orders_shipping', tab: 'shipping', params: {} };
      case 'invoices':
      case 'credit-notes':
        return { parentId: 'orders', subItemId: 'orders_invoices', tab: 'invoices', params: {} };
      case 'payments':
        return { parentId: 'orders', subItemId: 'orders_payments', tab: 'payments', params: {} };

      case 'pos':
        if (sub === 'history' || sub === 'pos_sales') return { parentId: 'pos', subItemId: 'pos_sales', tab: 'pos', params: { initialSubTab: 'history' } };
        return { parentId: 'pos', subItemId: 'pos_counter', tab: 'pos', params: { initialSubTab: 'counter' } };
      case 'pos-settings':
        return { parentId: 'pos', subItemId: 'pos_settings', tab: 'pos-settings', params: {} };

      case 'ibp':
      case 'ibp-stores':
      case 'partner-stores':
      case 'stores':
        return { parentId: 'ibp', subItemId: 'ibp_stores', tab: 'ibp', params: {} };

      case 'customers':
        return { parentId: 'customers', subItemId: 'all_customers', tab: 'customers', params: { initialSubTab: 'all' } };
      case 'inquiries':
      case 'support':
      case 'support_inquiries':
        return { parentId: 'customers', subItemId: 'support_inquiries', tab: 'inquiries', params: {} };
      case 'loyalty':
      case 'gift-cards':
      case 'giftcards':
      case 'store-credit':
        return { parentId: 'customers', subItemId: 'loyalty_rewards', tab: 'loyalty', params: {} };

      case 'marketing':
        if (sub === 'coupons') return { parentId: 'marketing', subItemId: 'marketing_coupons', tab: 'marketing', params: { initialSubTab: 'coupons' } };
        if (sub === 'content') return { parentId: 'marketing', subItemId: 'marketing_content', tab: 'marketing', params: { initialSubTab: 'content' } };
        if (sub === 'subscribers') return { parentId: 'marketing', subItemId: 'marketing_subscribers', tab: 'marketing', params: { initialSubTab: 'subscribers' } };
        return { parentId: 'marketing', subItemId: 'marketing_promotions', tab: 'marketing', params: { initialSubTab: 'promotions' } };
      case 'coupons':
        return { parentId: 'marketing', subItemId: 'marketing_coupons', tab: 'marketing', params: { initialSubTab: 'coupons' } };
      case 'banners':
        return { parentId: 'marketing', subItemId: 'marketing_promotions', tab: 'marketing', params: { initialSubTab: 'promotions' } };
      case 'subscribers':
        return { parentId: 'marketing', subItemId: 'marketing_subscribers', tab: 'marketing', params: { initialSubTab: 'subscribers' } };

      case 'website':
      case 'website-control': {
        let subItemId = 'website_homepage';
        if (sub === 'navigation' || sub === 'header') subItemId = 'website_navigation';
        else if (sub === 'footer') subItemId = 'website_footer';
        else if (sub === 'content' || sub === 'pages' || sub === 'websiteContent') subItemId = 'website_content';
        else if (sub === 'appearance' || sub === 'theme' || sub === 'branding') subItemId = 'website_appearance';
        else if (sub === 'seo' || sub === 'social') subItemId = 'website_seo';
        return { parentId: 'website_settings', subItemId, tab: 'website', params: { initialSubTab: sub || 'homepage' } };
      }

      case 'analytics':
      case 'reports':
        if (sub === 'overview' || sub === 'orders') return { parentId: 'reports', subItemId: 'reports_orders', tab: 'analytics', params: { initialSubTab: 'overview' } };
        if (sub === 'products') return { parentId: 'reports', subItemId: 'reports_products', tab: 'analytics', params: { initialSubTab: 'products' } };
        if (sub === 'inventory') return { parentId: 'reports', subItemId: 'reports_inventory', tab: 'analytics', params: { initialSubTab: 'inventory' } };
        if (sub === 'customers') return { parentId: 'reports', subItemId: 'reports_customers', tab: 'analytics', params: { initialSubTab: 'customers' } };
        if (sub === 'tax' || sub === 'gst') return { parentId: 'reports', subItemId: 'reports_tax', tab: 'analytics', params: { initialSubTab: 'tax' } };
        return { parentId: 'reports', subItemId: 'reports_sales', tab: 'analytics', params: { initialSubTab: 'sales' } };

      case 'store-settings':
      case 'settings':
        if (sub === 'shipping') return { parentId: 'store_settings', subItemId: 'settings_shipping', tab: 'store-settings', params: { initialSubTab: 'shipping' } };
        if (sub === 'payments') return { parentId: 'store_settings', subItemId: 'settings_payments', tab: 'store-settings', params: { initialSubTab: 'payments' } };
        if (sub === 'tax') return { parentId: 'store_settings', subItemId: 'settings_tax', tab: 'store-settings', params: { initialSubTab: 'tax' } };
        if (sub === 'notifications') return { parentId: 'store_settings', subItemId: 'settings_notifications', tab: 'store-settings', params: { initialSubTab: 'notifications' } };
        if (sub === 'status') return { parentId: 'store_settings', subItemId: 'settings_status', tab: 'store-settings', params: { initialSubTab: 'status' } };
        return { parentId: 'store_settings', subItemId: 'settings_general', tab: 'store-settings', params: { initialSubTab: 'store' } };

      case 'admin-staff':
      case 'staff':
        return { parentId: 'advanced_settings', subItemId: 'adv_admin_staff', tab: 'admin-staff', params: { initialSubTab: 'admin_staff' } };

      case 'advanced-settings':
      case 'advanced':
        if (sub === 'codebase_defaults' || sub === 'codebase-defaults' || sub === 'codebase-audit') return { parentId: 'advanced_settings', subItemId: 'adv_codebase_defaults', tab: 'advanced-settings', params: { initialSubTab: 'codebase_defaults' } };
        if (sub === 'admin_staff' || sub === 'staff') return { parentId: 'advanced_settings', subItemId: 'adv_admin_staff', tab: 'admin-staff', params: { initialSubTab: 'admin_staff' } };
        if (sub === 'import_export') return { parentId: 'advanced_settings', subItemId: 'adv_import_export', tab: 'advanced-settings', params: { initialSubTab: 'import_export' } };
        if (sub === 'audit_logs') return { parentId: 'advanced_settings', subItemId: 'adv_audit_logs', tab: 'advanced-settings', params: { initialSubTab: 'audit_logs' } };
        if (sub === 'database') return { parentId: 'advanced_settings', subItemId: 'adv_database', tab: 'advanced-settings', params: { initialSubTab: 'database' } };
        return { parentId: 'advanced_settings', subItemId: 'adv_integrations', tab: 'advanced-settings', params: { initialSubTab: 'integrations' } };

      case 'notifications':
        return { parentId: 'store_settings', subItemId: 'settings_notifications', tab: 'store-settings', params: { initialSubTab: 'notifications' } };
    }
  }

  return { parentId: 'dashboard', subItemId: 'dashboard', tab: 'dashboard', params: {} };
}

export function getCanonicalAdminUrl(tab: string, params: any = {}): string {
  const sub = params?.initialSubTab || params?.subTab || '';
  const filter = params?.statusFilter || params?.initialStatusFilter || params?.filter || '';
  const isAddModal = params?.openAddModal;

  switch (tab) {
    case 'dashboard':
      return '/admin';

    case 'products':
      return isAddModal ? '/admin/products?modal=add' : '/admin/products';
    case 'categories':
      return '/admin/products/categories';
    case 'brands':
      return '/admin/products/brands';
    case 'inventory':
      return '/admin/products/inventory';
    case 'reviews':
      return '/admin/products/reviews';

    case 'orders':
      if (filter === 'returns' || sub === 'orders_returns') {
        return '/admin/orders/returns';
      }
      if (filter && filter !== 'all') {
        const queryParams = new URLSearchParams();
        queryParams.set('filter', filter);
        if (params?.customerEmail) queryParams.set('customerEmail', params.customerEmail);
        return `/admin/orders?${queryParams.toString()}`;
      }
      if (params?.customerEmail) {
        return `/admin/orders?customerEmail=${encodeURIComponent(params.customerEmail)}`;
      }
      return '/admin/orders';
    case 'shipping':
    case 'shipments':
      return '/admin/orders/shipping';
    case 'invoices':
    case 'credit-notes':
      return '/admin/orders/invoices';
    case 'payments':
      return '/admin/orders/payments';

    case 'pos':
      if (sub === 'history' || sub === 'pos_sales') return '/admin/pos/sales';
      return '/admin/pos';
    case 'pos-settings':
      return '/admin/pos/settings';

    case 'ibp':
    case 'ibp-stores':
    case 'partner-stores':
    case 'stores':
      return '/admin/ibp';

    case 'customers':
      if (sub === 'support' || sub === 'inquiries') return '/admin/customers/support';
      if (sub === 'loyalty' || sub === 'store-credit') return '/admin/customers/loyalty';
      return '/admin/customers';
    case 'inquiries':
    case 'support':
    case 'support_inquiries':
      return '/admin/customers/support';
    case 'loyalty':
    case 'gift-cards':
    case 'giftcards':
    case 'store-credit':
      return '/admin/customers/loyalty';

    case 'marketing':
      if (sub === 'coupons') return '/admin/marketing/coupons';
      if (sub === 'content') return '/admin/marketing/content';
      return '/admin/marketing/promotions';
    case 'coupons':
      return '/admin/marketing/coupons';
    case 'banners':
      return '/admin/marketing/promotions';

    case 'website':
    case 'website-control':
      if (sub === 'navigation' || sub === 'header') return '/admin/website/navigation';
      if (sub === 'footer') return '/admin/website/footer';
      if (sub === 'content' || sub === 'pages' || sub === 'websiteContent') return '/admin/website/content';
      if (sub === 'appearance' || sub === 'theme' || sub === 'branding') return '/admin/website/appearance';
      if (sub === 'seo' || sub === 'social') return '/admin/website/seo';
      return '/admin/website/homepage';

    case 'analytics':
    case 'reports':
      if (sub === 'overview' || sub === 'orders') return '/admin/reports/orders';
      if (sub === 'products') return '/admin/reports/products';
      if (sub === 'inventory') return '/admin/reports/inventory';
      if (sub === 'customers') return '/admin/reports/customers';
      if (sub === 'tax' || sub === 'gst') return '/admin/reports/tax';
      return '/admin/reports/sales';

    case 'store-settings':
    case 'settings':
      if (sub === 'shipping') return '/admin/settings/shipping';
      if (sub === 'payments') return '/admin/settings/payments';
      if (sub === 'tax') return '/admin/settings/tax';
      if (sub === 'notifications') return '/admin/settings/notifications';
      if (sub === 'status') return '/admin/settings/status';
      return '/admin/settings/store';

    case 'admin-staff':
    case 'staff':
      return '/admin/advanced/staff';

    case 'advanced-settings':
    case 'advanced':
      if (sub === 'admin_staff' || sub === 'staff') return '/admin/advanced/staff';
      if (sub === 'import_export') return '/admin/advanced/import-export';
      if (sub === 'audit_logs') return '/admin/advanced/audit-logs';
      if (sub === 'database') return '/admin/advanced/database';
      return '/admin/advanced/integrations';

    case 'notifications':
      return '/admin/settings/notifications';

    default:
      return '/admin';
  }
}

export function Admin() {
  const { settings, draftSettings } = useSiteSettings();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  // Derive route state directly from current location pathname & searchParams
  const resolved = useMemo(() => {
    return resolveAdminRoute(location.pathname, searchParams);
  }, [location.pathname, searchParams]);

  const activeTab = resolved.tab;
  const activeSubItemId = resolved.subItemId;
  const activeParentId = resolved.parentId;
  const tabParams = resolved.params;

  // Initialize openSections with the currently active parent section expanded
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial = resolveAdminRoute(window.location.pathname, new URLSearchParams(window.location.search));
    return {
      products: initial.parentId === 'products',
      orders: initial.parentId === 'orders',
      pos: initial.parentId === 'pos',
      ibp: initial.parentId === 'ibp',
      customers: initial.parentId === 'customers',
      marketing: initial.parentId === 'marketing',
      reports: initial.parentId === 'reports',
      store_settings: initial.parentId === 'store_settings',
      advanced_settings: initial.parentId === 'advanced_settings',
    };
  });

  // Ensure active parent section stays expanded on navigation, refresh, or back/forward
  useEffect(() => {
    if (activeParentId && activeParentId !== 'dashboard') {
      setOpenSections(prev => ({
        ...prev,
        [activeParentId]: true
      }));
    }
  }, [activeParentId]);

  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  // Real-time unread notifications counter
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('read', '==', false)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadNotifsCount(snapshot.size);
      }, (err) => {
        console.warn("Unread notifs listener note:", err);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not attach unread notifs listener:", err);
    }
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const activeAdminSettings = draftSettings || settings;
  const storeName = activeAdminSettings.general?.storeName || activeAdminSettings.branding?.brandName || 'ELECTRO STORE';
  const shortStoreName = activeAdminSettings.general?.shortStoreName || (storeName ? storeName.split(' ')[0] : 'ELECTRO');
  const adminLogo = (
    activeAdminSettings.branding?.adminLogo && activeAdminSettings.branding?.adminLogo !== '/assets/logo.svg'
      ? activeAdminSettings.branding?.adminLogo
      : (activeAdminSettings.branding?.primaryLogo || activeAdminSettings.general?.storeLogoUrl || '/assets/logo.svg')
  ).trim();

  const navigateTab = (tab: string, params: any = {}) => {
    const targetPath = tab.startsWith('/') ? tab : getCanonicalAdminUrl(tab, params);
    navigate(targetPath);
    setMobileMenuOpen(false);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab, tabParams]);

  // Global search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/admin/global-search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSearchResults(data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Helper to filter nav items according to staff permissions
  const isFullAdmin = Boolean(
    user && (
      isAdminOrOwner(user) ||
      isOwnerUser(user) ||
      isUserAdminOrOwner(user) ||
      user.role === 'admin' ||
      user.role === 'owner' ||
      String(user.role || '').toUpperCase() === 'PLATFORM_ADMIN' ||
      user.isPrimaryOwner === true ||
      user.uid === PRIMARY_OWNER_UID ||
      isAdminEmail(user.email) ||
      isOwnerPhone(user.phoneNumber)
    )
  );

  const allowedNavItems = navItems.filter(item => {
    if (!user || isFullAdmin) return true;
    if (canAccessAdminTab(user, item.tab)) return true;
    if (item.subItems && item.subItems.some(s => canAccessAdminTab(user, s.tab))) return true;
    return false;
  }).map(item => {
    if (!user || isFullAdmin) return item;
    if (!item.subItems) return item;
    return {
      ...item,
      subItems: item.subItems.filter(s => canAccessAdminTab(user, s.tab))
    };
  });

  // Helper to get active breadcrumbs
  const getBreadcrumbs = () => {
    const parent = navItems.find(item => item.id === activeParentId) || navItems[0];
    let subLabel = '';
    if (parent.subItems) {
      const sub = parent.subItems.find(s => s.id === activeSubItemId);
      if (sub) subLabel = sub.label;
    }

    return {
      parent: parent.label,
      sub: subLabel && subLabel !== parent.label ? subLabel : ''
    };
  };

  const breadcrumbs = getBreadcrumbs();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium flex items-center gap-2">
          <Loader2 className="animate-spin" size={20} />
          Checking permissions...
        </p>
      </div>
    );
  }

  // Account disabled check
  if (user && user.status === 'disabled') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-xl border border-rose-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldX size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Staff Account Deactivated
          </h1>
          <p className="text-slate-600 text-xs mb-6 leading-relaxed">
            Your staff account ({user.email || user.phoneNumber}) has been disabled by the store owner. Please contact your store administrator to restore system access.
          </p>
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => navigate('/login?redirect=/admin')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition-colors"
            >
              Sign In with Authorized Account
            </button>
            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isStaffOrAdmin = Boolean(
    user && (
      isAdminOrOwner(user) ||
      isOwnerUser(user) ||
      isUserAdminOrOwner(user) ||
      user.role === 'admin' ||
      user.role === 'owner' ||
      user.role === 'staff' ||
      user.role === 'manager' ||
      String(user.role || '').toUpperCase() === 'PLATFORM_ADMIN' ||
      user.isPrimaryOwner === true ||
      user.uid === PRIMARY_OWNER_UID ||
      isAdminEmail(user.email) ||
      isOwnerPhone(user.phoneNumber)
    )
  );

  if (!user || !isStaffOrAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Admin & Staff Access Required
          </h1>
          <p className="text-slate-600 text-xs mb-6 leading-relaxed">
            {user 
              ? `You are currently signed in as ${user.email || user.phoneNumber} (${user.role}). This section requires staff or administrator privileges.`
              : `Please authenticate with an administrator or staff account to access the ${storeName} Control Panel.`
            }
          </p>

          <div className="space-y-3">
            <button 
              type="button"
              onClick={() => navigate('/login?redirect=/admin')} 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <LogIn size={16} />
              <span>Sign In to Admin Account</span>
            </button>

            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if current staff has permission to view the activeTab
  const hasTabAccess = canAccessAdminTab(user, activeTab);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-35 md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar (Clean 9 Sections) */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0 shadow-xl md:shadow-none transition-transform duration-200 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 max-w-[210px] overflow-hidden" title={`${storeName} — View Storefront`}>
            {adminLogo ? (
              <img 
                src={adminLogo} 
                alt={storeName} 
                className="object-contain object-left shrink-0" 
                style={{
                  width: 'auto',
                  maxWidth: `${activeAdminSettings.branding?.logoSizes?.adminPanelWidth || 140}px`,
                  height: 'auto',
                  maxHeight: '36px',
                  objectFit: 'contain',
                  objectPosition: 'left center'
                }}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const fallback = document.getElementById('admin-sidebar-text-fallback');
                  if (fallback) fallback.style.display = 'inline-block';
                }}
              />
            ) : null}
            <span 
              id="admin-sidebar-text-fallback" 
              className={`text-white font-extrabold text-sm tracking-tight truncate ${adminLogo ? 'hidden' : ''}`}
            >
              {storeName}
            </span>
            <span className="text-[10px] bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-md font-mono font-bold border border-blue-500/30 shrink-0">ADMIN</span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            className="md:hidden text-slate-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* 9 Navigation Items (Filtered by Staff Permissions) */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const hasSub = item.subItems && item.subItems.length > 0;
            const isOpen = openSections[item.id] ?? false;
            const isMainActive = activeParentId === item.id;

            return (
              <div key={item.id} className="space-y-0.5">
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      if (hasSub && item.subItems && item.subItems.length > 0) {
                        setOpenSections(prev => ({ ...prev, [item.id]: true }));
                        navigate(item.subItems[0].path);
                        setMobileMenuOpen(false);
                      } else {
                        navigate(item.path || '/admin');
                        setMobileMenuOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                      isMainActive && (!hasSub || !isOpen)
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : isMainActive
                        ? 'bg-slate-800/90 text-blue-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={16} className={isMainActive ? (isMainActive && (!hasSub || !isOpen) ? 'text-white' : 'text-blue-400') : 'text-slate-400'} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.tab === 'notifications' && unreadNotifsCount > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-red-500 text-white animate-pulse">
                          {unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}
                        </span>
                      )}
                      {hasSub && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(item.id);
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 transition-colors"
                          role="button"
                          tabIndex={0}
                          aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        >
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Sub-menu accordion */}
                {hasSub && isOpen && (
                  <ul className="ml-4 pl-3 border-l border-slate-800 space-y-1 py-1">
                    {item.subItems!.map((sub) => {
                      const isSubActive = activeSubItemId === sub.id;
                      return (
                        <li key={sub.id}>
                          <button
                            onClick={() => {
                              navigate(sub.path);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer min-h-[38px] flex items-center ${
                              isSubActive
                                ? 'text-blue-400 font-bold bg-blue-500/15'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium'
                            }`}
                          >
                            {sub.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.displayName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user?.displayName || 'Store Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Administrator'}</p>
            </div>
          </div>
          <Link
            to="/"
            title="View Storefront"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          >
            <ExternalLink size={16} />
          </Link>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header with Breadcrumbs & Search */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 relative z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-600 hover:text-slate-900 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open sidebar navigation"
            >
              <Menu size={22} />
            </button>

            {/* Breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <button 
                onClick={() => navigateTab('dashboard')}
                className="hover:text-blue-600 flex items-center gap-1 cursor-pointer"
              >
                <Home size={13} />
                <span>Admin</span>
              </button>
              <BreadcrumbChevron size={12} className="text-slate-400" />
              <span className={breadcrumbs.sub ? 'text-slate-600 font-semibold' : 'text-slate-900 font-bold'}>
                {breadcrumbs.parent}
              </span>
              {breadcrumbs.sub && (
                <>
                  <BreadcrumbChevron size={12} className="text-slate-400" />
                  <span className="text-slate-900 font-bold">
                    {breadcrumbs.sub}
                  </span>
                </>
              )}
            </div>

            {/* Mobile Header Title */}
            <div className="sm:hidden font-bold text-sm text-slate-900 truncate">
              {breadcrumbs.parent}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative">
              <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl w-48 sm:w-80 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                {isSearching ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <Search size={16} />}
                <input
                  type="text"
                  placeholder="Search store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="bg-transparent border-none outline-none text-xs w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Search dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full right-0 sm:left-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Search Results ({searchResults.length})
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => {
                          navigateTab(item.link);
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.title}</p>
                          <p className="text-[10px] text-slate-500">{item.subtitle}</p>
                        </div>
                        <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                          {item.type} <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Dropdown Anchor */}
            <div className="relative">
              <button
                ref={bellButtonRef}
                type="button"
                onClick={() => setNotificationsDropdownOpen(prev => !prev)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer relative flex items-center justify-center min-h-[38px] min-w-[38px] ${
                  notificationsDropdownOpen
                    ? 'bg-blue-50 border-blue-300 text-blue-600' 
                    : 'border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
                title="Store Notifications"
                aria-label="View notifications"
                aria-expanded={notificationsDropdownOpen}
              >
                <Bell size={17} />
                {unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[17px] text-[10px] font-extrabold rounded-full bg-red-500 text-white flex items-center justify-center border-2 border-white">
                    {unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}
                  </span>
                )}
              </button>

              <AdminNotificationDropdown
                isOpen={notificationsDropdownOpen}
                triggerRef={bellButtonRef}
                onClose={() => setNotificationsDropdownOpen(false)}
                onViewAll={() => {
                  setNotificationsDropdownOpen(false);
                  navigateTab('notifications');
                }}
                onNavigateTab={(tab, params) => {
                  setNotificationsDropdownOpen(false);
                  navigateTab(tab, params);
                }}
              />
            </div>

            {/* View Storefront Shortcut */}
            <Link
              to="/"
              title={`View ${storeName} Storefront`}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors hidden md:inline-flex items-center gap-1.5"
            >
              <span className="max-w-[140px] truncate">{storeName}</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <div ref={contentRef} className={`flex-1 overflow-y-auto overflow-x-hidden ${activeTab === 'pos' ? 'p-0' : 'p-3 sm:p-6 lg:p-8'} bg-slate-50`}>
          
          {!hasTabAccess ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <Lock size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Permission Denied — Access Restricted
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
                Your staff profile (<span className="font-semibold text-slate-800">{user?.displayName || user?.email}</span>) does not have authorization to view or manage the <span className="font-bold text-rose-600">{getTabDisplayName(activeTab)}</span> module.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {user?.permissions?.pos_access && (
                  <button
                    onClick={() => navigateTab('pos')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Store size={14} />
                    <span>Open POS Counter</span>
                  </button>
                )}
                {user?.permissions?.orders_view && (
                  <button
                    onClick={() => navigateTab('orders')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <ShoppingCart size={14} />
                    <span>View Orders</span>
                  </button>
                )}
                <button
                  onClick={() => navigateTab('dashboard')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard onNavigateTab={(tab, params) => navigateTab(tab, params)} />
              )}

              {activeTab === 'analytics' && (
                <AdminAnalytics 
                  onNavigateTab={(tab, filterState) => navigateTab(tab, filterState)} 
                  initialSubTab={tabParams?.initialSubTab} 
                />
              )}

              {activeTab === 'ibp' && (
                <AdminIBPStores />
              )}

              {activeTab === 'products' && (
                <AdminProducts initialOpenAddModal={tabParams?.openAddModal} />
              )}

              {activeTab === 'categories' && <AdminCategories />}
              {activeTab === 'brands' && <AdminBrands />}
              {activeTab === 'inventory' && <AdminInventory />}
              {activeTab === 'reviews' && (
                <AdminReviews onNavigateTab={(tab, params) => navigateTab(tab, params)} />
              )}

              {activeTab === 'orders' && (
                <AdminOrders 
                  initialStatusFilter={tabParams?.statusFilter || tabParams?.initialStatusFilter || 'all'} 
                  customerEmailFilter={tabParams?.customerEmail} 
                  onNavigateTab={(tab, params) => navigateTab(tab, params)}
                />
              )}

              {(activeTab === 'invoices' || activeTab === 'credit-notes') && (
                <AdminInvoices />
              )}

              {(activeTab === 'shipping' || activeTab === 'shipments') && (
                <ShippingDashboard onNavigateTab={(tab, params) => navigateTab(tab, params)} />
              )}

              {activeTab === 'pos' && (
                <AdminPOS 
                  onBackToAdmin={() => navigateTab('dashboard')} 
                  initialSubTab={tabParams?.initialSubTab} 
                />
              )}

              {activeTab === 'pos-settings' && (
                <AdminPosSettings 
                  onBackToPos={() => navigateTab('pos')}
                  onBackToStoreSettings={() => navigateTab('store-settings')}
                />
              )}

              {(activeTab === 'customers' || activeTab === 'store-credit') && (
                <AdminCustomers 
                  onNavigateTab={(tab, params) => navigateTab(tab, params)} 
                  initialSubTab={activeTab === 'store-credit' ? 'store-credit' : tabParams?.initialSubTab} 
                />
              )}

              {(activeTab === 'loyalty' || activeTab === 'gift-cards' || activeTab === 'giftcards') && (
                <AdminLoyalty initialSubTab={activeTab === 'gift-cards' || activeTab === 'giftcards' ? 'giftcards' : tabParams?.initialSubTab} />
              )}

              {activeTab === 'marketing' && (
                <AdminMarketing initialSubTab={tabParams?.initialSubTab} />
              )}
              {activeTab === 'coupons' && <AdminMarketing initialSubTab="coupons" />}
              {activeTab === 'banners' && <AdminMarketing initialSubTab="promotions" />}

              {(activeTab === 'website' || activeTab === 'website-control') && (
                <AdminWebsiteControl initialSubTab={tabParams?.initialSubTab || tabParams?.subTab} />
              )}

              {(activeTab === 'store-settings' || activeTab === 'settings') && (
                <AdminStoreSettings initialSubTab={tabParams?.initialSubTab || 'store'} />
              )}

              {activeTab === 'advanced-settings' && (
                <AdminAdvancedSettings initialSubTab={tabParams?.initialSubTab || 'integrations'} />
              )}

              {activeTab === 'admin-staff' && (
                <AdminStaff />
              )}

              {(activeTab === 'payments' || activeTab.startsWith('payments')) && (
                <AdminPayments 
                  activeSubTab={tabParams?.initialSubTab || (activeTab === 'payments' ? 'transactions' : activeTab.replace('payments-', ''))} 
                  initialStatusFilter={tabParams?.initialStatusFilter || tabParams?.statusFilter || 'all'}
                  onNavigateTab={(tab, params) => navigateTab(tab, params)} 
                />
              )}

              {activeTab === 'notifications' && (
                <AdminNotifications 
                  initialFilter={tabParams?.initialFilter || tabParams?.filter || 'all'}
                  onNavigateTab={(tab, params) => navigateTab(tab, params)} 
                />
              )}

              {(activeTab === 'inquiries' || activeTab === 'support_inquiries' || activeTab === 'support') && (
                <AdminInquiries 
                  initialStatusFilter={tabParams?.initialStatusFilter || tabParams?.statusFilter || 'all'} 
                  onNavigateTab={(tab, params) => navigateTab(tab, params)}
                />
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

// force update
console.log("Admin module loaded");
