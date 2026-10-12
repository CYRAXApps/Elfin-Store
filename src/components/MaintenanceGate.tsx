import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Wrench, Phone, Mail, ShieldAlert, Sparkles } from 'lucide-react';

interface MaintenanceGateProps {
  children: React.ReactNode;
}

export function MaintenanceGate({ children }: MaintenanceGateProps) {
  const { user } = useAuth();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [legacyMaintMode, setLegacyMaintMode] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'business'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setLegacyMaintMode(Boolean(data.maintenanceMode));
          setBusinessInfo(data);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Could not listen to maintenance status:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const maintConfig = settings.maintenance || {
    enabled: false,
    title: 'Scheduled System Upgrade',
    message: 'We are upgrading our servers and catalog to bring you a faster shopping experience. We will be back online shortly!',
    estimatedReturn: 'Back online today by 6:00 PM IST',
    contactInfo: '',
    maintenanceImage: '',
    allowAdminBypass: true,
  };

  // Check scheduling if active
  const now = new Date();
  let isScheduledActive = false;
  if (maintConfig.autoActivateSchedule && maintConfig.scheduleStart && maintConfig.scheduleEnd) {
    const start = new Date(maintConfig.scheduleStart);
    const end = new Date(maintConfig.scheduleEnd);
    if (now >= start && now <= end) {
      isScheduledActive = true;
    }
  }

  const isMaintenanceActive =
    Boolean(maintConfig.enabled) ||
    Boolean(settings.advanced?.maintenanceMode) ||
    settings.general?.storeStatus === 'maintenance' ||
    isScheduledActive ||
    legacyMaintMode;

  const isAdmin = user?.role === 'admin';
  const allowBypass = maintConfig.allowAdminBypass !== false;

  // If loading or maintenance is false, or admin is permitted bypass, allow access
  if (loading || settingsLoading || !isMaintenanceActive || (isAdmin && allowBypass)) {
    return (
      <>
        {isMaintenanceActive && isAdmin && (
          <div className="bg-amber-500 text-slate-900 px-4 py-2 text-center text-xs font-black flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
            <ShieldAlert size={14} className="text-slate-950" />
            <span>MAINTENANCE MODE IS CURRENTLY ACTIVE (Visible only to Admin)</span>
          </div>
        )}
        {children}
      </>
    );
  }

  // Public maintenance screen
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6">
        {maintConfig.maintenanceImage ? (
          <div className="w-full h-40 rounded-2xl overflow-hidden mb-4">
            <img
              src={maintConfig.maintenanceImage}
              alt="Maintenance"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
            <Wrench size={32} />
          </div>
        )}

        <span className="inline-block text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/20">
          {maintConfig.estimatedReturn || 'Scheduled Upgrade'}
        </span>

        <h1 className="text-2xl sm:text-3xl font-black mt-2 mb-3">
          {maintConfig.title || 'Under Scheduled Maintenance'}
        </h1>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
          {maintConfig.message ||
            'We are currently updating our systems and inventory to enhance your shopping experience. We will be back online shortly.'}
        </p>

        {(maintConfig.contactInfo || settings.general?.storeEmail || settings.contact?.supportEmail || businessInfo?.supportEmail) && (
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 text-left text-xs space-y-3">
            <p className="font-bold text-slate-300">Need assistance with an existing order?</p>
            <div className="flex items-center gap-2 text-slate-400">
              <Mail size={14} className="text-blue-400" />
              <span>{maintConfig.contactInfo || settings.general?.storeEmail || settings.contact?.supportEmail || businessInfo?.supportEmail}</span>
            </div>
            {(settings.general?.phone || settings.contact?.phone || businessInfo?.supportPhone) && (
              <div className="flex items-center gap-2 text-slate-400">
                <Phone size={14} className="text-blue-400" />
                <span>{settings.general?.phone || settings.contact?.phone || businessInfo?.supportPhone}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
