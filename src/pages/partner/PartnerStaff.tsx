import React, { useState, useEffect } from 'react';
import { Users, Plus, ShieldCheck, UserCheck, RefreshCw, AlertTriangle, X, Mail, Phone, Lock, CheckCircle2, User } from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';

export function PartnerStaff() {
  const { partnerUser, partnerStore } = usePartnerAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Add Staff Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addForm, setAddForm] = useState({
    targetUid: '',
    displayName: '',
    email: '',
    phone: '',
    role: 'PARTNER_STAFF' as 'PARTNER_MANAGER' | 'PARTNER_STAFF'
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchStaff = async (isManual = false) => {
    if (!partnerUser?.uid) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch('/api/partner/staff', {
        headers: { 'x-partner-uid': partnerUser.uid }
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error('Failed to fetch store staff:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [partnerUser?.uid]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.targetUid.trim()) {
      setErrorMsg('Target Firebase Auth UID is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/partner/staff/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-uid': partnerUser?.uid || ''
        },
        body: JSON.stringify(addForm)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add staff member.');
      }

      setIsAddModalOpen(false);
      setAddForm({ targetUid: '', displayName: '', email: '', phone: '', role: 'PARTNER_STAFF' });
      await fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while adding staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (partnerUser?.role !== 'PARTNER_OWNER' && partnerUser?.role !== 'PARTNER_MANAGER') {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center">
        <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2" />
        <h2 className="text-base font-bold text-slate-900">Store Owner Permission Required</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only Store Owners (<code className="text-amber-700 font-mono">PARTNER_OWNER</code>) can manage store staff members for {partnerStore?.storeName}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{partnerStore?.storeName} Staff & Team</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage authorized store staff, assign roles (Manager / Staff), and control operational access for store <code className="text-indigo-600 font-mono font-bold">"{partnerStore?.storeId}"</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchStaff(true)}
            disabled={refreshing}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
            title="Refresh staff list"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
          
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Staff Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-medium text-slate-700">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Firebase Auth UID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.length > 0 ? (
                staffList.map((st) => (
                  <tr key={st.uid} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {(st.displayName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{st.displayName || 'Store Staff'}</p>
                          <p className="text-[11px] text-slate-400">{st.email || 'No email recorded'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        st.role === 'PARTNER_OWNER'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : st.role === 'PARTNER_MANAGER'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {st.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone size={12} className="text-slate-400" />
                        <span>{st.phone || 'No phone'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 select-all">
                      {st.uid}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 text-xs font-semibold">
                    No staff members registered for this store yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal (Admin Style) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Store Staff</h3>
                  <p className="text-xs text-slate-500">Authorize team member for {partnerStore?.storeName}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Staff Firebase Auth UID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Firebase Auth user UID"
                  value={addForm.targetUid}
                  onChange={(e) => setAddForm({ ...addForm, targetUid: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={addForm.displayName}
                  onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="staff@store.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role & Permissions</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-600 cursor-pointer"
                >
                  <option value="PARTNER_STAFF">PARTNER_STAFF (Orders & Inventory)</option>
                  <option value="PARTNER_MANAGER">PARTNER_MANAGER (Catalog, Staff & Reports)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding Staff...' : 'Add Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
