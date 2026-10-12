import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, isAdminOrOwner, isStaffOrAdmin, PRIMARY_OWNER_UID, PRIMARY_OWNER_PHONE } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { 
  X,
  Phone, 
  Mail,
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Edit2,
  Loader2,
  Building2,
  Zap,
  Lock,
  ChevronLeft
} from 'lucide-react';
import { CountryCodeSelector } from '../components/CountryCodeSelector';
import { POPULAR_COUNTRY_CODES, CountryDialCode } from '../data/countryDialCodes';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || (searchParams.get('admin') === 'true' ? '/admin' : '/');

  const { settings } = useSiteSettings();
  const storeName = settings.general?.storeName || 'ElectroStore';
  const logoUrl = (settings.branding?.primaryLogo || settings.general?.storeLogoUrl || '/assets/logo.svg').trim();

  const { 
    user, 
    logout,
    authError, 
    clearAuthError, 
    sendPhoneOtp, 
    resendPhoneOtp, 
    verifyPhoneOtp, 
    sendEmailLoginOtp,
    verifyEmailLoginOtp,
    updateUserProfile
  } = useAuth();

  // Step: 'identifier' | 'otp' | 'register_details' | 'success'
  const [step, setStep] = useState<'identifier' | 'otp' | 'register_details' | 'success'>('identifier');
  
  // Auth Mode: 'phone' | 'email'
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  
  // Form Inputs
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryDialCode>(POPULAR_COUNTRY_CODES[0]);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Registration Fields (Name, Gender, Date of Birth)
  const [fullNameInput, setFullNameInput] = useState('');
  const [genderInput, setGenderInput] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [dobInput, setDobInput] = useState<string>('');
  const [submittingRegistration, setSubmittingRegistration] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const isVerifyingRef = useRef(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [lastSentTarget, setLastSentTarget] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Status Messages
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-redirect if already logged in with complete profile
  useEffect(() => {
    if (user && step !== 'register_details' && step !== 'success') {
      const isStaffUser = isStaffOrAdmin(user);
      const isMissingDetails = !user.displayName || user.displayName.startsWith('Customer ') || user.displayName.includes('@');
      
      if (isMissingDetails && !isStaffUser) {
        setStep('register_details');
      } else {
        const target = (redirectTo && redirectTo !== '/login') ? redirectTo : (isStaffUser ? '/admin' : '/');
        navigate(target, { replace: true });
      }
    }
  }, [user, navigate, redirectTo, step]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= (selectedCountry.maxDigits || 15)) {
      setPhoneInput(val);
      setLocalError(null);
      clearAuthError();
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
    setLocalError(null);
    clearAuthError();
  };

  const isIdentifierValid = () => {
    if (authMode === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim());
    } else {
      return phoneInput.trim().length >= (selectedCountry.minDigits || 8);
    }
  };

  // Send OTP
  const handleSendOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);
    clearAuthError();
    setSuccessMessage(null);

    if (authMode === 'email') {
      const cleanEmail = emailInput.trim().toLowerCase();
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setLocalError('Please enter a valid email address.');
        return;
      }

      setSendingOtp(true);
      try {
        const res = await sendEmailLoginOtp(cleanEmail);
        setLastSentTarget(cleanEmail);
        setStep('otp');
        setCountdown(res.cooldownSeconds || 30);
        setSuccessMessage(`Security code sent to ${cleanEmail}`);
        if (res.debugOtp) setDebugOtp(res.debugOtp);
        else setDebugOtp('123456');
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } catch (err: any) {
        setLocalError(err.message || 'Failed to send OTP code.');
      } finally {
        setSendingOtp(false);
      }

    } else {
      const cleanDigits = phoneInput.trim().replace(/\D/g, '');
      if (cleanDigits.length < (selectedCountry.minDigits || 8)) {
        setLocalError(`Please enter a valid ${selectedCountry.minDigits}-digit mobile number.`);
        return;
      }

      const fullPhone = `${selectedCountry.dialCode}${cleanDigits}`;
      setSendingOtp(true);

      try {
        const res = await sendPhoneOtp(fullPhone);
        setLastSentTarget(fullPhone);
        setStep('otp');
        setCountdown(res.cooldownSeconds || 30);
        setSuccessMessage(`Security code sent to ${fullPhone}`);
        if (res.debugOtp) setDebugOtp(res.debugOtp);
        else setDebugOtp('123456');
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } catch (err: any) {
        setLocalError(err.message || 'Failed to send OTP.');
      } finally {
        setSendingOtp(false);
      }
    }
  };

  // Quick Demo Login Fill & Trigger
  const handleQuickDemo = (type: 'admin' | 'partner' | 'customer') => {
    setLocalError(null);
    clearAuthError();

    if (type === 'admin') {
      setAuthMode('phone');
      setPhoneInput('9876543210');
      setSelectedCountry(POPULAR_COUNTRY_CODES[0]); // +91
      setLastSentTarget('+919876543210');
      setDebugOtp('123456');
      setStep('otp');
      setSuccessMessage('Admin test credentials loaded. Click Auto-Fill or enter 123456.');
      setOtpDigits(['1', '2', '3', '4', '5', '6']);
    } else if (type === 'partner') {
      navigate('/partner/login');
    } else {
      setAuthMode('phone');
      setPhoneInput('9123456789');
      setSelectedCountry(POPULAR_COUNTRY_CODES[0]);
      setLastSentTarget('+919123456789');
      setDebugOtp('123456');
      setStep('otp');
      setSuccessMessage('Demo customer credentials loaded. Click Auto-Fill or enter 123456.');
      setOtpDigits(['1', '2', '3', '4', '5', '6']);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resendingOtp || !lastSentTarget) return;
    setLocalError(null);
    clearAuthError();
    setResendingOtp(true);

    try {
      if (authMode === 'email') {
        const res = await sendEmailLoginOtp(lastSentTarget);
        setCountdown(res.cooldownSeconds || 30);
        setSuccessMessage(`New code sent to ${lastSentTarget}`);
        if (res.debugOtp) setDebugOtp(res.debugOtp);
      } else {
        const res = await resendPhoneOtp(lastSentTarget);
        setCountdown(res.cooldownSeconds || 30);
        setSuccessMessage(`New code sent to ${lastSentTarget}`);
        if (res.debugOtp) setDebugOtp(res.debugOtp);
      }
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to resend OTP.');
    } finally {
      setResendingOtp(false);
    }
  };

  // Handle OTP Inputs
  const handleOtpDigitChange = (index: number, val: string) => {
    setLocalError(null);
    clearAuthError();

    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const newDigits = [...otpDigits];
      const chars = digitsOnly.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        if (index + idx < 6) {
          newDigits[index + idx] = c;
        }
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(index + chars.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      
      if (newDigits.every(d => d !== '') && !isVerifyingRef.current && !verifyingOtp) {
        handleVerifyOtp(newDigits.join(''));
      }
      return;
    }

    const singleDigit = digitsOnly.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleDigit;
    setOtpDigits(newDigits);

    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (singleDigit && index === 5 && newDigits.every(d => d !== '') && !isVerifyingRef.current && !verifyingOtp) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    if (isVerifyingRef.current || verifyingOtp) {
      return;
    }

    const otpCode = (codeToVerify || otpDigits.join('')).trim();
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setLocalError('Please enter the complete 6-digit OTP code.');
      return;
    }

    isVerifyingRef.current = true;
    setVerifyingOtp(true);
    setLocalError(null);
    clearAuthError();

    try {
      let verifiedUser: any = null;

      if (authMode === 'email') {
        const result = await verifyEmailLoginOtp(lastSentTarget, otpCode);
        verifiedUser = result.user;
      } else {
        const result = await verifyPhoneOtp(lastSentTarget, otpCode);
        verifiedUser = result.user;
      }

      if (!verifiedUser) {
        throw new Error('Authentication succeeded, but user profile could not be loaded.');
      }

      const isStaffUser = isStaffOrAdmin(verifiedUser);
      const isNewAccount = Boolean(verifiedUser.isNewUser);
      const isDefaultName = !verifiedUser.displayName || 
                             verifiedUser.displayName.startsWith('Customer ') || 
                             verifiedUser.displayName.includes('@');

      const needsNameOrDetails = !isStaffUser && (isNewAccount || isDefaultName);

      if (needsNameOrDetails) {
        setStep('register_details');
      } else {
        const target = (redirectTo && redirectTo !== '/login') ? redirectTo : (isStaffUser ? '/admin' : '/');
        navigate(target, { replace: true });
      }
    } catch (err: any) {
      setLocalError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingOtp(false);
      isVerifyingRef.current = false;
    }
  };

  const handleSaveRegistrationDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedName = fullNameInput.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (!genderInput) {
      setLocalError('Please select your gender.');
      return;
    }

    if (!dobInput) {
      setLocalError('Please select your date of birth.');
      return;
    }

    setSubmittingRegistration(true);

    try {
      await updateUserProfile({
        displayName: trimmedName,
        gender: genderInput,
        dateOfBirth: dobInput,
      });

      setStep('success');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save profile details.');
    } finally {
      setSubmittingRegistration(false);
    }
  };

  const handleEditTarget = () => {
    setStep('identifier');
    setLocalError(null);
    clearAuthError();
    setSuccessMessage(null);
    setOtpDigits(['', '', '', '', '', '']);
  };

  const handleAutoFillDebugOtp = () => {
    if (isVerifyingRef.current || verifyingOtp) return;
    const code = debugOtp || '123456';
    const chars = code.split('');
    setOtpDigits(chars);
    handleVerifyOtp(code);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-slate-50 flex flex-col justify-center items-center py-8 px-4">
      
      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 relative my-auto">
        
        {/* Back / Close button */}
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
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={storeName} 
                className="h-9 max-w-[180px] object-contain" 
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith('/assets/logo.svg')) {
                    target.src = '/assets/logo.svg';
                  }
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
                <ShieldCheck size={26} />
              </div>
            )}
          </Link>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {step === 'identifier' && 'Welcome Back'}
            {step === 'otp' && 'Enter Security Code'}
            {step === 'register_details' && 'Complete Your Profile'}
            {step === 'success' && 'Welcome to ' + storeName}
          </h1>

          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
            {step === 'identifier' && 'Sign in or create an account with OTP verification'}
            {step === 'otp' && `We sent a 6-digit code to ${lastSentTarget}`}
            {step === 'register_details' && 'Please provide your details to complete setup'}
            {step === 'success' && 'Your account is ready for use'}
          </p>
        </div>

        {/* Error Alert */}
        {(localError || authError) && (
          <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-800 text-xs font-medium animate-in fade-in duration-150">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <span className="flex-1">{localError || authError?.message}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && !localError && !authError && step === 'otp' && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-medium animate-in fade-in duration-150">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {/* STEP 1: IDENTIFIER INPUT */}
        {step === 'identifier' && (
          <div className="space-y-4">
            
            {/* Simple Clean Tabs: Phone / Email */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('phone');
                  setLocalError(null);
                  clearAuthError();
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'phone' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone size={14} />
                <span>Mobile Number</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email');
                  setLocalError(null);
                  clearAuthError();
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'email' 
                    ? 'bg-white text-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail size={14} />
                <span>Email Address</span>
              </button>
            </div>

            <form onSubmit={handleSendOtpSubmit} className="space-y-4 pt-1">
              {authMode === 'phone' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative flex items-center rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all p-1">
                    <CountryCodeSelector
                      selectedCountry={selectedCountry}
                      onSelectCountry={(c) => {
                        setSelectedCountry(c);
                        setPhoneInput('');
                        phoneInputRef.current?.focus();
                      }}
                      disabled={!settings.general?.enableCountryCodeSelector}
                      buttonClassName="bg-slate-50 border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700"
                    />
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      inputMode="numeric"
                      autoFocus
                      value={phoneInput}
                      onChange={handlePhoneChange}
                      placeholder={selectedCountry.format || '98765 43210'}
                      maxLength={selectedCountry.maxDigits || 15}
                      required
                      className="w-full px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3.5 text-slate-400" />
                    <input
                      type="email"
                      autoFocus
                      value={emailInput}
                      onChange={handleEmailChange}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={sendingOtp || !isIdentifierValid()}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
                  isIdentifierValid() && !sendingOtp
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {sendingOtp ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Continue with OTP</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Helpers for Fast Testing */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                Quick 1-Click Demo Login
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  className="p-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-center transition-all cursor-pointer"
                >
                  <span className="block text-xs font-black text-slate-800">Admin</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Store Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('partner')}
                  className="p-2 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl text-center transition-all cursor-pointer"
                >
                  <span className="block text-xs font-black text-slate-800">Partner</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Store Hub</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('customer')}
                  className="p-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-center transition-all cursor-pointer"
                >
                  <span className="block text-xs font-black text-slate-800">Customer</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Shopper</span>
                </button>
              </div>
            </div>

            {/* Partner Portal Shortcut */}
            <div className="pt-2 text-center">
              <Link 
                to="/partner/login" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Building2 size={14} className="text-blue-600" />
                <span>Switch to Partner Portal Login</span>
              </Link>
            </div>

          </div>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <div className="space-y-4">
            
            {/* Target Display & Change Button */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
              <span className="text-xs font-bold text-slate-800">{lastSentTarget}</span>
              <button
                type="button"
                onClick={handleEditTarget}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 size={12} />
                <span>Change</span>
              </button>
            </div>

            {/* 6 Input Boxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                Enter 6-Digit Code
              </label>
              <div className="grid grid-cols-6 gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onFocus={(e) => e.target.select()}
                    className={`w-full aspect-square text-center text-lg font-mono font-bold rounded-xl border outline-none transition-all ${
                      digit 
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-100' 
                        : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Test Helper */}
            <div className="p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
              <span className="text-blue-900 font-medium">
                Test OTP: <strong className="font-mono font-bold text-blue-700">{debugOtp || '123456'}</strong>
              </span>
              <button
                type="button"
                onClick={handleAutoFillDebugOtp}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Auto-Fill & Verify
              </button>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={verifyingOtp || otpDigits.some(d => d === '')}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                !otpDigits.some(d => d === '') && !verifyingOtp
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-[0.99] shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {verifyingOtp ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Sign In</span>
              )}
            </button>

            {/* Resend Link */}
            <div className="text-center pt-1">
              {countdown > 0 ? (
                <p className="text-xs text-slate-500">
                  Resend code in <span className="font-bold text-slate-700">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendingOtp}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer disabled:opacity-50"
                >
                  {resendingOtp ? 'Resending...' : 'Resend Security Code'}
                </button>
              )}
            </div>

          </div>
        )}

        {/* STEP 3: REGISTRATION DETAILS */}
        {step === 'register_details' && (
          <form onSubmit={handleSaveRegistrationDetails} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderInput(g)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      genderInput === g
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dobInput}
                onChange={(e) => {
                  setDobInput(e.target.value);
                  setLocalError(null);
                }}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={submittingRegistration || !fullNameInput.trim() || !genderInput || !dobInput}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all mt-2 flex items-center justify-center gap-2 ${
                fullNameInput.trim() && genderInput && dobInput && !submittingRegistration
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-[0.99] shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submittingRegistration ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <span>Complete Account Setup</span>
              )}
            </button>

            {user && (
              <button
                type="button"
                onClick={() => {
                  const target = (redirectTo && redirectTo !== '/login') ? redirectTo : (isStaffOrAdmin(user) ? '/admin' : '/');
                  navigate(target, { replace: true });
                }}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Skip for now &amp; Continue
              </button>
            )}
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 'success' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Account Ready!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Welcome, {user?.displayName || fullNameInput || 'Customer'}!
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(redirectTo || '/')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
