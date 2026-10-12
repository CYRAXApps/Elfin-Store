import React, { useState } from 'react';
import { SiteSettings } from '../../context/SiteSettingsContext';
import { Wrench, ShieldAlert, Phone, Mail, Calendar, CheckCircle2, AlertTriangle, Eye, Sparkles } from 'lucide-react';

interface MaintenanceCmsEditorProps {
  formState: SiteSettings;
  setFormState: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

export function MaintenanceCmsEditor({ formState, setFormState }: MaintenanceCmsEditorProps) {
  const [showSimulatedScreen, setShowSimulatedScreen] = useState(false);

  const maint = formState.maintenance || {
    enabled: false,
    title: 'Scheduled System Upgrade',
    message: 'We are upgrading our servers and catalog to bring you a faster shopping experience. We will be back online shortly!',
    estimatedReturn: 'Back online today by 6:00 PM IST',
    contactInfo: formState.general?.storeEmail ? `${formState.general.storeEmail}${formState.general?.phone ? ` | ${formState.general.phone}` : ''}` : '',
    maintenanceImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
    allowAdminBypass: true,
    scheduleStart: '',
    scheduleEnd: '',
    autoActivateSchedule: false,
  };

  const handleUpdate = (field: string, value: any) => {
    // Also keep advanced.maintenanceMode in sync for safety
    const updatedMaint = { ...maint, [field]: value };
    const updatedAdvanced = {
      ...formState.advanced,
      maintenanceMode: field === 'enabled' ? value : formState.advanced?.maintenanceMode,
    };
    const updatedGeneral = {
      ...formState.general,
      storeStatus: (field === 'enabled' && value) ? ('maintenance' as const) : formState.general.storeStatus === 'maintenance' ? ('active' as const) : formState.general.storeStatus,
    };

    setFormState({
      ...formState,
      maintenance: updatedMaint,
      advanced: updatedAdvanced,
      general: updatedGeneral,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Wrench className="text-amber-500" size={20} />
            <span>Storefront Maintenance Mode Control</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Put the store in maintenance mode during catalog imports, system updates, or database maintenance.
          </p>
        </div>

        {/* Master Maintenance Switch */}
        <div className="flex items-center gap-3">
          <label className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer border transition-all ${
            maint.enabled
              ? 'bg-amber-500/10 border-amber-500 text-amber-900 font-black'
              : 'bg-slate-100 border-slate-200 text-slate-700 font-bold'
          }`}>
            <input
              type="checkbox"
              checked={Boolean(maint.enabled)}
              onChange={(e) => handleUpdate('enabled', e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded"
            />
            <span className="text-xs">
              {maint.enabled ? 'MAINTENANCE MODE IS ON' : 'Storefront Is Live & Active'}
            </span>
          </label>
        </div>
      </div>

      {/* Warning Notice if Enabled */}
      {maint.enabled && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
          <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="space-y-1">
            <p className="font-bold text-sm">Customer Access Is Currently Suspended</p>
            <p className="leading-relaxed text-amber-800">
              When Maintenance Mode is published, all public customer traffic will see the maintenance screen below.
              {maint.allowAdminBypass !== false && (
                <span> <strong>Admin bypass is enabled</strong>, so authenticated administrators can continue browsing and testing normally.</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Headline / Title</label>
          <input
            type="text"
            value={maint.title || ''}
            onChange={(e) => handleUpdate('title', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter maintenance headline"
          />
        </div>

        {/* Message */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">Explanatory Message to Customers</label>
          <textarea
            rows={3}
            value={maint.message || ''}
            onChange={(e) => handleUpdate('message', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter explanatory message to customers"
          />
        </div>

        {/* Estimated Return Time */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Return Timeline Notice</label>
          <input
            type="text"
            value={maint.estimatedReturn || ''}
            onChange={(e) => handleUpdate('estimatedReturn', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter estimated return time"
          />
        </div>

        {/* Support Contact Info */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Support Contact Info</label>
          <input
            type="text"
            value={maint.contactInfo || ''}
            onChange={(e) => handleUpdate('contactInfo', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter emergency support contact info"
          />
        </div>

        {/* Image URL */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">Maintenance Banner Image URL (Optional)</label>
          <input
            type="text"
            value={maint.maintenanceImage || ''}
            onChange={(e) => handleUpdate('maintenanceImage', e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter maintenance image URL"
          />
        </div>

        {/* Admin Access Bypass Toggle */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Allow Admin Access Bypass</span>
              <span className="text-[11px] text-slate-500">
                Logged-in admin accounts will see a yellow banner instead of the full blocker screen.
              </span>
            </div>
            <input
              type="checkbox"
              checked={maint.allowAdminBypass !== false}
              onChange={(e) => handleUpdate('allowAdminBypass', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded shrink-0 ml-3"
            />
          </label>
        </div>

        {/* Schedule Support Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Scheduled Maintenance Window</span>
              <span className="text-[11px] text-slate-500">Automatically activate during set datetime range</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(maint.autoActivateSchedule)}
              onChange={(e) => handleUpdate('autoActivateSchedule', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded shrink-0 ml-3"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Start Time</label>
              <input
                type="datetime-local"
                value={maint.scheduleStart || ''}
                onChange={(e) => handleUpdate('scheduleStart', e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">End Time</label>
              <input
                type="datetime-local"
                value={maint.scheduleEnd || ''}
                onChange={(e) => handleUpdate('scheduleEnd', e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Simulation Card */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Eye size={14} className="text-blue-600" /> Customer-Facing Maintenance Screen Preview
          </span>
          <button
            type="button"
            onClick={() => setShowSimulatedScreen(!showSimulatedScreen)}
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            {showSimulatedScreen ? 'Collapse Preview' : 'Expand Full Preview'}
          </button>
        </div>

        <div className="p-8 bg-slate-950 text-white rounded-3xl border border-slate-800 text-center shadow-xl max-w-xl mx-auto">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench size={28} />
          </div>

          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
            {maint.estimatedReturn || 'Back Online Shortly'}
          </span>

          <h3 className="text-xl font-black mt-3 mb-2">{maint.title || 'Under Scheduled Maintenance'}</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            {maint.message || 'We are currently updating our systems. Please check back soon.'}
          </p>

          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-left text-xs space-y-2">
            <p className="font-bold text-slate-300">Need urgent assistance?</p>
            <p className="text-slate-400 text-[11px]">{maint.contactInfo || 'Not configured'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
