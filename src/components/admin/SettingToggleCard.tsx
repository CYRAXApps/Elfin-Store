import React, { useState } from 'react';
import { Check, X, Loader2, Edit3 } from 'lucide-react';

export interface SettingToggleCardProps {
  id: string;
  name: string;
  explanation: string;
  enabled: boolean;
  enabledLabel?: string;
  disabledLabel?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  onToggle: (newVal: boolean) => Promise<boolean | void> | boolean | void;
  // Optional expandable configuration
  hasCustomConfig?: boolean;
  onSaveConfig?: () => Promise<boolean | void> | boolean | void;
  onCancelConfig?: () => void;
  children?: React.ReactNode;
}

export function SettingToggleCard({
  id,
  name,
  explanation,
  enabled,
  enabledLabel = 'Enabled',
  disabledLabel = 'Disabled',
  icon: Icon,
  onToggle,
  hasCustomConfig = false,
  onSaveConfig,
  onCancelConfig,
  children,
}: SettingToggleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleToggleClick = async () => {
    setToggling(true);
    setError('');
    setSuccess('');
    try {
      const nextVal = !enabled;
      const res = await onToggle(nextVal);
      if (res !== false) {
        setSuccess(`${name} turned ${nextVal ? 'ON' : 'OFF'}!`);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update setting.');
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async () => {
    if (!onSaveConfig) return;
    setSaving(true);
    setError('');
    try {
      const res = await onSaveConfig();
      if (res !== false) {
        setSuccess(`${name} settings updated successfully!`);
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancelConfig) onCancelConfig();
    setIsEditing(false);
    setError('');
  };

  return (
    <div
      id={`toggle-card-${id}`}
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
        isEditing
          ? 'bg-blue-50/20 border-blue-300 shadow-sm'
          : enabled
          ? 'bg-white border-slate-200 hover:border-slate-300'
          : 'bg-slate-50/50 border-slate-200 opacity-90'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Header & Description */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {Icon && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                enabled
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              <Icon size={18} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">{name}</h3>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                  enabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {enabled ? enabledLabel : disabledLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>

        {/* Current status toggle switch & optional configure button */}
        <div className="flex items-center gap-3 sm:self-center justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 shrink-0">
          <div className="text-xs text-right hidden sm:block">
            <span className="text-slate-400 text-[11px]">Current: </span>
            <span className={`font-semibold ${enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
              {enabled ? enabledLabel : disabledLabel}
            </span>
          </div>

          {/* Toggle Switch */}
          <button
            id={`toggle-btn-${id}`}
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggleClick}
            disabled={toggling}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>

          {/* Optional Configure / Edit button */}
          {hasCustomConfig && children && !isEditing && (
            <button
              id={`config-btn-${id}`}
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Configure</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Configuration */}
      {isEditing && children && (
        <div className="mt-4 pt-4 border-t border-blue-100 space-y-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
            {children}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Details</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {success && (
        <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium animate-fadeIn">
          <Check size={15} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-medium animate-fadeIn">
          <X size={15} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
