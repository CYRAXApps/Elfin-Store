import { StaffPermissions, StaffMember } from '../types';
import { UserProfile, isAdminEmail, isOwnerUser, PRIMARY_OWNER_EMAIL, PRIMARY_OWNER_UID } from '../context/AuthContext';

export const isUserAdminOrOwner = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  if (user.status === 'disabled' || (user as any).active === false) return false;
  const roleStr = String(user.role || '').toUpperCase();
  return (
    user.role === 'admin' ||
    user.role === 'owner' ||
    roleStr === 'PLATFORM_ADMIN' ||
    roleStr === 'ADMIN' ||
    roleStr === 'OWNER' ||
    user.isPrimaryOwner === true ||
    user.uid === PRIMARY_OWNER_UID ||
    isOwnerUser(user) ||
    isAdminEmail(user.email)
  );
};

export const FULL_ADMIN_PERMISSIONS: StaffPermissions = {
  pos_access: true,
  pos_view_sales: true,
  pos_manage_returns: true,

  orders_view: true,
  orders_update_status: true,
  orders_manage_returns: true,

  products_view: true,
  products_edit: true,
  products_manage_inventory: true,
  products_delete: true,

  customers_view: true,
  customers_manage: true,

  marketing_manage: true,

  reviews_manage: true,

  support_view: true,
  support_manage: true,

  reports_view: true,

  settings_view: true,
  settings_manage: true,

  staff_manage: true,

  notifications_view: true,
  notifications_manage: true,
};

export const MANAGER_PRESET_PERMISSIONS: StaffPermissions = {
  pos_access: true,
  pos_view_sales: true,
  pos_manage_returns: true,

  orders_view: true,
  orders_update_status: true,
  orders_manage_returns: true,

  products_view: true,
  products_edit: true,
  products_manage_inventory: true,
  products_delete: true,

  customers_view: true,
  customers_manage: true,

  marketing_manage: false,

  reviews_manage: true,

  support_view: true,
  support_manage: true,

  reports_view: true,

  settings_view: false,
  settings_manage: false,

  staff_manage: false,

  notifications_view: true,
  notifications_manage: false,
};

export const STAFF_PRESET_PERMISSIONS: StaffPermissions = {
  pos_access: true,
  pos_view_sales: true,
  pos_manage_returns: false,

  orders_view: true,
  orders_update_status: false,
  orders_manage_returns: false,

  products_view: false,
  products_edit: false,
  products_manage_inventory: false,
  products_delete: false,

  customers_view: true,
  customers_manage: false,

  marketing_manage: false,

  reviews_manage: false,

  support_view: false,
  support_manage: false,

  reports_view: false,

  settings_view: false,
  settings_manage: false,

  staff_manage: false,

  notifications_view: true,
  notifications_manage: false,
};

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  ...STAFF_PRESET_PERMISSIONS
};

export interface PermissionDefinition {
  key: keyof StaffPermissions;
  label: string;
  description?: string;
}

export interface PermissionCategory {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionDefinition[];
}

// Clean grouped layout matching user specification: Products, Orders, POS, Customers, Marketing, Reports, Store Settings
export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'products',
    name: 'Products',
    permissions: [
      { key: 'products_view', label: 'View' },
      { key: 'products_edit', label: 'Add/Edit' },
      { key: 'products_delete', label: 'Delete' },
    ]
  },
  {
    id: 'orders',
    name: 'Orders',
    permissions: [
      { key: 'orders_view', label: 'View' },
      { key: 'orders_update_status', label: 'Manage' },
      { key: 'orders_manage_returns', label: 'Cancel/Return' },
    ]
  },
  {
    id: 'pos',
    name: 'POS',
    permissions: [
      { key: 'pos_access', label: 'Access POS' },
      { key: 'pos_view_sales', label: 'View Sales' },
      { key: 'pos_manage_returns', label: 'Manage Returns' },
    ]
  },
  {
    id: 'customers',
    name: 'Customers',
    permissions: [
      { key: 'customers_view', label: 'View' },
      { key: 'customers_manage', label: 'Manage' },
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing',
    permissions: [
      { key: 'marketing_manage', label: 'Manage' },
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    permissions: [
      { key: 'reports_view', label: 'View' },
    ]
  },
  {
    id: 'settings',
    name: 'Store Settings',
    permissions: [
      { key: 'settings_manage', label: 'Manage' },
    ]
  }
];

export interface StaffPreset {
  id: string;
  name: string;
  description: string;
  permissions: Partial<StaffPermissions>;
}

export const STAFF_PRESETS: StaffPreset[] = [
  {
    id: 'pos_cashier',
    name: 'Counter Cashier',
    description: 'POS terminal access, counter billing, sales receipts & returns',
    permissions: {
      pos_access: true,
      pos_view_sales: true,
      pos_manage_returns: true,
    }
  },
  {
    id: 'order_fulfillment',
    name: 'Order Fulfillment',
    description: 'Manage online & offline orders, status updates, and returns',
    permissions: {
      orders_view: true,
      orders_update_status: true,
      orders_manage_returns: true,
      customers_view: true,
    }
  },
  {
    id: 'inventory_manager',
    name: 'Inventory Manager',
    description: 'Product catalog, stock adjustments, purchase orders & suppliers',
    permissions: {
      products_view: true,
      products_edit: true,
      products_manage_inventory: true,
    }
  },
  {
    id: 'customer_support',
    name: 'Customer Support',
    description: 'Inquiries, customer profiles, help desk & review moderation',
    permissions: {
      customers_view: true,
      reviews_manage: true,
      support_view: true,
      support_manage: true,
    }
  },
  {
    id: 'store_manager',
    name: 'Store Manager',
    description: 'All operations except managing other staff accounts',
    permissions: {
      pos_access: true,
      pos_view_sales: true,
      pos_manage_returns: true,
      orders_view: true,
      orders_update_status: true,
      orders_manage_returns: true,
      products_view: true,
      products_edit: true,
      products_manage_inventory: true,
      customers_view: true,
      reviews_manage: true,
      support_view: true,
      support_manage: true,
      reports_view: true,
      settings_view: true,
      staff_manage: false,
    }
  }
];

/**
 * Checks if a user has a specific staff permission.
 * Owner/Admin accounts always have full access.
 * Disabled accounts have NO access.
 */
export function hasStaffPermission(
  user: UserProfile | null | undefined,
  permissionKey: keyof StaffPermissions
): boolean {
  if (!user) return false;

  // Account disabled check
  if (user.status === 'disabled' || (user as any).active === false) {
    return false;
  }

  // Owner / System Admin email, role, or primary owner
  if (isUserAdminOrOwner(user)) {
    return true;
  }

  // Staff & Manager user check
  if (user.role === 'staff' || user.role === 'manager') {
    const permissions = user.permissions;
    if (!permissions) return false;
    return Boolean(permissions[permissionKey]);
  }

  return false;
}

/**
 * Checks if a user has access to a specific Admin Panel tab.
 */
export function canAccessAdminTab(
  user: UserProfile | null | undefined,
  tab: string
): boolean {
  if (!user) return false;

  if (user.status === 'disabled' || (user as any).active === false) {
    return false;
  }

  if (isUserAdminOrOwner(user)) {
    return true;
  }

  if (user.role !== 'staff' && user.role !== 'manager') {
    return false;
  }

  const p = user.permissions || DEFAULT_STAFF_PERMISSIONS;

  switch (tab) {
    case 'dashboard':
      // Dashboard is accessible if staff has ANY active permission
      return Object.values(p).some(Boolean);

    case 'pos':
      return Boolean(p.pos_access);

    case 'pos-settings':
      return Boolean(p.settings_view || p.settings_manage);

    case 'products':
    case 'categories':
    case 'brands':
      return Boolean(p.products_view || p.products_edit);

    case 'inventory':
      return Boolean(p.products_manage_inventory || p.products_view);

    case 'reviews':
      return Boolean(p.reviews_manage || p.products_view);

    case 'orders':
      return Boolean(p.orders_view || p.orders_update_status);

    case 'invoices':
    case 'credit-notes':
      return Boolean(p.orders_view || p.pos_view_sales || p.reports_view);

    case 'shipping':
    case 'shipments':
      return Boolean(p.orders_view || p.orders_update_status);

    case 'payments':
      return Boolean(p.reports_view);

    case 'customers':
    case 'store-credit':
    case 'gift-cards':
      return Boolean(p.customers_view || p.customers_manage || p.orders_manage_returns);

    case 'loyalty':
      return Boolean(p.customers_view || p.settings_view || p.settings_manage);

    case 'inquiries':
    case 'support':
    case 'support_inquiries':
      return Boolean(p.support_view);

    case 'marketing':
    case 'coupons':
    case 'banners':
    case 'website':
    case 'website-control':
      return Boolean(p.marketing_manage || p.settings_view || p.settings_manage);

    case 'analytics':
    case 'reports':
      return Boolean(p.reports_view);

    case 'store-settings':
    case 'settings':
      return Boolean(p.settings_manage || p.settings_view);

    case 'advanced-settings':
      return Boolean(p.staff_manage || p.settings_manage || p.settings_view);

    case 'admin-staff':
      return Boolean(p.staff_manage);

    case 'notifications':
      return p.notifications_view !== false;

    default:
      return false;
  }
}

/**
 * Returns a human-friendly section name for an admin tab.
 */
export function getTabDisplayName(tab: string): string {
  switch (tab) {
    case 'dashboard': return 'Dashboard';
    case 'pos': return 'POS / Counter Billing';
    case 'pos-settings': return 'POS Settings';
    case 'products': return 'Products Catalog';
    case 'categories': return 'Categories';
    case 'brands': return 'Brands';
    case 'inventory': return 'Inventory & Stock';
    case 'reviews': return 'Reviews & Ratings';
    case 'orders': return 'Orders & Returns';
    case 'invoices':
    case 'credit-notes': return 'Invoices & Credit Notes Center';
    case 'shipping':
    case 'shipments': return 'Shipping & Delivery Management';
    case 'payments': return 'Payments & Transactions';
    case 'customers': return 'Customers';
    case 'store-credit': return 'Customer Store Credit';
    case 'gift-cards': return 'Gift Cards Management';
    case 'loyalty': return 'Loyalty & Rewards';
    case 'inquiries':
    case 'support': return 'Support & Inquiries';
    case 'marketing':
    case 'coupons':
    case 'banners': return 'Marketing & Promos';
    case 'website':
    case 'website-control': return 'Website Management';
    case 'analytics':
    case 'reports': return 'Analytics & Reports';
    case 'store-settings': return 'Store Settings';
    case 'advanced-settings': return 'Advanced Settings';
    case 'admin-staff': return 'Admin & Staff Management';
    default: return 'Admin Section';
  }
}

/**
 * Checks if a user has permissions to create or void credit notes.
 */
export function canManageCreditNotes(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.status === 'disabled' || (user as any).active === false) return false;
  if (isUserAdminOrOwner(user)) return true;
  if (user.role === 'staff') {
    const p = user.permissions || DEFAULT_STAFF_PERMISSIONS;
    return Boolean(p.orders_manage_returns || p.pos_manage_returns || p.orders_update_status);
  }
  return false;
}

/**
 * Checks if a user has permissions to manage customer store credit (adjust, view history).
 */
export function canManageStoreCredit(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.status === 'disabled' || (user as any).active === false) return false;
  if (isUserAdminOrOwner(user)) return true;
  if (user.role === 'staff') {
    const p = user.permissions || DEFAULT_STAFF_PERMISSIONS;
    return Boolean(p.customers_view || p.orders_manage_returns || p.pos_manage_returns);
  }
  return false;
}

/**
 * Checks if a user has permissions to manage gift cards (issue, disable, adjust).
 */
export function canManageGiftCards(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.status === 'disabled' || (user as any).active === false) return false;
  if (isUserAdminOrOwner(user)) return true;
  if (user.role === 'staff' || user.role === 'manager') {
    const p = user.permissions || DEFAULT_STAFF_PERMISSIONS;
    return Boolean(p.settings_view || p.customers_view || p.orders_view);
  }
  return false;
}

/**
 * Checks if a user has authority to access the Admin Control Panel or Staff Workspace.
 * True for Owner, Admin, Manager, and Staff members.
 */
export function canAccessAdminPanel(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.status === 'disabled' || (user as any).active === false) return false;
  if (isUserAdminOrOwner(user) || isOwnerUser(user)) return true;
  const role = String(user.role || '').toLowerCase();
  if (role === 'admin' || role === 'manager' || role === 'staff') return true;
  if (user.permissions && Object.values(user.permissions).some(Boolean)) return true;
  return false;
}

export interface StaffRoleInfo {
  title: string;
  badge: string;
  badgeColor: string;
  subtitle: string;
  canAccessAdmin: boolean;
  canAccessPos: boolean;
  canAccessOrders: boolean;
  canAccessProducts: boolean;
  canAccessStaffManage: boolean;
}

/**
 * Returns role display information and module access flags for a user.
 */
export function getStaffRoleInfo(user: UserProfile | null | undefined): StaffRoleInfo {
  if (!user) {
    return {
      title: 'Customer',
      badge: 'Customer',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      subtitle: 'Customer Account',
      canAccessAdmin: false,
      canAccessPos: false,
      canAccessOrders: false,
      canAccessProducts: false,
      canAccessStaffManage: false,
    };
  }

  if (isOwnerUser(user)) {
    return {
      title: 'Primary Store Owner',
      badge: 'Owner',
      badgeColor: 'bg-amber-500 text-white border-amber-600',
      subtitle: 'Full Root Access & Admin Control Panel',
      canAccessAdmin: true,
      canAccessPos: true,
      canAccessOrders: true,
      canAccessProducts: true,
      canAccessStaffManage: true,
    };
  }

  const role = String(user.role || '').toLowerCase();

  if (role === 'admin' || isUserAdminOrOwner(user)) {
    return {
      title: 'Store Administrator',
      badge: 'Admin',
      badgeColor: 'bg-indigo-600 text-white border-indigo-700',
      subtitle: 'Tap to open Admin Control Panel',
      canAccessAdmin: true,
      canAccessPos: true,
      canAccessOrders: true,
      canAccessProducts: true,
      canAccessStaffManage: true,
    };
  }

  if (role === 'manager') {
    const p = user.permissions || MANAGER_PRESET_PERMISSIONS;
    return {
      title: 'Store Manager',
      badge: 'Manager',
      badgeColor: 'bg-blue-600 text-white border-blue-700',
      subtitle: 'Tap to open Store Operations & Management',
      canAccessAdmin: true,
      canAccessPos: Boolean(p.pos_access),
      canAccessOrders: Boolean(p.orders_view || p.orders_update_status),
      canAccessProducts: Boolean(p.products_view || p.products_edit),
      canAccessStaffManage: Boolean(p.staff_manage),
    };
  }

  if (role === 'staff' || (user.permissions && Object.values(user.permissions).some(Boolean))) {
    const p = user.permissions || DEFAULT_STAFF_PERMISSIONS;
    return {
      title: 'Store Staff Member',
      badge: 'Staff',
      badgeColor: 'bg-emerald-600 text-white border-emerald-700',
      subtitle: 'Tap to open Staff Workspace & Counter Terminal',
      canAccessAdmin: true,
      canAccessPos: Boolean(p.pos_access),
      canAccessOrders: Boolean(p.orders_view || p.orders_update_status),
      canAccessProducts: Boolean(p.products_view || p.products_edit),
      canAccessStaffManage: Boolean(p.staff_manage),
    };
  }

  return {
    title: 'Customer',
    badge: 'Customer',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    subtitle: 'Customer Account',
    canAccessAdmin: false,
    canAccessPos: false,
    canAccessOrders: false,
    canAccessProducts: false,
    canAccessStaffManage: false,
  };
}
