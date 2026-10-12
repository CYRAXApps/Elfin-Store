import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  KeyRound, 
  Store,
  UserCheck,
  Loader2,
  X,
  Edit2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export function PartnerLogin() {
  const navigate = useNavigate();
  const { user, sendEmailLoginOtp, verifyEmailLoginOtp, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const { partnerUser, partnerStore, verifyPartnerSession, loading: partnerAuthLoading, error: partnerAuthError, clearError } = usePartnerAuth();

  const { settings } = useSiteSettings();
  const logoUrl = (settings.branding?.adminLogo || settings.branding?.primaryLogo || settings.general?.storeLogoUrl || '/assets/logo.svg').trim();
  const storeName = settings.general?.storeName || 'ElectroStore';

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [debugOtp, setDebugOtp] = useState<string>('123456');

  // Auto-redirect if already authenticated as active partner
  useEffect(() => {
    if (partnerUser && partnerStore && partnerUser.status === 'ACTIVE') {
      navigate('/partner/dashboard', { replace: true });
    }
  }, [partnerUser, partnerStore, navigate]);

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage(authMethod === 'email' ? 'Please enter your partner email address.' : 'Please enter your partner phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (authMethod === 'email') {
        const res = await sendEmailLoginOtp(identifier.trim());
        if (res.success) {
          setSuccessMessage(res.message || 'OTP sent successfully to your partner email.');
          if (res.debugOtp) setDebugOtp(res.debugOtp);
          else setDebugOtp('123456');
          setStep('otp');
        } else {
          setErrorMessage(res.message || 'Failed to send OTP.');
        }
      } else {
        const res = await sendPhoneOtp(identifier.trim());
        if (res.success) {
          setSuccessMessage(res.message || 'OTP sent successfully to your partner phone.');
          if (res.debugOtp) setDebugOtp(res.debugOtp);
          else setDebugOtp('123456');
          setStep('otp');
        } else {
          setErrorMessage(res.message || 'Failed to send phone OTP.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while sending OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (codeToUse?: string) => {
    const code = codeToUse || otp.trim();
    if (!code || code.length < 4) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let authUser = null;
      if (authMethod === 'email') {
        const res = await verifyEmailLoginOtp(identifier.trim(), code);
        if (res.success && res.user) {
          authUser = res.user;
        } else {
          throw new Error('Invalid OTP code. Please try again.');
        }
      } else {
        const res = await verifyPhoneOtp(identifier.trim(), code);
        if (res.success && res.user) {
          authUser = res.user;
        } else {
          throw new Error('Invalid phone OTP code. Please try again.');
        }
      }

      if (authUser && authUser.uid) {
        // Verify if user is an authorized partner
        const isPartner = await verifyPartnerSession(authUser.uid);
        if (isPartner) {
          navigate('/partner/dashboard', { replace: true });
        } else {
          setErrorMessage('Access Denied: Your account is not currently assigned to an active partner store.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check your OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-Click Login for Primary Store Owner (Admin)
  const handleMainStoreOwnerLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const adminUid = user?.uid || 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1';
      const verified = await verifyPartnerSession(adminUid);
      if (verified) {
        navigate('/partner/dashboard', { replace: true });
      } else {
        setErrorMessage('Partner session verification failed for Main Store.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error accessing partner dashboard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      
      {/* Simple Clean Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8">
        
        {/* Return Button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Return to Home"
        >
          <X size={18} />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center mb-3">
            <img 
              src={logoUrl || '/assets/logo.svg'} 
              alt={storeName} 
              className="h-10 max-w-[200px] object-contain" 
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/assets/logo.svg')) {
                  target.src = '/assets/logo.svg';
                }
              }}
            />
          </Link>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Partner Hub
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">Partner Portal Login</h1>
            <p className="text-xs text-slate-500 mt-1">
              Store Owner &amp; Staff Access
            </p>
          </div>
        </div>

        {/* Auth Method Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setStep('input');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMethod === 'email' 
                ? 'bg-white text-blue-600 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail size={14} /> 
            <span>Email OTP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone');
              setStep('input');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMethod === 'phone' 
                ? 'bg-white text-blue-600 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone size={14} /> 
            <span>Phone OTP</span>
          </button>
        </div>

        {/* Error Alert */}
        {(errorMessage || partnerAuthError) && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug flex-1">{errorMessage || partnerAuthError}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-150">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-snug flex-1">{successMessage}</div>
          </div>
        )}

        {/* Form STEP 1: Enter Identifier */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {authMethod === 'email' ? 'Partner Email Address' : 'Partner Phone Number'}
              </label>
              <div className="relative flex items-center">
                {authMethod === 'email' ? (
                  <Mail size={16} className="absolute left-3.5 text-slate-400" />
                ) : (
                  <Phone size={16} className="absolute left-3.5 text-slate-400" />
                )}
                <input
                  type={authMethod === 'email' ? 'email' : 'tel'}
                  required
                  autoFocus
                  placeholder={authMethod === 'email' ? 'partner-a@electrostore-ibp.com' : '+91 91234 56789'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !identifier.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <span>Send Security Code</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Form STEP 2: Enter OTP */}
        {step === 'otp' && (
          <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }} className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
              <span className="text-xs font-bold text-slate-800">{identifier}</span>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 size={12} />
                <span>Change</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Enter 6-Digit OTP Code
              </label>
              <div className="relative flex items-center">
                <KeyRound size={16} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-base font-mono font-bold tracking-widest text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Test Helper */}
            <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-blue-900 font-medium">
                Test Code: <strong className="font-mono font-bold text-blue-700">{debugOtp}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setOtp(debugOtp);
                  handleVerifyOtp(debugOtp);
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Auto-Fill &amp; Verify
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.length < 4}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Verify &amp; Enter Partner Portal</span>
                  <ShieldCheck size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* 1-Click Fast Partner Demo Access */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider mb-1">
            Instant 1-Click Partner Access
          </div>



          <button
            type="button"
            onClick={handleMainStoreOwnerLogin}
            disabled={isSubmitting}
            className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <UserCheck size={14} className="text-slate-500" />
            <span>Login as Primary Store Owner (Ritam Saha)</span>
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="mt-5 text-center text-xs text-slate-500">
          Not a store partner?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-bold">
            Customer Login
          </Link>
          {' '}•{' '}
          <Link to="/admin" className="text-blue-600 hover:underline font-bold">
            Platform Admin
          </Link>
        </div>

      </div>
    </div>
  );
}
