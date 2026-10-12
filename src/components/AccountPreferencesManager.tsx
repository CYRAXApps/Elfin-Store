import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Bell, 
  Package, 
  MessageSquare, 
  Tag, 
  CheckCircle2, 
  Sliders
} from 'lucide-react';

interface PreferencesState {
  orderUpdates: boolean;
  smsDeliveryUpdates: boolean;
  promotions: boolean;
  securityAlerts: boolean;
}

const DEFAULT_PREFERENCES: PreferencesState = {
  orderUpdates: true,
  smsDeliveryUpdates: true,
  promotions: false,
  securityAlerts: true
};

interface AccountPreferencesManagerProps {
  showHeader?: boolean;
}

export function AccountPreferencesManager({ showHeader = false }: AccountPreferencesManagerProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadPreferences = async () => {
      try {
        const prefRef = doc(db, 'users', user.uid, 'settings', 'account_preferences');
        const snap = await getDoc(prefRef);
        if (snap.exists()) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...snap.data()
          });
        }
      } catch (err) {
        console.warn('Could not load preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [user]);

  if (!user) return null;

  const handleToggle = async (key: keyof PreferencesState) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(updated);
    setSavingKey(key);
    setSavedSuccess(false);

    try {
      const prefRef = doc(db, 'users', user.uid, 'settings', 'account_preferences');
      await setDoc(prefRef, {
        ...updated,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save preference:', err);
      // Revert if failed
      setPreferences(preferences);
    } finally {
      setSavingKey(null);
    }
  };

  const options = [
    {
      key: 'orderUpdates' as const,
      icon: <Package size={16} className="text-blue-600" />,
      title: 'Order Status & Tracking Updates',
      desc: 'Receive instant email notifications when orders are placed, packed, shipped, and delivered.'
    },
    {
      key: 'smsDeliveryUpdates' as const,
      icon: <MessageSquare size={16} className="text-emerald-600" />,
      title: 'SMS & WhatsApp Delivery Alerts',
      desc: 'Receive text alerts with delivery tracking links on your registered mobile number.'
    },
    {
      key: 'promotions' as const,
      icon: <Tag size={16} className="text-amber-600" />,
      title: 'Deals, Sales & Gadget Launches',
      desc: 'Receive alerts about flash sales, festival coupons, and new electronics releases.'
    },
    {
      key: 'securityAlerts' as const,
      icon: <Bell size={16} className="text-indigo-600" />,
      title: 'Account & Security Notifications',
      desc: 'Critical alerts regarding mobile OTP sign-ins, new sessions, and account security.'
    }
  ];

  return (
    <div 
      className="bg-white shadow-xs border border-slate-200/80 p-4 sm:p-5 transition-all space-y-4"
      style={{ borderRadius: '12px' }}
    >
      {/* Optional In-Card Header */}
      {showHeader && (
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders size={18} className="text-blue-600" />
              Account Preferences
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Configure how and when you receive order notifications and communications.
            </p>
          </div>

          {savedSuccess && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 animate-in fade-in duration-200">
              <CheckCircle2 size={12} /> Saved
            </span>
          )}
        </div>
      )}

      {!showHeader && savedSuccess && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">Loading preferences...</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {options.map((opt) => {
            const isChecked = preferences[opt.key];
            const isSaving = savingKey === opt.key;

            return (
              <div
                key={opt.key}
                className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {opt.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {opt.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(opt.key)}
                  disabled={isSaving}
                  aria-pressed={isChecked}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                    isChecked ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
