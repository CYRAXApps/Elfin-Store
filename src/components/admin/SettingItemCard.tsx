import React, { useState } from 'react';
import { Check, X, Edit3, Loader2 } from 'lucide-react';

export interface SettingItemCardProps {
  id: string;
  name: string;
  explanation: string;
  currentDisplay: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  badgeColor?: 'emerald' | 'blue' | 'amber' | 'slate' | 'rose';
  isEdited?: boolean;
  defaultEditing?: boolean;
  onSave: () => Promise<boolean | void> | boolean | void;
  onCancel?: () => void;
  children: React.ReactNode;
  extraActions?: React.ReactNode;
}

export function SettingItemCard({
  id,
  name,
  explanation,
  currentDisplay,
  icon: Icon,
  badge,
  badgeColor = 'slate',
  isEdited = false,
  defaultEditing = false,
  onSave,
  onCancel,
  children,
  extraActions,
}: SettingItemCardProps) {
  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const badgeStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const result = await onSave();
      if (result !== false) {
        setSuccess(`${name} saved successfully!`);
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setIsEditing(false);
    setError('');
  };

  return (
    <div
      id={`setting-card-${id}`}
      className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
        isEditing
          ? 'bg-blue-50/20 border-blue-300 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Header & Description */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={18} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">{name}</h3>
              {badge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeStyles[badgeColor]}`}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>

        {/* Current Value Display & Edit Button (when not editing) */}
        {!isEditing && (
          <div className="flex items-center gap-3 sm:self-center justify-between sm:justify-end border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
            <div className="text-xs text-right max-w-xs truncate">
              <span className="text-slate-400 mr-1 text-[11px] block sm:inline">Current:</span>
              <span className="font-semibold text-slate-800">{currentDisplay}</span>
            </div>
            <button
              id={`edit-btn-${id}`}
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
              title={`Edit ${name}`}
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Mode Controls */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-blue-100 space-y-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
            {children}
          </div>

          {/* Action buttons: Save & Cancel */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Current value: </span>
              <span className="font-medium text-slate-700">{currentDisplay}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id={`cancel-btn-${id}`}
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
              <button
                id={`save-btn-${id}`}
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 shadow-sm transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra actions if any */}
      {extraActions && <div className="mt-3">{extraActions}</div>}

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
