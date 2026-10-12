import React, { useState } from 'react';
import { Settings, Building2, MapPin, Phone, Mail, UserCheck, ShieldCheck, Lock, Save, CheckCircle2, AlertCircle, Info, Store } from 'lucide-react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';

export function PartnerSettings() {
  const { partnerUser, partnerStore, verifyPartnerSession } = usePartnerAuth();

  const [phone, setPhone] = useState<string>(partnerStore?.phone || '');
  const [email, setEmail] = useState<string>(partnerStore?.email || '');
  const [address, setAddress] = useState<string>(partnerStore?.address || '');
  const [city, setCity] = useState<string>(partnerStore?.city || '');
  const [state, setState] = useState<string>(partnerStore?.state || '');
  const [pincode, setPincode] = useState<string>(partnerStore?.pincode || '');
  const [description, setDescription] = useState<string>(partnerStore?.description || '');

  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!partnerStore || !partnerUser) return null;

  const isEditable = partnerUser.role === 'PARTNER_OWNER' || partnerUser.role === 'PARTNER_MANAGER';

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/partner/store/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-uid': partnerUser.uid
        },
        body: JSON.stringify({
          phone,
          email,
          address,
          city,
          state,
          pincode,
          description
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Store profile details saved successfully.' });
        await verifyPartnerSession(partnerUser.uid);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save store profile.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Network error while saving store profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Settings size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{partnerStore.storeName} Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Store contact details, location, fulfillment parameters, and operational metadata.
          </p>
        </div>

        <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 self-start sm:self-auto">
          ID: {partnerStore.storeId}
        </span>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editable Store Profile Form (2 Cols) */}
        <form onSubmit={handleSaveStore} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" /> Store Information & Address
            </h2>
            {!isEditable && (
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                View Only (Manager/Owner Required)
              </span>
            )}
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Legal Name</label>
                <input
                  type="text"
                  disabled
                  value={partnerStore.storeName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Store name changes require platform admin approval.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Store ID</label>
                <input
                  type="text"
                  disabled
                  value={partnerStore.storeId}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-500 cursor-not-allowed text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Contact Phone</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    disabled={!isEditable}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Contact Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    disabled={!isEditable}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store@electrostore.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Dispatch / Pickup Address</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <textarea
                  rows={2}
                  disabled={!isEditable}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot No. 42, Electronics Hub, Tech Park"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="400001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Store Description / Notice</label>
              <textarea
                rows={2}
                disabled={!isEditable}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Official ElectroStore partner hub for regional fulfillment."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white text-xs"
              />
            </div>
          </div>

          {isEditable && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'Saving Profile...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </form>

        {/* Store Security & Access Card (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Partner Authorization</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Role</span>
                <p className="font-extrabold text-slate-900 text-xs">{partnerUser.role}</p>
                <p className="text-[10px] text-slate-400">Authenticated user: {partnerUser.displayName || 'Partner'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status & Approval</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-900 text-xs">{partnerStore.status}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 font-mono text-[11px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Firebase Auth UID</span>
                <p className="font-bold text-slate-700 truncate select-all">{partnerUser.uid}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
