import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Phone, 
  Lock, 
  ExternalLink,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AccountSecurityManagerProps {
  showHeader?: boolean;
}

// Helper to format phone nicely
function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return 'Not linked';
  const cleanDigits = phone.replace(/\D/g, '');
  if (cleanDigits.length === 10) {
    return `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
  }
  if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
    const ten = cleanDigits.slice(2);
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  }
  return phone.startsWith('+') ? phone : `+91 ${phone}`;
}

export function AccountSecurityManager({ showHeader = false }: AccountSecurityManagerProps) {
  const { user } = useAuth();
  const [copiedUid, setCopiedUid] = useState(false);

  if (!user) return null;

  const handleCopyUid = () => {
    if (!user.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const formattedPhone = formatPhoneDisplay(user.phoneNumber);
  const hasVerifiedPhone = Boolean(user.phoneNumber && (user.isPhoneVerified !== false));

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
              <Lock size={18} className="text-blue-600" />
              Login & Security Settings
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Mobile number & OTP security settings for your account.
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <ShieldCheck size={13} /> Protected
          </span>
        </div>
      )}

      {/* 1. MOBILE OTP AUTHENTICATION STATUS */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 text-xs space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Smartphone size={16} className="text-blue-600" />
            Mobile Number & OTP Authentication
          </h3>
          <p className="text-slate-500 mt-1 leading-relaxed text-[11px] sm:text-xs">
            Your account is secured with password-free mobile OTP authentication. A 6-digit One-Time Password is sent to your verified mobile number for every sign-in.
          </p>
        </div>

        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Phone size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                Primary Login Identity
              </span>
              <p className="text-sm font-bold text-slate-900 font-mono mt-0.5 truncate">
                {hasVerifiedPhone ? formattedPhone : 'Not linked'}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-600 text-white inline-flex items-center gap-1 shadow-2xs shrink-0">
            <ShieldCheck size={12} /> PRIMARY LOGIN
          </span>
        </div>
      </div>

      {/* 2. AUTHENTICATION & IDENTIFIERS CARD */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 text-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-indigo-600" />
          Authentication & Identifiers
        </h3>

        <div className="space-y-2.5">
          {/* Customer ID */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
            <div className="min-w-0 mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer Unique Identifier
              </span>
              <span className="text-xs font-mono text-slate-700 break-all select-all font-semibold">
                {user.uid}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyUid}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="Copy Customer ID"
            >
              {copiedUid ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedUid ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Account Console Shortcut if privileged */}
          {user.role === 'admin' && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Management
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Control Center
                </span>
              </div>
              <Link
                to="/admin"
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg inline-flex items-center gap-1 transition-colors"
              >
                <span>Admin Console</span>
                <ExternalLink size={11} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
