import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  Phone, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  Lock, 
  Unlock, 
  Shield, 
  UserCheck, 
  UserX,
  Check
} from 'lucide-react';
import { useAuth, PRIMARY_OWNER_EMAIL, isOwnerUser } from '../../context/AuthContext';
import { StaffMember, StaffPermissions } from '../../types';
import { 
  FULL_ADMIN_PERMISSIONS, 
  MANAGER_PRESET_PERMISSIONS, 
  STAFF_PRESET_PERMISSIONS, 
  DEFAULT_STAFF_PERMISSIONS,
  PERMISSION_CATEGORIES
} from '../../utils/staffPermissions';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { CountryCodeSelector } from '../../components/CountryCodeSelector';
import { POPULAR_COUNTRY_CODES, CountryDialCode } from '../../data/countryDialCodes';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const AdminStaff: React.FC = () => {
  const { user: currentUser, getIdToken } = useAuth();
  const { settings } = useSiteSettings();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'staff'>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StaffMember | null>(null);

  // Country code state for phone typing card
  const [selectedCountry, setSelectedCountry] = useState<CountryDialCode>(POPULAR_COUNTRY_CODES[0]);
  const [phoneDigits, setPhoneDigits] = useState<string>('');

  // Form state
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'manager' | 'staff';
    status: 'active' | 'disabled';
    permissions: StaffPermissions;
    notes: string;
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    status: 'active',
    permissions: { ...STAFF_PRESET_PERMISSIONS },
    notes: ''
  });

  // Fetch staff list from backend API
  const fetchStaffList = async () => {
    try {
      setRefreshing(true);
      const idToken = await getIdToken();
      const res = await fetch('/api/admin/staff', {
        headers: {
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Deduplicate owner accounts to only the canonical owner
          const deduped = data.filter((u: any, idx: number, arr: any[]) => {
            const isOwner = isOwnerUser(u);
            if (isOwner) {
              return u.id === 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1' || arr.findIndex(x => isOwnerUser(x)) === idx;
            }
            return true;
          });
          setStaffList(deduped);
        }
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffList();

    // Safety timeout: Never leave loading spinner hanging indefinitely
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    // Listen to real-time updates from Firestore users collection
    try {
      const q = collection(db, 'users');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLoading(false);
        if (!snapshot.empty) {
          const liveUsers = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as any))
            .filter((u: any) => {
              // Explicitly exclude purged demo/test accounts
              if (
                u.id === 'usr_staff_cashier' || 
                u.id === 'usr_staff_orders' ||
                u.email === 'cashier.staff@electrostore.com' ||
                u.email === 'orders.staff@electrostore.com' ||
                u.name === 'Rahul Sharma' ||
                u.name === 'Priya Patel'
              ) {
                return false;
              }

              return (
                isOwnerUser(u) ||
                u.role === 'owner' ||
                u.isPrimaryOwner === true ||
                u.role === 'admin' || 
                u.role === 'manager' || 
                u.role === 'staff' || 
                (u.email && u.email.toLowerCase().trim() === PRIMARY_OWNER_EMAIL) ||
                Boolean(u.permissions && Object.keys(u.permissions).length > 0)
              );
            });

          if (liveUsers.length > 0) {
            // Deduplicate to guarantee only one Primary Owner row
            const deduped = liveUsers.filter((u: any, idx: number, arr: any[]) => {
              const isOwner = isOwnerUser(u);
              if (isOwner) {
                return u.id === 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1' || arr.findIndex(x => isOwnerUser(x)) === idx;
              }
              return true;
            });
            setStaffList(deduped);
          }
        }
      }, (err) => {
        console.warn('Firestore staff subscription notice:', err);
        setLoading(false);
      });

      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (e) {
      console.warn('Realtime fallback:', e);
      setLoading(false);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Open Add Staff Modal
  const openAddModal = () => {
    setEditingStaff(null);
    setSelectedCountry(POPULAR_COUNTRY_CODES[0]);
    setPhoneDigits('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      status: 'active',
      permissions: { ...STAFF_PRESET_PERMISSIONS },
      notes: ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormModalOpen(true);
  };

  // Open Edit Staff Modal
  const openEditModal = (member: StaffMember) => {
    if (isOwnerUser(member)) {
      return;
    }
    setEditingStaff(member);
    const existingRole = (member.role || 'staff') as 'admin' | 'manager' | 'staff';
    let defaultPerms = STAFF_PRESET_PERMISSIONS;
    if (existingRole === 'admin') defaultPerms = FULL_ADMIN_PERMISSIONS;
    else if (existingRole === 'manager') defaultPerms = MANAGER_PRESET_PERMISSIONS;

    const existingPermissions = { ...defaultPerms, ...(member.permissions || {}) };

    const rawPhone = (member.phoneNumber || member.phone || '').trim();
    let matchedCountry = POPULAR_COUNTRY_CODES[0];
    let digits = rawPhone;
    if (rawPhone.startsWith('+')) {
      for (const c of POPULAR_COUNTRY_CODES) {
        if (rawPhone.startsWith(c.dialCode)) {
          matchedCountry = c;
          digits = rawPhone.slice(c.dialCode.length).trim();
          break;
        }
      }
    } else if (/^\d{10}$/.test(rawPhone)) {
      matchedCountry = POPULAR_COUNTRY_CODES[0]; // India (+91)
      digits = rawPhone;
    }
    setSelectedCountry(matchedCountry);
    setPhoneDigits(digits.replace(/\D/g, ''));

    setFormData({
      name: member.displayName || member.name || '',
      email: member.email || '',
      phone: member.phoneNumber || member.phone || '',
      role: existingRole,
      status: member.status || 'active',
      permissions: {
        pos_access: Boolean(existingPermissions.pos_access),
        pos_view_sales: Boolean(existingPermissions.pos_view_sales),
        pos_manage_returns: Boolean(existingPermissions.pos_manage_returns),
        orders_view: Boolean(existingPermissions.orders_view),
        orders_update_status: Boolean(existingPermissions.orders_update_status),
        orders_manage_returns: Boolean(existingPermissions.orders_manage_returns),
        products_view: Boolean(existingPermissions.products_view),
        products_edit: Boolean(existingPermissions.products_edit),
        products_manage_inventory: Boolean(existingPermissions.products_manage_inventory),
        products_delete: Boolean(existingPermissions.products_delete),
        customers_view: Boolean(existingPermissions.customers_view),
        customers_manage: Boolean(existingPermissions.customers_manage),
        marketing_manage: Boolean(existingPermissions.marketing_manage),
        reviews_manage: Boolean(existingPermissions.reviews_manage),
        support_view: Boolean(existingPermissions.support_view),
        support_manage: Boolean(existingPermissions.support_manage),
        reports_view: Boolean(existingPermissions.reports_view),
        settings_view: Boolean(existingPermissions.settings_view || existingPermissions.settings_manage),
        settings_manage: Boolean(existingPermissions.settings_manage || existingPermissions.settings_view),
        staff_manage: Boolean(existingPermissions.staff_manage),
        notifications_view: existingPermissions.notifications_view !== false,
        notifications_manage: Boolean(existingPermissions.notifications_manage)
      },
      notes: member.notes || ''
    });
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormModalOpen(true);
  };

  // Open Details Modal
  const openDetailsModal = (member: StaffMember) => {
    setViewingStaff(member);
  };

  // Handle Role change with automatic preset application
  const handleRoleChange = (newRole: 'admin' | 'manager' | 'staff') => {
    let newPermissions = { ...formData.permissions };
    if (newRole === 'admin') {
      newPermissions = { ...FULL_ADMIN_PERMISSIONS };
    } else if (newRole === 'manager') {
      newPermissions = { ...MANAGER_PRESET_PERMISSIONS };
    } else if (newRole === 'staff') {
      newPermissions = { ...STAFF_PRESET_PERMISSIONS };
    }

    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: newPermissions
    }));
  };

  // Apply explicit preset
  const applyPreset = (presetType: 'admin' | 'manager' | 'staff') => {
    if (presetType === 'admin') {
      setFormData(prev => ({
        ...prev,
        role: 'admin',
        permissions: { ...FULL_ADMIN_PERMISSIONS }
      }));
    } else if (presetType === 'manager') {
      setFormData(prev => ({
        ...prev,
        role: 'manager',
        permissions: { ...MANAGER_PRESET_PERMISSIONS }
      }));
    } else if (presetType === 'staff') {
      setFormData(prev => ({
        ...prev,
        role: 'staff',
        permissions: { ...STAFF_PRESET_PERMISSIONS }
      }));
    }
  };

  // Toggle individual permission checkbox
  const togglePermission = (key: keyof StaffPermissions) => {
    setFormData(prev => {
      const updated = {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      };
      // Keep settings_view and settings_manage in sync for store settings
      if (key === 'settings_manage') {
        updated.settings_view = updated.settings_manage;
      }
      return {
        ...prev,
        permissions: updated
      };
    });
  };

  // Toggle Staff status (Activate / Deactivate)
  const handleToggleStatus = async (member: StaffMember) => {
    const isOwner = isOwnerUser(member);
    if (isOwner) {
      alert('The primary store owner account cannot be deactivated.');
      return;
    }

    const newStatus = member.status === 'disabled' ? 'active' : 'disabled';
    setActionLoadingId(member.id);

    try {
      const idToken = await getIdToken();
      const res = await fetch(`/api/admin/staff/${member.id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({
          status: newStatus,
          performedBy: currentUser?.displayName || currentUser?.email || 'Owner Admin'
        })
      });

      if (res.ok) {
        setStaffList(prev => prev.map(s => s.id === member.id ? { ...s, status: newStatus } : s));
        if (viewingStaff && viewingStaff.id === member.id) {
          setViewingStaff(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update account status.');
      }
    } catch (err) {
      alert('Network error updating account status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save Staff (Add or Edit)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanDigits = phoneDigits.trim().replace(/\D/g, '');
    const formattedPhone = cleanDigits ? `${selectedCountry.dialCode}${cleanDigits}` : '';

    if (!cleanName) {
      setErrorMsg('Please enter the full name.');
      return;
    }

    if (!cleanEmail && !cleanDigits) {
      setErrorMsg('Please enter either a mobile number or an email address.');
      return;
    }

    setSaving(true);
    try {
      const url = editingStaff ? `/api/admin/staff/${editingStaff.id}` : '/api/admin/staff';
      const method = editingStaff ? 'PUT' : 'POST';

      const permissionsPayload = formData.role === 'admin' 
        ? FULL_ADMIN_PERMISSIONS 
        : {
            ...formData.permissions,
            settings_view: Boolean(formData.permissions.settings_manage || formData.permissions.settings_view)
          };

      const payload = {
        name: cleanName,
        displayName: cleanName,
        email: cleanEmail,
        phone: formattedPhone,
        phoneNumber: formattedPhone,
        role: formData.role,
        status: formData.status,
        permissions: permissionsPayload,
        notes: formData.notes.trim(),
        performedBy: currentUser?.displayName || currentUser?.email || 'Owner Admin'
      };

      const idToken = await getIdToken();
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save staff member.');
      }

      if (result.staff) {
        setStaffList(prev => {
          const idx = prev.findIndex(s => s.id === result.staff.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...result.staff };
            return updated;
          }
          return [result.staff, ...prev];
        });
      }

      setSuccessMsg(editingStaff ? 'Staff updated successfully!' : 'Staff member added successfully!');
      setTimeout(() => {
        setIsFormModalOpen(false);
        fetchStaffList();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Staff member
  const handleDeleteStaff = async () => {
    if (!deleteConfirmStaff) return;

    const isOwner = isOwnerUser(deleteConfirmStaff);
    if (isOwner) {
      alert('The primary store owner account cannot be removed.');
      setDeleteConfirmStaff(null);
      return;
    }

    try {
      const idToken = await getIdToken();
      const res = await fetch(`/api/admin/staff/${deleteConfirmStaff.id}?performedBy=${encodeURIComponent(currentUser?.displayName || 'Owner')}`, {
        method: 'DELETE',
        headers: {
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        }
      });

      if (res.ok) {
        setStaffList(prev => prev.filter(s => s.id !== deleteConfirmStaff.id));
        if (viewingStaff && viewingStaff.id === deleteConfirmStaff.id) {
          setViewingStaff(null);
        }
        setDeleteConfirmStaff(null);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to delete staff member.');
      }
    } catch (err) {
      alert('Network error deleting staff member.');
    }
  };

  // Filter staff by search and role
  const filteredStaff = useMemo(() => {
    return staffList.filter(member => {
      const q = searchQuery.toLowerCase().trim();
      const name = (member.displayName || member.name || '').toLowerCase();
      const email = (member.email || '').toLowerCase();
      const phone = (member.phoneNumber || member.phone || '').toLowerCase();
      const role = (member.role || 'staff').toLowerCase();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || phone.includes(q);
      if (!matchesSearch) return false;

      if (roleFilter !== 'all') {
        if (roleFilter === 'admin') {
          if (role !== 'admin' && role !== 'owner' && !isOwnerUser(member)) return false;
        } else if (roleFilter === 'manager') {
          if (role !== 'manager' || isOwnerUser(member)) return false;
        } else if (roleFilter === 'staff') {
          if (role !== 'staff' || isOwnerUser(member)) return false;
        }
      }

      return true;
    });
  }, [staffList, searchQuery, roleFilter]);

  // Format date helper
  const formatDate = (dateVal?: any) => {
    if (!dateVal) return 'Never';
    try {
      const d = typeof dateVal === 'object' && dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(d.getTime())) return 'Never';
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Never';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header (Existing Admin Panel Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin & Staff</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage administrators and staff members and control what they can access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStaffList}
            disabled={refreshing}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refresh Staff List"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Add Staff
          </button>
        </div>
      </div>

      {/* 2. Compact Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, mobile number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[38px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          {(['all', 'admin', 'manager', 'staff'] as const).map((r) => {
            const labels = {
              all: `All (${staffList.length})`,
              admin: `Admin (${staffList.filter(s => s.role === 'admin' || s.role === 'owner' || isOwnerUser(s)).length})`,
              manager: `Manager (${staffList.filter(s => s.role === 'manager' && !isOwnerUser(s)).length})`,
              staff: `Staff (${staffList.filter(s => s.role === 'staff' && !isOwnerUser(s)).length})`
            };

            const isSelected = roleFilter === r;
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer min-h-[36px] ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Staff List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Staff Accounts...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No staff members found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No accounts matched your search criteria.' : 'Click "+ Add Staff" to invite or configure team members.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
                className="mt-3 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Mobile / Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Activity</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStaff.map((member) => {
                  const isOwner = isOwnerUser(member);
                  const isActive = (member.status || 'active') === 'active';
                  const effectiveRole = isOwner ? 'admin' : (member.role || 'staff');

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            effectiveRole === 'admin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : effectiveRole === 'manager'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {(member.displayName || member.name || member.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span 
                                onClick={() => openDetailsModal(member)}
                                className="font-bold text-slate-900 text-xs hover:text-blue-600 cursor-pointer truncate"
                              >
                                {member.displayName || member.name || 'Staff User'}
                              </span>
                              {isOwner && (
                                <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-100 text-amber-800 rounded border border-amber-200 uppercase shrink-0">
                                  Owner
                                </span>
                              )}
                            </div>
                            {member.notes && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{member.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mobile / Email */}
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          {(member.phoneNumber || member.phone) && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-800">{member.phoneNumber || member.phone}</span>
                            </span>
                          )}
                          {member.email && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{member.email}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {effectiveRole === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            Admin
                          </span>
                        ) : effectiveRole === 'manager' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Shield className="w-3 h-3 text-indigo-600" />
                            Manager
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Staff
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatDate(member.lastActivity || member.lastLoginAt)}</span>
                        </div>
                      </td>

                      {/* Actions: View, Edit, Activate/Deactivate, Remove */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <button
                            onClick={() => openDetailsModal(member)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Staff Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isOwner ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 select-none"
                              title="Primary Store Owner account is permanent & immutable"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                              Primary Owner
                            </span>
                          ) : (
                            <>
                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(member)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Staff"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Activate / Deactivate */}
                              <button
                                onClick={() => handleToggleStatus(member)}
                                disabled={actionLoadingId === member.id}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isActive 
                                    ? 'text-amber-600 hover:bg-amber-50' 
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={isActive ? 'Deactivate Staff' : 'Activate Staff'}
                              >
                                {isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>

                              {/* Remove */}
                              <button
                                onClick={() => setDeleteConfirmStaff(member)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Remove Staff"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. ADD / EDIT STAFF MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingStaff ? 'Edit Staff' : 'Add Staff'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure basic information, role, and section permissions.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStaff} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Basic Information
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter team member's full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1 min-h-[38px]">
                      <CountryCodeSelector
                        selectedCountry={selectedCountry}
                        onSelectCountry={(c) => setSelectedCountry(c)}
                        disabled={!settings.general?.enableCountryCodeSelector}
                        buttonClassName="bg-white border-slate-200 py-1 px-2 text-[11px]"
                      />
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder={selectedCountry.format || 'Enter phone number'}
                        value={phoneDigits}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= (selectedCountry.maxDigits || 15)) {
                            setPhoneDigits(val);
                          }
                        }}
                        className="w-full px-2.5 py-1 text-xs text-slate-900 bg-transparent outline-none placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="name@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px] cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notes / Branch (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Optional notes or department"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[38px]"
                    />
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Role
                  </h3>
                  <span className="text-[11px] text-slate-400">Select preset role</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer min-h-[40px] ${
                      formData.role === 'admin'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('manager')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer min-h-[40px] ${
                      formData.role === 'manager'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleChange('staff')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer min-h-[40px] ${
                      formData.role === 'staff'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Staff
                  </button>
                </div>

                {/* Preset explanation note */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between gap-2">
                  <span>
                    {formData.role === 'admin' && '👑 Admin: Full access to all modules and store settings.'}
                    {formData.role === 'manager' && '🛡️ Manager: Products + Orders + Customers + POS + Reports.'}
                    {formData.role === 'staff' && '👤 Staff: POS + Orders + Customers.'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => applyPreset(formData.role)}
                      className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Reset Preset
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions (Clean grouped layout) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Permissions
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Customize individual checkboxes below
                  </span>
                </div>

                {formData.role === 'admin' ? (
                  <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-purple-900">Admin Role — Full Access</h4>
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          Administrators have unrestricted access to all store sections, reports, and settings.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {PERMISSION_CATEGORIES.map((category) => (
                      <div key={category.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-xs font-bold text-slate-800 mb-2">
                          {category.name}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {category.permissions.map((perm) => {
                            const checked = Boolean(formData.permissions[perm.key]);
                            return (
                              <label
                                key={perm.key}
                                className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
                                  checked ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:bg-white/60'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermission(perm.key)}
                                  className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 border-slate-300 cursor-pointer"
                                />
                                <span>{perm.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer min-h-[38px]"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingStaff ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. STAFF DETAILS MODAL */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Staff Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Account profile and assigned permissions</p>
              </div>
              <button
                onClick={() => setViewingStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                viewingStaff.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : viewingStaff.role === 'manager'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {(viewingStaff.displayName || viewingStaff.name || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm truncate">
                    {viewingStaff.displayName || viewingStaff.name || 'Staff User'}
                  </h3>
                  {isOwnerUser(viewingStaff) && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-100 text-amber-800 rounded border border-amber-200 uppercase">
                      Owner
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    viewingStaff.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : viewingStaff.role === 'manager'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {viewingStaff.role?.toUpperCase() || 'STAFF'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (viewingStaff.status || 'active') === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {(viewingStaff.status || 'active') === 'active' ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Contact Phone</span>
                <span className="font-semibold text-slate-800">
                  {viewingStaff.phoneNumber || viewingStaff.phone || 'Not provided'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Email Address</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {viewingStaff.email || 'Not provided'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Created Date</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(viewingStaff.createdAt)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Last Activity</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(viewingStaff.lastActivity || viewingStaff.lastLoginAt)}
                </span>
              </div>
            </div>

            {/* Assigned Permissions */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Assigned Permissions
              </span>

              {viewingStaff.role === 'admin' ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>Full access to all store modules and settings.</span>
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {PERMISSION_CATEGORIES.map((cat) => {
                    const granted = cat.permissions.filter(p => viewingStaff.permissions?.[p.key]);
                    return (
                      <div key={cat.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-800 text-[11px]">{cat.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            granted.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {granted.length}/{cat.permissions.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cat.permissions.map((p) => {
                            const isGranted = Boolean(viewingStaff.permissions?.[p.key]);
                            return (
                              <span
                                key={p.key}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  isGranted
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                                    : 'bg-slate-100 text-slate-400 line-through'
                                }`}
                              >
                                {p.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const staff = viewingStaff;
                  setViewingStaff(null);
                  openEditModal(staff);
                }}
                className="px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 min-h-[38px]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Staff
              </button>

              <div className="flex items-center gap-2">
                {!isOwnerUser(viewingStaff) && (
                  <button
                    onClick={() => handleToggleStatus(viewingStaff)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[38px] ${
                      (viewingStaff.status || 'active') === 'active'
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {(viewingStaff.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                )}
                <button
                  onClick={() => setViewingStaff(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[38px]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. REMOVE CONFIRMATION MODAL */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3.5">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Remove Staff Member?</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-slate-900">{deleteConfirmStaff.displayName || deleteConfirmStaff.name}</span>? They will lose all access immediately.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                onClick={() => setDeleteConfirmStaff(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[38px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer min-h-[38px]"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
