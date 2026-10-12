import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UserRound,
  Check,
  Smartphone,
  RotateCcw,
  Loader2,
  Plus,
  Shield,
  ArrowRight
} from 'lucide-react';

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

// Mask sensitive phone
function maskPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const ten = digits.slice(-10);
    return `+91 ${ten.slice(0, 2)}*** ***${ten.slice(-2)}`;
  }
  return phone;
}

// Mask sensitive email
function maskEmail(email?: string | null): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length > 2 ? `${name.slice(0, 2)}***${name.slice(-1)}` : `${name}***`;
  return `${maskedName}@${domain}`;
}

export function ProfileDetailsManager() {
  const { 
    user, 
    updateUserProfile, 
    sendPhoneOtp, 
    resendPhoneOtp, 
    verifyAndUpdatePhone,
    sendEmailOtp,
    verifyAndUpdateEmail,
    sendSecurityOtp,
    verifySecurityOtp
  } = useAuth();

  // Full Profile Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedPhotoURL, setSelectedPhotoURL] = useState('');

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // DUAL-STEP 2-WAY OTP MODAL FOR MOBILE NUMBER UPDATE
  // -------------------------------------------------------------
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileStep, setMobileStep] = useState<'step1_old_otp' | 'input_new' | 'step2_new_otp'>('input_new');
  const [newMobileInput, setNewMobileInput] = useState('');
  const [mobileStep1Digits, setMobileStep1Digits] = useState<string[]>(['', '', '', '', '', '']);
  const [mobileStep2Digits, setMobileStep2Digits] = useState<string[]>(['', '', '', '', '', '']);
  const [mobileCountdown, setMobileCountdown] = useState<number>(0);
  const [mobileStep1DebugOtp, setMobileStep1DebugOtp] = useState<string | null>(null);
  const [mobileStep2DebugOtp, setMobileStep2DebugOtp] = useState<string | null>(null);
  const [mobileModalLoading, setMobileModalLoading] = useState(false);
  const [mobileModalError, setMobileModalError] = useState<string | null>(null);
  const [isOldMobileAuthorized, setIsOldMobileAuthorized] = useState(false);

  // -------------------------------------------------------------
  // DUAL-STEP 2-WAY OTP MODAL FOR EMAIL ADDRESS UPDATE
  // -------------------------------------------------------------
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState<'step1_old_otp' | 'input_new' | 'step2_new_otp'>('input_new');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailStep1Digits, setEmailStep1Digits] = useState<string[]>(['', '', '', '', '', '']);
  const [emailStep2Digits, setEmailStep2Digits] = useState<string[]>(['', '', '', '', '', '']);
  const [emailCountdown, setEmailCountdown] = useState<number>(0);
  const [emailStep1DebugOtp, setEmailStep1DebugOtp] = useState<string | null>(null);
  const [emailStep2DebugOtp, setEmailStep2DebugOtp] = useState<string | null>(null);
  const [emailModalLoading, setEmailModalLoading] = useState(false);
  const [emailModalError, setEmailModalError] = useState<string | null>(null);
  const [isOldEmailAuthorized, setIsOldEmailAuthorized] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync form with user
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber ? user.phoneNumber.replace(/^\+91/, '').trim() : '');
      setGender(user.gender || '');
      setDateOfBirth(user.dateOfBirth || '');
      setSelectedPhotoURL(user.photoURL || '');
    }
  }, [user]);

  // Timers for countdowns
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (mobileCountdown > 0) {
      timer = setInterval(() => setMobileCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [mobileCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      timer = setInterval(() => setEmailCountdown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    }
    return () => clearInterval(timer);
  }, [emailCountdown]);

  if (!user) return null;

  const hasVerifiedOldPhone = Boolean(user.phoneNumber && user.isPhoneVerified !== false);
  const hasExistingOldEmail = Boolean(user.email && user.email.includes('@') && !user.email.endsWith('@mobile.electrostore.com'));

  // ---------------------------------------------------------------------------
  // 1. OPEN MOBILE UPDATE FLOW (Step 1 Old Auth -> Step 2 New Mobile OTP)
  // ---------------------------------------------------------------------------
  const handleOpenMobileModal = async () => {
    setMobileModalError(null);
    setNewMobileInput('');
    setMobileStep1Digits(['', '', '', '', '', '']);
    setMobileStep2Digits(['', '', '', '', '', '']);
    setMobileStep1DebugOtp(null);
    setMobileStep2DebugOtp(null);
    setIsOldMobileAuthorized(false);

    // If customer already has an existing verified phone or email, trigger Step 1 (Security Authorization on OLD credential)
    if (hasVerifiedOldPhone || hasExistingOldEmail) {
      setMobileStep('step1_old_otp');
      setShowMobileModal(true);
      setMobileModalLoading(true);

      const oldTarget = hasVerifiedOldPhone ? 'phone' : 'email';
      const oldValue = hasVerifiedOldPhone ? user.phoneNumber! : user.email!;

      try {
        const res = await sendSecurityOtp(oldTarget, oldValue);
        setMobileCountdown(res.cooldownSeconds || 30);
        setMobileStep1DebugOtp(res.debugOtp || null);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } catch (err: any) {
        setMobileModalError(err.message || 'Failed to send security authorization code.');
      } finally {
        setMobileModalLoading(false);
      }
    } else {
      // First-time mobile linking -> Go straight to Step 2 (New Mobile)
      setIsOldMobileAuthorized(false);
      setMobileStep('input_new');
      setShowMobileModal(true);
    }
  };

  // Step 1: Resend Old Credential Security OTP for Mobile Update
  const handleResendOldMobileOtp = async () => {
    setMobileModalLoading(true);
    setMobileModalError(null);
    const oldTarget = hasVerifiedOldPhone ? 'phone' : 'email';
    const oldValue = hasVerifiedOldPhone ? user.phoneNumber! : user.email!;

    try {
      const res = await sendSecurityOtp(oldTarget, oldValue);
      setMobileCountdown(res.cooldownSeconds || 30);
      setMobileStep1DebugOtp(res.debugOtp || null);
    } catch (err: any) {
      setMobileModalError(err.message || 'Failed to resend authorization code.');
    } finally {
      setMobileModalLoading(false);
    }
  };

  // Step 1: Verify Old Credential Security OTP for Mobile Update
  const handleVerifyOldMobileOtp = async (codeOverride?: string) => {
    const code = codeOverride || mobileStep1Digits.join('');
    if (code.length < 6) {
      setMobileModalError('Please enter the 6-digit authorization code sent to your current account.');
      return;
    }

    setMobileModalLoading(true);
    setMobileModalError(null);

    const oldTarget = hasVerifiedOldPhone ? 'phone' : 'email';
    const oldValue = hasVerifiedOldPhone ? user.phoneNumber! : user.email!;

    try {
      await verifySecurityOtp(oldTarget, oldValue, code);
      setIsOldMobileAuthorized(true);
      setMobileStep('input_new');
      setMobileCountdown(0);
      setMobileModalError(null);
    } catch (err: any) {
      setMobileModalError(err.message || 'Incorrect authorization code. Please try again.');
    } finally {
      setMobileModalLoading(false);
    }
  };

  // Step 2: Send OTP to NEW Mobile Number
  const handleSendNewMobileOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = newMobileInput.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length < 10) {
      setMobileModalError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const currentPhoneDigits = (user?.phoneNumber || '').replace(/\D/g, '').slice(-10);
    if (currentPhoneDigits && cleanDigits === currentPhoneDigits) {
      setMobileModalError('This is already your current registered mobile number. Please enter a different mobile number.');
      return;
    }

    const fullPhone = `+91${cleanDigits}`;
    setMobileModalLoading(true);
    setMobileModalError(null);

    try {
      const res = await sendPhoneOtp(fullPhone, user?.uid);
      setMobileCountdown(res.cooldownSeconds || 30);
      setMobileStep2DebugOtp(res.debugOtp || null);
      setMobileStep2Digits(['', '', '', '', '', '']);
      setMobileStep('step2_new_otp');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setMobileModalError(err.message || 'Failed to send verification code to new mobile number.');
    } finally {
      setMobileModalLoading(false);
    }
  };

  // Step 2: Verify NEW Mobile OTP and complete update
  const handleVerifyNewMobileOtp = async (codeOverride?: string) => {
    const code = codeOverride || mobileStep2Digits.join('');
    if (code.length < 6) {
      setMobileModalError('Please enter all 6 digits of the OTP code.');
      return;
    }

    const cleanDigits = newMobileInput.replace(/\D/g, '').slice(-10);
    const fullPhone = `+91${cleanDigits}`;

    setMobileModalLoading(true);
    setMobileModalError(null);

    try {
      const verifyRes = await verifyAndUpdatePhone(fullPhone, code);
      const verifiedPhone = verifyRes.phoneNumber || fullPhone;

      // Update state
      setPhoneNumber(verifiedPhone.replace(/^\+91/, '').trim());
      setShowMobileModal(false);
      setSuccessMessage('Mobile number verified and updated as your primary login!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setMobileModalError(err.message || 'Incorrect or expired OTP. Please try again.');
    } finally {
      setMobileModalLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. OPEN EMAIL UPDATE FLOW (2-Step Verification)
  // ---------------------------------------------------------------------------
  const handleOpenEmailModal = async () => {
    setEmailModalError(null);
    setNewEmailInput('');
    setEmailStep1Digits(['', '', '', '', '', '']);
    setEmailStep2Digits(['', '', '', '', '', '']);
    setIsOldEmailAuthorized(false);

    // If customer already has an existing email or phone, trigger Step 1 (Security Authorization on OLD credential)
    if (hasExistingOldEmail || hasVerifiedOldPhone) {
      setEmailStep('step1_old_otp');
      setShowEmailModal(true);
      setEmailModalLoading(true);

      const oldTarget = hasExistingOldEmail ? 'email' : 'phone';
      const oldValue = hasExistingOldEmail ? user.email! : user.phoneNumber!;

      try {
        const res = await sendSecurityOtp(oldTarget, oldValue);
        setEmailCountdown(res.cooldownSeconds || 30);
        setEmailStep1DebugOtp(res.debugOtp || null);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } catch (err: any) {
        setEmailModalError(err.message || 'Failed to send security authorization code.');
      } finally {
        setEmailModalLoading(false);
      }
    } else {
      // First-time email linking -> Go straight to Step 2 (New Email)
      setEmailStep('input_new');
      setShowEmailModal(true);
    }
  };

  // Step 1: Resend Old Credential Security OTP for Email Update
  const handleResendOldEmailOtp = async () => {
    setEmailModalLoading(true);
    setEmailModalError(null);
    const oldTarget = hasExistingOldEmail ? 'email' : 'phone';
    const oldValue = hasExistingOldEmail ? user.email! : user.phoneNumber!;

    try {
      const res = await sendSecurityOtp(oldTarget, oldValue);
      setEmailCountdown(res.cooldownSeconds || 30);
      setEmailStep1DebugOtp(res.debugOtp || null);
    } catch (err: any) {
      setEmailModalError(err.message || 'Failed to resend authorization code.');
    } finally {
      setEmailModalLoading(false);
    }
  };

  // Step 1: Verify Old Credential Security OTP for Email Update
  const handleVerifyOldEmailOtp = async (codeOverride?: string) => {
    const code = codeOverride || emailStep1Digits.join('');
    if (code.length < 6) {
      setEmailModalError('Please enter the 6-digit authorization code sent to your current account.');
      return;
    }

    setEmailModalLoading(true);
    setEmailModalError(null);

    const oldTarget = hasExistingOldEmail ? 'email' : 'phone';
    const oldValue = hasExistingOldEmail ? user.email! : user.phoneNumber!;

    try {
      await verifySecurityOtp(oldTarget, oldValue, code);
      setIsOldEmailAuthorized(true);
      setEmailStep('input_new');
      setEmailCountdown(0);
      setEmailModalError(null);
    } catch (err: any) {
      setEmailModalError(err.message || 'Incorrect authorization code. Please try again.');
    } finally {
      setEmailModalLoading(false);
    }
  };

  // Step 2: Send OTP to NEW Email Address
  const handleSendNewEmailOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = newEmailInput.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailModalError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    const currentEmail = (user?.email || '').trim().toLowerCase();
    if (currentEmail && !currentEmail.endsWith('@mobile.electrostore.com') && cleanEmail === currentEmail) {
      setEmailModalError('This is already your current registered email address. Please enter a different email address.');
      return;
    }

    setEmailModalLoading(true);
    setEmailModalError(null);

    try {
      const res = await sendEmailOtp(cleanEmail, user?.uid);
      setEmailCountdown(res.cooldownSeconds || 30);
      setEmailStep2DebugOtp(res.debugOtp || null);
      setEmailStep2Digits(['', '', '', '', '', '']);
      setEmailStep('step2_new_otp');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setEmailModalError(err.message || 'Failed to send verification code to new email.');
    } finally {
      setEmailModalLoading(false);
    }
  };

  // Step 2: Verify NEW Email OTP and complete update
  const handleVerifyNewEmailOtp = async (codeOverride?: string) => {
    const code = codeOverride || emailStep2Digits.join('');
    if (code.length < 6) {
      setEmailModalError('Please enter all 6 digits of the OTP code.');
      return;
    }

    const cleanEmail = newEmailInput.trim().toLowerCase();
    setEmailModalLoading(true);
    setEmailModalError(null);

    try {
      const res = await verifyAndUpdateEmail(cleanEmail, code);
      setEmail(res.email || cleanEmail);
      setShowEmailModal(false);
      setSuccessMessage('Email address verified and updated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setEmailModalError(err.message || 'Incorrect or expired OTP. Please try again.');
    } finally {
      setEmailModalLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // FULL PROFILE EDIT SAVE (Name, Gender, DOB, Avatar)
  // ---------------------------------------------------------------------------
  const handleStartEdit = () => {
    setDisplayName(user.displayName || '');
    setEmail(user.email || '');
    setPhoneNumber(user.phoneNumber ? user.phoneNumber.replace(/^\+91/, '').trim() : '');
    setGender(user.gender || '');
    setDateOfBirth(user.dateOfBirth || '');
    setSelectedPhotoURL(user.photoURL || '');
    setValidationError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDisplayName(user.displayName || '');
    setEmail(user.email || '');
    setPhoneNumber(user.phoneNumber ? user.phoneNumber.replace(/^\+91/, '').trim() : '');
    setGender(user.gender || '');
    setDateOfBirth(user.dateOfBirth || '');
    setValidationError(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    const cleanName = displayName.trim();
    if (!cleanName || cleanName.length < 2) {
      setValidationError('Please enter a valid full name (at least 2 characters).');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        displayName: cleanName,
        gender: gender || '',
        dateOfBirth: dateOfBirth || ''
      });

      setSuccessMessage('Profile details updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Helper for 6 digit box changes
  const handleDigitChange = (
    index: number, 
    val: string, 
    digitsState: string[], 
    setDigitsState: React.Dispatch<React.SetStateAction<string[]>>, 
    onComplete: (code: string) => void
  ) => {
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const newDigits = [...digitsState];
      const chars = digitsOnly.slice(0, 6).split('');
      chars.forEach((c, idx) => {
        if (index + idx < 6) newDigits[index + idx] = c;
      });
      setDigitsState(newDigits);
      const nextFocus = Math.min(index + chars.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      if (newDigits.every(d => d !== '')) {
        onComplete(newDigits.join(''));
      }
      return;
    }

    const singleDigit = digitsOnly.slice(-1);
    const newDigits = [...digitsState];
    newDigits[index] = singleDigit;
    setDigitsState(newDigits);

    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    if (singleDigit && index === 5 && newDigits.every(d => d !== '')) {
      onComplete(newDigits.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, digitsState: string[]) => {
    if (e.key === 'Backspace' && !digitsState[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Format Date of Birth for view mode
  const formattedDob = user.dateOfBirth
    ? new Date(user.dateOfBirth + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Not specified';

  const genderLabelMap: Record<string, string> = {
    male: 'Male',
    female: 'Female',
    other: 'Other',
    unspecified: 'Prefer not to say'
  };
  const formattedGender = user.gender ? (genderLabelMap[user.gender] || user.gender) : 'Not specified';
  const formattedPhone = formatPhoneDisplay(user.phoneNumber);
  const hasVerifiedPhone = Boolean(user.phoneNumber && user.isPhoneVerified !== false);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 sm:p-6 transition-all">
      {/* Header with Title and Edit Profile button */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Profile Information
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Your personal credentials and verified account details.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-blue-200/60 shadow-2xs"
          >
            <Edit3 size={13} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <button
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={13} />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Success Notification Alert Banner */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Error Notification Alert Banner */}
      {validationError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* VIEW MODE */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Top Avatar Banner */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-xs ring-2 ring-blue-100 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : user.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : (
                  <User size={24} />
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" title="Active Account" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {user.displayName || 'Customer'}
                </h3>
                {hasVerifiedPhone && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
                {hasVerifiedPhone ? formattedPhone : (user.email || 'Customer')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">ID: {user.uid.slice(0, 16)}...</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* 1. Full Name Card */}
            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User size={12} className="text-blue-600" /> Full Name
              </label>
              <p className="text-sm font-semibold text-slate-800">
                {user.displayName || 'Not provided'}
              </p>
            </div>

            {/* 2. Mobile Number Card (PRIMARY LOGIN) */}
            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={12} className="text-blue-600" /> Mobile Number
                </label>
                {hasVerifiedPhone ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                    <ShieldCheck size={10} className="text-blue-600" /> PRIMARY LOGIN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    Not Linked
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800 font-sans">
                  {hasVerifiedPhone ? formattedPhone : 'Not linked'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenMobileModal}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer"
                >
                  {hasVerifiedPhone ? (
                    <>
                      <Edit3 size={11} /> Change
                    </>
                  ) : (
                    <>
                      <Plus size={12} /> Add Mobile
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Email Address Card (SECONDARY CONTACT) */}
            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Mail size={12} className="text-blue-600" /> Email Address
                </label>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Secondary Contact
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user.email || 'Not provided'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer shrink-0 ml-2"
                >
                  <Edit3 size={11} /> {user.email ? 'Change' : 'Add Email'}
                </button>
              </div>
            </div>

            {/* 4. Gender Card */}
            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserRound size={12} className="text-blue-600" /> Gender
              </label>
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {formattedGender}
              </p>
            </div>

            {/* 5. Date of Birth Card */}
            <div className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={12} className="text-blue-600" /> Date of Birth
              </label>
              <p className="text-sm font-semibold text-slate-800">
                {formattedDob}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT MODE FORM (Name, Gender, Date of Birth) */
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={14} />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 bg-white"
                  required
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={14} />
                </div>
                <input
                  type="date"
                  value={dateOfBirth}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Gender Pills Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserRound size={14} className="text-blue-600" />
              <span>Gender</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' },
                { id: 'other', label: 'Other' },
                { id: 'unspecified', label: 'Prefer not to say' }
              ].map((item) => {
                const isSelected = gender === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGender(item.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: Save & Cancel */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Profile</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* DUAL-STEP 2-WAY OTP MODAL FOR UPDATING MOBILE NUMBER                      */}
      {/* ========================================================================= */}
      {showMobileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  {mobileStep === 'step1_old_otp' ? <Shield size={20} /> : <Smartphone size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {mobileStep === 'step1_old_otp' && 'Step 1 of 2: Authorize Mobile Change'}
                    {mobileStep === 'input_new' && (isOldMobileAuthorized ? 'Step 2 of 2: Enter New Mobile' : 'Link Mobile Number')}
                    {mobileStep === 'step2_new_otp' && 'Step 2 of 2: Verify New Mobile'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mobileStep === 'step1_old_otp' && (
                      <>
                        Enter code sent to your current {hasVerifiedOldPhone ? `mobile (${maskPhone(user.phoneNumber)})` : `email (${maskEmail(user.email)})`}.
                      </>
                    )}
                    {mobileStep === 'input_new' && 'Enter your new 10-digit mobile number to set as primary login.'}
                    {mobileStep === 'step2_new_otp' && `Enter code sent to new number (+91 ${newMobileInput}).`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner */}
            {mobileModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{mobileModalError}</span>
              </div>
            )}

            {/* STEP 1: Old Credential Security Authorization OTP */}
            {mobileStep === 'step1_old_otp' && (
              <div className="space-y-4 pt-1">
                {mobileStep1DebugOtp && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                    <span>Current Device Auth Code: <strong className="font-mono font-black text-blue-900">{mobileStep1DebugOtp}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = mobileStep1DebugOtp.split('').slice(0, 6);
                        setMobileStep1Digits(d);
                        handleVerifyOldMobileOtp(mobileStep1DebugOtp);
                      }}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 py-2">
                  {mobileStep1Digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value, mobileStep1Digits, setMobileStep1Digits, handleVerifyOldMobileOtp)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e, mobileStep1Digits)}
                      className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all outline-none ${
                        digit ? 'border-blue-600 bg-blue-50/30 text-blue-950 ring-2 ring-blue-100' : 'border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium text-[11px]">
                    Didn't receive code?
                  </span>
                  {mobileCountdown > 0 ? (
                    <span className="text-slate-400 font-mono font-semibold text-[11px]">Resend in {mobileCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOldMobileOtp}
                      className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <RotateCcw size={11} /> Resend Code
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowMobileModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyOldMobileOtp()}
                    disabled={mobileModalLoading || mobileStep1Digits.some(d => d === '')}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {mobileModalLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                    <span>Authorize & Continue</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2A: Enter New Mobile Number */}
            {mobileStep === 'input_new' && (() => {
              const currentTen = (user.phoneNumber || '').replace(/\D/g, '').slice(-10);
              const inputTen = newMobileInput.replace(/\D/g, '').slice(-10);
              const isSameAsCurrentPhone = Boolean(currentTen && inputTen.length === 10 && inputTen === currentTen);

              return (
                <form onSubmit={handleSendNewMobileOtp} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-slate-500 font-semibold text-xs pointer-events-none select-none">+91</span>
                      <input
                        type="tel"
                        value={newMobileInput}
                        onChange={(e) => {
                          setNewMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10));
                          if (mobileModalError) setMobileModalError(null);
                        }}
                        placeholder="98765 43210"
                        maxLength={10}
                        autoFocus
                        className={`w-full pl-11 pr-3 py-2.5 border rounded-xl text-xs font-mono outline-none font-semibold transition-colors ${
                          isSameAsCurrentPhone 
                            ? 'border-amber-400 bg-amber-50/40 text-amber-950 focus:border-amber-500' 
                            : 'border-slate-300 focus:border-blue-600 bg-white'
                        }`}
                      />
                    </div>

                    {isSameAsCurrentPhone ? (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                        <AlertCircle size={13} className="text-amber-600 shrink-0" />
                        <span>This is already your current mobile number. Please enter a different number.</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        We will send an OTP to verify ownership of this new number.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowMobileModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mobileModalLoading || inputTen.length < 10 || isSameAsCurrentPhone}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                    >
                      {mobileModalLoading ? <Loader2 size={13} className="animate-spin" /> : <span>Send OTP to New Number</span>}
                    </button>
                  </div>
                </form>
              );
            })()}

            {/* STEP 2B: Verify OTP sent to NEW Mobile Number */}
            {mobileStep === 'step2_new_otp' && (
              <div className="space-y-4 pt-1">
                {mobileStep2DebugOtp && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                    <span>New Mobile Verification Code: <strong className="font-mono font-black text-blue-900">{mobileStep2DebugOtp}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = mobileStep2DebugOtp.split('').slice(0, 6);
                        setMobileStep2Digits(d);
                        handleVerifyNewMobileOtp(mobileStep2DebugOtp);
                      }}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 py-2">
                  {mobileStep2Digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value, mobileStep2Digits, setMobileStep2Digits, handleVerifyNewMobileOtp)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e, mobileStep2Digits)}
                      className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all outline-none ${
                        digit ? 'border-blue-600 bg-blue-50/30 text-blue-950 ring-2 ring-blue-100' : 'border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setMobileStep('input_new')}
                    className="text-slate-500 hover:text-slate-700 font-medium underline"
                  >
                    Change Number
                  </button>
                  {mobileCountdown > 0 ? (
                    <span className="text-slate-400 font-mono font-semibold">Resend in {mobileCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendNewMobileOtp}
                      className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} /> Resend OTP
                    </button>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowMobileModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyNewMobileOtp()}
                    disabled={mobileModalLoading || mobileStep2Digits.some(d => d === '')}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {mobileModalLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>Verify & Link Mobile</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DUAL-STEP 2-WAY OTP MODAL FOR UPDATING EMAIL ADDRESS                      */}
      {/* ========================================================================= */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 sm:p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  {emailStep === 'step1_old_otp' ? <Shield size={20} /> : <Mail size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {emailStep === 'step1_old_otp' && 'Step 1 of 2: Authorize Email Change'}
                    {emailStep === 'input_new' && (isOldEmailAuthorized ? 'Step 2 of 2: Enter New Email' : 'Update Email Address')}
                    {emailStep === 'step2_new_otp' && 'Step 2 of 2: Verify New Email'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {emailStep === 'step1_old_otp' && (
                      <>
                        Enter code sent to your current {hasExistingOldEmail ? `email (${maskEmail(user.email)})` : `mobile (${maskPhone(user.phoneNumber)})`}.
                      </>
                    )}
                    {emailStep === 'input_new' && 'Enter your new email address for invoices and notifications.'}
                    {emailStep === 'step2_new_otp' && `Enter code sent to new email (${newEmailInput}).`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error banner */}
            {emailModalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span>{emailModalError}</span>
              </div>
            )}

            {/* STEP 1: Old Credential Security Authorization OTP */}
            {emailStep === 'step1_old_otp' && (
              <div className="space-y-4 pt-1">
                {emailStep1DebugOtp && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                    <span>Current Auth Code: <strong className="font-mono font-black text-blue-900">{emailStep1DebugOtp}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = emailStep1DebugOtp.split('').slice(0, 6);
                        setEmailStep1Digits(d);
                        handleVerifyOldEmailOtp(emailStep1DebugOtp);
                      }}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 py-2">
                  {emailStep1Digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value, emailStep1Digits, setEmailStep1Digits, handleVerifyOldEmailOtp)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e, emailStep1Digits)}
                      className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all outline-none ${
                        digit ? 'border-blue-600 bg-blue-50/30 text-blue-950 ring-2 ring-blue-100' : 'border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium text-[11px]">
                    Didn't receive code?
                  </span>
                  {emailCountdown > 0 ? (
                    <span className="text-slate-400 font-mono font-semibold text-[11px]">Resend in {emailCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOldEmailOtp}
                      className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <RotateCcw size={11} /> Resend Code
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyOldEmailOtp()}
                    disabled={emailModalLoading || emailStep1Digits.some(d => d === '')}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {emailModalLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                    <span>Authorize & Continue</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2A: Enter New Email Address */}
            {emailStep === 'input_new' && (() => {
              const currentEmail = (user.email || '').trim().toLowerCase();
              const inputEmail = newEmailInput.trim().toLowerCase();
              const isSameAsCurrentEmail = Boolean(
                currentEmail && 
                !currentEmail.endsWith('@mobile.electrostore.com') && 
                inputEmail && 
                inputEmail === currentEmail
              );

              return (
                <form onSubmit={handleSendNewEmailOtp} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail size={14} />
                      </div>
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => {
                          setNewEmailInput(e.target.value);
                          if (emailModalError) setEmailModalError(null);
                        }}
                        placeholder="name@example.com"
                        autoFocus
                        required
                        className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none font-medium transition-colors ${
                          isSameAsCurrentEmail
                            ? 'border-amber-400 bg-amber-50/40 text-amber-950 focus:border-amber-500'
                            : 'border-slate-300 focus:border-blue-600 bg-white'
                        }`}
                      />
                    </div>

                    {isSameAsCurrentEmail ? (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium flex items-center gap-1.5">
                        <AlertCircle size={13} className="text-amber-600 shrink-0" />
                        <span>This is already your current registered email. Please enter a different email.</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        We will send a 6-digit verification code to verify deliverability of your new email.
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={emailModalLoading || !newEmailInput.trim() || isSameAsCurrentEmail}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                    >
                      {emailModalLoading ? <Loader2 size={13} className="animate-spin" /> : <span>Send OTP to New Email</span>}
                    </button>
                  </div>
                </form>
              );
            })()}

            {/* STEP 2B: Verify OTP sent to NEW Email Address */}
            {emailStep === 'step2_new_otp' && (
              <div className="space-y-4 pt-1">
                {emailStep2DebugOtp && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
                    <span>New Email Verification Code: <strong className="font-mono font-black text-blue-900">{emailStep2DebugOtp}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        const d = emailStep2DebugOtp.split('').slice(0, 6);
                        setEmailStep2Digits(d);
                        handleVerifyNewEmailOtp(emailStep2DebugOtp);
                      }}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 py-2">
                  {emailStep2Digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value, emailStep2Digits, setEmailStep2Digits, handleVerifyNewEmailOtp)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e, emailStep2Digits)}
                      className={`w-11 h-12 sm:w-12 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all outline-none ${
                        digit ? 'border-blue-600 bg-blue-50/30 text-blue-950 ring-2 ring-blue-100' : 'border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setEmailStep('input_new')}
                    className="text-slate-500 hover:text-slate-700 font-medium underline"
                  >
                    Change Email
                  </button>
                  {emailCountdown > 0 ? (
                    <span className="text-slate-400 font-mono font-semibold">Resend in {emailCountdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendNewEmailOtp}
                      className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} /> Resend OTP
                    </button>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyNewEmailOtp()}
                    disabled={emailModalLoading || emailStep2Digits.some(d => d === '')}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {emailModalLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    <span>Verify & Link Email</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
