import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Edit3, 
  Eye, 
  RefreshCw, 
  UserCheck, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Store,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Copy,
  Check,
  Sparkles,
  User,
  Crown
} from 'lucide-react';
import { IBPStore, StoreStatus, StoreType } from '../../types';
import { useAuth, PRIMARY_OWNER_UID, PRIMARY_OWNER_EMAIL } from '../../context/AuthContext';

export function AdminIBPStores() {
  const { user } = useAuth();
  const [stores, setStores] = useState<IBPStore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [copiedUid, setCopiedUid] = useState<boolean>(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<IBPStore | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAssignOwnerModalOpen, setIsAssignOwnerModalOpen] = useState<boolean>(false);

  // Form states for Assigning Owner
  const [assignForm, setAssignForm] = useState({
    ownerUid: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: ''
  });
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string>('');

  // Form states for Creation
  const [createForm, setCreateForm] = useState({
    storeName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: ''
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');

  // Form states for Editing
  const [editForm, setEditForm] = useState<Partial<IBPStore>>({});
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string>('');

  // Action loading state for quick status toggles
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchStores = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/admin/stores');
      if (res.ok) {
        const data = await res.json();
        if (data.stores && Array.isArray(data.stores)) {
          setStores(data.stores);
        }
      } else {
        console.error('Failed to fetch stores:', res.statusText);
      }
    } catch (err) {
      console.error('Error fetching IBP stores:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Filtered store list
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      const matchesSearch = 
        s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.storeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || s.storeType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [stores, searchQuery, statusFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: stores.length,
      main: stores.filter((s) => s.storeType === 'MAIN_STORE').length,
      partner: stores.filter((s) => s.storeType === 'PARTNER_STORE').length,
      active: stores.filter((s) => s.status === 'ACTIVE').length,
      pending: stores.filter((s) => s.status === 'PENDING_APPROVAL').length,
      suspended: stores.filter((s) => s.status === 'SUSPENDED').length
    };
  }, [stores]);

  // Handle Create Store Submission
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.storeName.trim()) {
      setCreateError('Store name is required.');
      return;
    }

    setIsSubmittingCreate(true);
    setCreateError('');

    try {
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create partner store.');
      }

      // Reset & close
      setCreateForm({
        storeName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        description: ''
      });
      setIsCreateModalOpen(false);
      await fetchStores(true);
    } catch (err: any) {
      setCreateError(err.message || 'An error occurred while creating store.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Edit Store Submission
  const handleEditStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

    setIsSubmittingEdit(true);
    setEditError('');

    try {
      const res = await fetch(`/api/admin/stores/${selectedStore.storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update store.');
      }

      setIsEditModalOpen(false);
      setSelectedStore(null);
      await fetchStores(true);
    } catch (err: any) {
      setEditError(err.message || 'An error occurred while updating store.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Copy UID helper
  const handleCopyUid = (uid: string) => {
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Quick Action: Assign Primary Admin (Ritam Saha) to any store
  const handleQuickAssignPrimaryOwner = async (storeId: string) => {
    setActionLoadingId(storeId);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/assign-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerUid: PRIMARY_OWNER_UID,
          ownerName: 'Ritam Saha',
          ownerEmail: PRIMARY_OWNER_EMAIL,
          ownerPhone: '+91 62977 47957'
        })
      });

      if (res.ok) {
        const data = await res.json();
        await fetchStores(true);
        if (selectedStore && selectedStore.storeId === storeId) {
          setSelectedStore({
            ...selectedStore,
            ownerUid: PRIMARY_OWNER_UID,
            ownerName: 'Ritam Saha',
            ownerEmail: PRIMARY_OWNER_EMAIL,
            ownerPhone: '+91 62977 47957',
            status: 'ACTIVE',
            approvalStatus: true
          });
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to assign primary owner');
      }
    } catch (err) {
      console.error('Error assigning primary owner:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Assign Owner Submission
  const handleAssignOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

    if (!assignForm.ownerUid.trim()) {
      setAssignError('Firebase Auth UID is required.');
      return;
    }

    setIsSubmittingAssign(true);
    setAssignError('');

    try {
      const res = await fetch(`/api/admin/stores/${selectedStore.storeId}/assign-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign owner.');
      }

      setIsAssignOwnerModalOpen(false);
      setSelectedStore(null);
      setAssignForm({ ownerUid: '', ownerName: '', ownerEmail: '', ownerPhone: '' });
      await fetchStores(true);
    } catch (err: any) {
      setAssignError(err.message || 'An error occurred while assigning owner.');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Quick Action: Update Status/Approval
  const handleQuickStatusChange = async (storeId: string, newStatus: StoreStatus, newApproval: boolean) => {
    setActionLoadingId(storeId);
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, approvalStatus: newApproval })
      });

      if (res.ok) {
        await fetchStores(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update store status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: StoreStatus, approved: boolean) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" /> Active
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="text-amber-600" /> Pending Approval
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={12} className="text-rose-600" /> Suspended
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle size={12} className="text-slate-500" /> Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 size={22} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">IBP / Partner Stores</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Independent Business Partners, Store Types, Ownership & Status Approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchStores(true)}
            disabled={refreshing}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Partner Store</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stores</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
            {stats.main} Main • {stats.partner} Partner
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Stores</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</div>
          <div className="text-[11px] font-semibold text-emerald-600/80 mt-0.5">
            Operational Stores
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Approval</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</div>
          <div className="text-[11px] font-semibold text-amber-600/80 mt-0.5">
            Awaiting Admin Review
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Suspended / Inactive</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.suspended}</div>
          <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
            Restricted Access
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search store name, ID, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-500 text-slate-800"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
                <Filter size={12} /> Status:
              </span>
              {['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'INACTIVE'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'PENDING_APPROVAL' ? 'Pending' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Store Types</option>
              <option value="MAIN_STORE">Main Store</option>
              <option value="PARTNER_STORE">Partner Store</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stores List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading IBP Partner Stores...</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="p-12 text-center">
            <Store size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Stores Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Store Info</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Owner (Firebase UID)</th>
                  <th className="py-3.5 px-4">Status & Approval</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredStores.map((s) => (
                  <tr key={s.storeId} className="hover:bg-slate-50/60 transition-colors">
                    {/* Store Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                          s.storeType === 'MAIN_STORE' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {s.storeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{s.storeName}</span>
                            {s.storeId === 'main-store' && (
                              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200">Canonical</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {s.storeId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Store Type */}
                    <td className="py-3.5 px-4">
                      {s.storeType === 'MAIN_STORE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          MAIN STORE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          PARTNER STORE
                        </span>
                      )}
                    </td>

                    {/* Owner Identity */}
                    <td className="py-3.5 px-4">
                      {s.ownerUid ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <UserCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>{s.ownerName || (s.ownerUid === PRIMARY_OWNER_UID ? 'Ritam Saha' : 'Partner Owner')}</span>
                            {(s.ownerUid === PRIMARY_OWNER_UID || s.storeType === 'MAIN_STORE') && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Primary Admin
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]" title={s.ownerUid}>
                            {s.ownerEmail || s.ownerUid}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] italic text-slate-400 font-semibold">
                            Unassigned
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAssignPrimaryOwner(s.storeId)}
                            disabled={actionLoadingId === s.storeId}
                            className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 transition-colors cursor-pointer"
                          >
                            + Link Admin
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Status & Approval */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(s.status, s.approvalStatus)}
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Approval: {s.approvalStatus ? 'Granted' : 'Pending Review'}
                        </span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Approve/Activate for Pending Stores */}
                        {s.status === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatusChange(s.storeId, 'ACTIVE', true)}
                            disabled={actionLoadingId === s.storeId}
                            title="Approve & Activate Store"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            {actionLoadingId === s.storeId ? 'Saving...' : 'Approve'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStore(s);
                            setAssignForm({
                              ownerUid: s.ownerUid || '',
                              ownerName: '',
                              ownerEmail: s.email || '',
                              ownerPhone: s.phone || ''
                            });
                            setIsAssignOwnerModalOpen(true);
                          }}
                          title="Assign or Change Store Owner"
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <UserCheck size={13} />
                          <span>{s.ownerUid ? 'Owner Assigned' : 'Assign Owner'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStore(s);
                            setIsDetailModalOpen(true);
                          }}
                          title="View Store Details"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStore(s);
                            setEditForm({ ...s });
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Store Information"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: CREATE PARTNER STORE */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Partner Store</h3>
                  <p className="text-xs text-slate-500">Register new Independent Business Partner Store A/B</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStore} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Store A, Prime Electronics"
                  value={createForm.storeName}
                  onChange={(e) => setCreateForm({ ...createForm, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="store.partner@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="Commercial Plaza, Suite 101"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    placeholder="400001"
                    value={createForm.pincode}
                    onChange={(e) => setCreateForm({ ...createForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional details about this IBP partner..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-medium flex items-start gap-2">
                <Info size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <span>
                  New partner stores default to <strong>PENDING_APPROVAL</strong> with owner UID unassigned.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmittingCreate ? 'Creating Store...' : 'Create Partner Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: STORE DETAILS */}
      {/* ======================================================== */}
      {isDetailModalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                  selectedStore.storeType === 'MAIN_STORE' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {selectedStore.storeName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    {selectedStore.storeName}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedStore.storeId}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Store Type</span>
                  <span className="font-extrabold text-slate-900 mt-0.5 block">{selectedStore.storeType}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedStore.status, selectedStore.approvalStatus)}</div>
                </div>
              </div>

              {/* Owner Identity & Profile Section */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={16} className="text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Store Owner Identity & Access
                    </span>
                  </div>
                  {selectedStore.ownerUid ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setAssignForm({
                          ownerUid: selectedStore.ownerUid || '',
                          ownerName: selectedStore.ownerName || '',
                          ownerEmail: selectedStore.ownerEmail || selectedStore.email || '',
                          ownerPhone: selectedStore.ownerPhone || selectedStore.phone || ''
                        });
                        setIsAssignOwnerModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Change Owner
                    </button>
                  ) : null}
                </div>

                {selectedStore.ownerUid ? (
                  <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {(selectedStore.ownerName || (selectedStore.ownerUid === PRIMARY_OWNER_UID ? 'Ritam Saha' : 'Owner')).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {selectedStore.ownerName || (selectedStore.ownerUid === PRIMARY_OWNER_UID ? 'Ritam Saha' : 'Store Owner')}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {selectedStore.ownerEmail || (selectedStore.ownerUid === PRIMARY_OWNER_UID ? PRIMARY_OWNER_EMAIL : 'Not configured')}
                          </p>
                        </div>
                      </div>

                      {(selectedStore.ownerUid === PRIMARY_OWNER_UID || selectedStore.storeType === 'MAIN_STORE') ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                          <Crown size={11} className="text-amber-600" /> Primary Admin & Owner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200 shrink-0">
                          Partner Owner
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        <span>{selectedStore.ownerPhone || (selectedStore.ownerUid === PRIMARY_OWNER_UID ? '+91 62977 47957' : selectedStore.phone || 'No phone')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                        <span>Active Partner Role</span>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 font-mono text-[11px] text-slate-700">
                        <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">UID:</span>
                        <span className="truncate select-all">{selectedStore.ownerUid}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyUid(selectedStore.ownerUid!)}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedUid ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        <span>{copiedUid ? 'Copied' : 'Copy UID'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                      <span>No owner account currently assigned to this store.</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAssignPrimaryOwner(selectedStore.storeId)}
                        disabled={actionLoadingId === selectedStore.storeId}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles size={12} />
                        <span>Connect Primary Admin (Ritam Saha)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDetailModalOpen(false);
                          setAssignForm({
                            ownerUid: '',
                            ownerName: '',
                            ownerEmail: selectedStore.email || '',
                            ownerPhone: selectedStore.phone || ''
                          });
                          setIsAssignOwnerModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-[11px] border border-slate-200 cursor-pointer"
                      >
                        Assign Custom Owner UID
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact & Address</span>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span>{selectedStore.phone || 'No phone provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span>{selectedStore.email || 'No email provided'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {[selectedStore.address, selectedStore.city, selectedStore.state, selectedStore.pincode].filter(Boolean).join(', ') || 'No address specified'}
                  </span>
                </div>
              </div>

              {selectedStore.description && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Description</span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-600">
                    {selectedStore.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                <div>Created: {selectedStore.createdAt ? new Date(selectedStore.createdAt).toLocaleString() : 'N/A'}</div>
                <div className="text-right">Updated: {selectedStore.updatedAt ? new Date(selectedStore.updatedAt).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setEditForm({ ...selectedStore });
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Edit Store Information
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EDIT STORE */}
      {/* ======================================================== */}
      {isEditModalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Store Configuration</h3>
                  <p className="text-xs text-slate-500">ID: {selectedStore.storeId}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditStore} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
                <input
                  type="text"
                  required
                  value={editForm.storeName || ''}
                  onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editForm.status || 'PENDING_APPROVAL'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as StoreStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approval State</label>
                  <select
                    value={editForm.approvalStatus ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, approvalStatus: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-600"
                  >
                    <option value="true">Approved (True)</option>
                    <option value="false">Not Approved (False)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Identity (Firebase Auth UID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ZudeiMJXXaUFxFN6sV8ErPplZ7w1"
                  value={editForm.ownerUid || ''}
                  onChange={(e) => setEditForm({ ...editForm, ownerUid: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.state || ''}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={editForm.pincode || ''}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ASSIGN OWNER TO STORE */}
      {/* ======================================================== */}
      {isAssignOwnerModalOpen && selectedStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Assign Partner Owner</h3>
                  <p className="text-xs text-slate-500">Store: {selectedStore.storeName} ({selectedStore.storeId})</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAssignOwnerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {assignError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignOwner} className="space-y-3.5">
              {/* Quick Fill Primary Owner Preset */}
              <div className="p-3 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/90 rounded-xl flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Crown size={13} className="text-amber-600 shrink-0" />
                    <span>Primary Admin: Ritam Saha</span>
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono truncate">ritamsaha0000@gmail.com</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAssignForm({
                      ownerUid: PRIMARY_OWNER_UID,
                      ownerName: 'Ritam Saha',
                      ownerEmail: PRIMARY_OWNER_EMAIL,
                      ownerPhone: '+91 62977 47957'
                    });
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 shadow-xs flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>Fill Admin</span>
                </button>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-[11px] text-indigo-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-indigo-600 shrink-0" />
                  <span>Permanent Partner Identity: Firebase Auth UID</span>
                </div>
                <p className="text-indigo-800/80">
                  Assigning a partner owner connects this store to an authenticated Firebase Auth user UID. This automatically grants <code className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-indigo-900">PARTNER_OWNER</code> status and activates the store.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Owner Firebase Auth UID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZudeiMJXXaUFxFN6sV8ErPplZ7w1 or partner-owner-a-uid"
                  value={assignForm.ownerUid}
                  onChange={(e) => setAssignForm({ ...assignForm, ownerUid: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Partner Owner A"
                  value={assignForm.ownerName}
                  onChange={(e) => setAssignForm({ ...assignForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Owner Email</label>
                  <input
                    type="email"
                    placeholder="owner@example.com"
                    value={assignForm.ownerEmail}
                    onChange={(e) => setAssignForm({ ...assignForm, ownerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Owner Phone</label>
                  <input
                    type="text"
                    placeholder="+91 Mobile Number"
                    value={assignForm.ownerPhone}
                    onChange={(e) => setAssignForm({ ...assignForm, ownerPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignOwnerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmittingAssign ? 'Assigning Owner...' : 'Assign Owner & Activate Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
