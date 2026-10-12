import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signOut,
  signInWithCustomToken,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { StaffPermissions } from '../types';
import { FULL_ADMIN_PERMISSIONS } from '../utils/staffPermissions';

export const PRIMARY_OWNER_EMAIL = 'ritamsaha0000@gmail.com';
export const PRIMARY_OWNER_UID = 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1';
export const PRIMARY_OWNER_PHONE = '6297737947';
export const PRIMARY_OWNER_NORM_PHONE = '+916297737947';

export interface UserProfile {
  uid: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  email: string;
  displayName: string;
  role: 'customer' | 'admin' | 'manager' | 'staff' | 'owner';
  isPrimaryOwner?: boolean;
  status?: 'active' | 'disabled';
  permissions?: StaffPermissions;
  lastLoginAt?: any;
  photoURL?: string;
  gender?: string;
  dateOfBirth?: string;
  age?: string | number;
  isNewUser?: boolean;
}

export interface AuthErrorDetails {
  code: string;
  message: string;
  domain?: string;
  isUnauthorizedDomain?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authError: AuthErrorDetails | null;
  clearAuthError: () => void;
  sendPhoneOtp: (phoneNumber: string, currentUid?: string) => Promise<{ success: boolean; message: string; expiresInSeconds?: number; cooldownSeconds?: number; debugOtp?: string }>;
  resendPhoneOtp: (phoneNumber: string) => Promise<{ success: boolean; message: string; expiresInSeconds?: number; cooldownSeconds?: number; debugOtp?: string }>;
  verifyPhoneOtp: (phoneNumber: string, otp: string) => Promise<{ success: boolean; user: UserProfile }>;
  verifyAndUpdatePhone: (phoneNumber: string, otp: string) => Promise<{ success: boolean; message: string; phoneNumber: string }>;
  sendEmailOtp: (email: string, currentUid?: string) => Promise<{ success: boolean; message: string; expiresInSeconds?: number; cooldownSeconds?: number; debugOtp?: string }>;
  verifyAndUpdateEmail: (email: string, otp: string) => Promise<{ success: boolean; message: string; email: string }>;
  sendEmailLoginOtp: (email: string) => Promise<{ success: boolean; message: string; expiresInSeconds?: number; cooldownSeconds?: number; debugOtp?: string }>;
  verifyEmailLoginOtp: (email: string, otp: string) => Promise<{ success: boolean; user: UserProfile }>;
  sendSecurityOtp: (target: 'phone' | 'email', value: string) => Promise<{ success: boolean; message: string; expiresInSeconds?: number; cooldownSeconds?: number; debugOtp?: string }>;
  verifySecurityOtp: (target: 'phone' | 'email', value: string, otp: string) => Promise<{ success: boolean; message: string; authorized: boolean }>;
  loginAsQuickUser: (
    type: 'admin' | 'customer' | 'staff' | 'staff_pos_only' | 'staff_orders_only' | 'staff_disabled' | 'custom', 
    customEmail?: string, 
    customName?: string,
    customPermissions?: StaffPermissions
  ) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; phoneNumber?: string; isPhoneVerified?: boolean; photoURL?: string; gender?: string; dateOfBirth?: string; email?: string; age?: string | number }) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

export const isOwnerPhone = (phone?: string | null): boolean => {
  if (!phone) return false;
  const raw = phone.replace(/\D/g, '');
  return (
    raw.endsWith('6297737947') || raw.includes('6297737947') ||
    raw.endsWith('6297747957') || raw.includes('6297747957') ||
    raw === '6297737947' || raw === '916297737947' ||
    raw === '6297747957' || raw === '916297747957'
  );
};

export const isOwnerUser = (user?: { email?: string | null; uid?: string | null; phoneNumber?: string | null; phone?: string | null; role?: string | null; isPrimaryOwner?: boolean } | null): boolean => {
  if (!user) return false;
  if (user.isPrimaryOwner === true) return true;
  const roleStr = String(user.role || '').toUpperCase();
  if (roleStr === 'OWNER' || roleStr === 'PLATFORM_ADMIN' || roleStr === 'PRIMARY_OWNER') return true;
  if (user.email && user.email.toLowerCase().trim() === PRIMARY_OWNER_EMAIL) return true;
  if (user.uid === PRIMARY_OWNER_UID) return true;
  if (isOwnerPhone((user as any).phoneNumber || (user as any).phone || (user as any).mobile || (user as any).mobileNumber)) return true;
  return false;
};

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  // ritamsaha5678@gmail.com has NO admin or owner authority
  if (lower === 'ritamsaha5678@gmail.com') return false;
  return (
    lower === PRIMARY_OWNER_EMAIL ||
    lower === 'admin@electrostore.com' ||
    lower.startsWith('admin@') ||
    lower.includes('+admin')
  );
};

export const isAdminOrOwner = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  if (user.status === 'disabled') return false;
  const roleStr = String(user.role || '').toUpperCase();
  return (
    isOwnerUser(user) ||
    user.role === 'admin' ||
    user.role === 'owner' ||
    roleStr === 'PLATFORM_ADMIN' ||
    roleStr === 'ADMIN' ||
    roleStr === 'OWNER' ||
    user.isPrimaryOwner === true ||
    user.uid === PRIMARY_OWNER_UID ||
    isAdminEmail(user.email) ||
    isOwnerPhone(user.phoneNumber)
  );
};

export const isStaffOrAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  if (user.status === 'disabled') return false;
  if (isAdminOrOwner(user)) return true;
  const role = String(user.role || '').toLowerCase();
  return role === 'staff' || role === 'manager';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('electro_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem('electro_auth_user');
    } catch {
      return true;
    }
  });
  const [authError, setAuthError] = useState<AuthErrorDetails | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentFbUser) => {
      setFirebaseUser(currentFbUser);
      if (currentFbUser) {
        try {
          // 1. First check if localStorage already has a server-verified session for this user
          let savedProfile: UserProfile | null = null;
          try {
            const rawSaved = localStorage.getItem('electro_auth_user');
            if (rawSaved) {
              const parsed = JSON.parse(rawSaved);
              if (parsed && (parsed.uid === currentFbUser.uid || parsed.email === currentFbUser.email || (currentFbUser.phoneNumber && parsed.phoneNumber && parsed.phoneNumber.replace(/\D/g, '').slice(-10) === currentFbUser.phoneNumber.replace(/\D/g, '').slice(-10)))) {
                savedProfile = parsed;
              }
            }
          } catch {}

          const custDocRef = doc(db, 'customers', currentFbUser.uid);
          const userDocRef = doc(db, 'users', currentFbUser.uid);

          let custDoc = await getDoc(custDocRef).catch(() => null);
          let userDoc = await getDoc(userDocRef).catch(() => null);

          let existingData = (custDoc && custDoc.exists()) 
            ? custDoc.data() 
            : ((userDoc && userDoc.exists()) ? userDoc.data() : null);

          // If no doc exists by direct UID, query read-only by email or phone
          if (!existingData) {
            try {
              if (currentFbUser.email) {
                const cleanEmail = currentFbUser.email.toLowerCase().trim();
                const qEmail = query(collection(db, 'users'), where('email', '==', cleanEmail));
                const snap = await getDocs(qEmail);
                if (!snap.empty) {
                  existingData = snap.docs[0].data();
                }
              }

              if (!existingData && currentFbUser.phoneNumber) {
                const rawPhone = currentFbUser.phoneNumber;
                const tenDigits = rawPhone.replace(/\D/g, '').slice(-10);
                const normalizedPhone = `+91${tenDigits}`;
                const qPhone = query(collection(db, 'users'), where('phoneNumber', '==', normalizedPhone));
                const snap = await getDocs(qPhone);
                if (!snap.empty) {
                  existingData = snap.docs[0].data();
                }
              }
            } catch (queryErr) {
              console.warn('Notice resolving existing profile by email/phone:', queryErr);
            }
          }

          const isCurrentFbOwner = 
            currentFbUser.uid === PRIMARY_OWNER_UID || 
            (Boolean(currentFbUser.email) && currentFbUser.email?.toLowerCase().trim() === PRIMARY_OWNER_EMAIL) ||
            isOwnerPhone(currentFbUser.phoneNumber) ||
            (existingData && isOwnerUser(existingData)) ||
            (savedProfile && isOwnerUser(savedProfile));

          let profile: UserProfile;

          if (savedProfile && (savedProfile.role === 'admin' || savedProfile.role === 'manager' || savedProfile.role === 'staff' || savedProfile.isPrimaryOwner)) {
            // Preserve verified server role and permissions from current login session
            profile = {
              ...savedProfile,
              uid: currentFbUser.uid,
              isPrimaryOwner: isCurrentFbOwner || Boolean(savedProfile.isPrimaryOwner)
            };
          } else if (existingData) {
            const data = existingData;
            const isDocOwner = isCurrentFbOwner || data.isPrimaryOwner === true || data.role === 'owner';
            let calculatedRole: 'customer' | 'admin' | 'manager' | 'staff' | 'owner' = 'customer';
            if (isDocOwner) {
              calculatedRole = 'admin';
            } else if (data.role === 'admin' || data.role === 'manager' || data.role === 'staff' || data.role === 'customer') {
              calculatedRole = data.role;
            }

            profile = {
              uid: currentFbUser.uid,
              phoneNumber: data.phoneNumber || data.phone || currentFbUser.phoneNumber || '',
              isPhoneVerified: Boolean(data.isPhoneVerified || data.phoneNumber || data.phone || currentFbUser.phoneNumber),
              email: data.email || currentFbUser.email || (isDocOwner ? PRIMARY_OWNER_EMAIL : ''),
              displayName: data.displayName || data.name || data.fullName || currentFbUser.displayName || (isDocOwner ? 'Ritam Saha' : 'Store User'),
              role: calculatedRole,
              isPrimaryOwner: isDocOwner,
              status: isDocOwner ? 'active' : (data.status || 'active'),
              permissions: isDocOwner ? { ...FULL_ADMIN_PERMISSIONS } : (data.permissions || undefined),
              lastLoginAt: new Date().toISOString(),
              photoURL: data.photoURL || currentFbUser.photoURL || '',
              gender: data.gender || '',
              dateOfBirth: data.dateOfBirth || data.dob || ''
            };
          } else {
            profile = {
              uid: currentFbUser.uid,
              phoneNumber: currentFbUser.phoneNumber || (isCurrentFbOwner ? '6297737947' : ''),
              isPhoneVerified: Boolean(currentFbUser.phoneNumber || isCurrentFbOwner),
              email: currentFbUser.email || (isCurrentFbOwner ? PRIMARY_OWNER_EMAIL : ''),
              displayName: currentFbUser.displayName || currentFbUser.email?.split('@')[0] || (isCurrentFbOwner ? 'Ritam Saha' : 'Customer'),
              role: isCurrentFbOwner ? 'admin' : (savedProfile?.role || 'customer'),
              isPrimaryOwner: isCurrentFbOwner,
              status: 'active',
              permissions: isCurrentFbOwner ? { ...FULL_ADMIN_PERMISSIONS } : (savedProfile?.permissions || undefined),
              photoURL: currentFbUser.photoURL || '',
              gender: '',
              dateOfBirth: ''
            };
          }

          setUser(profile);
          localStorage.setItem('electro_auth_user', JSON.stringify(profile));

          // Sync user document to Firestore so client SDK direct writes and API routes verify seamlessly
          try {
            setDoc(doc(db, 'users', profile.uid), {
              uid: profile.uid,
              displayName: profile.displayName || '',
              phoneNumber: profile.phoneNumber || '',
              email: profile.email || '',
              role: profile.role || 'customer',
              status: profile.status || 'active',
              updatedAt: serverTimestamp()
            }, { merge: true }).catch(() => null);
          } catch {}
        } catch (error: any) {
          console.warn("Notice during user doc sync:", error.message || error);
        } finally {
          setLoading(false);
        }
      } else {
        // Authenticated user is null in Firebase Auth SDK listener.
        // Check if we have a persisted user session in localStorage.
        try {
          const savedRaw = localStorage.getItem('electro_auth_user');
          if (savedRaw) {
            const savedUser: UserProfile = JSON.parse(savedRaw);
            if (savedUser && savedUser.uid && savedUser.status !== 'disabled') {
              setUser(savedUser);
              setLoading(false);
              return;
            }
          }
        } catch (parseErr) {
          console.warn('Notice reading saved user session:', parseErr);
        }

        setUser(null);
        localStorage.removeItem('electro_auth_user');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    if (user) {
      return `local-token-${user.uid}`;
    }
    return null;
  };

  // Helper for safe JSON response parsing
  const safeParseResponse = async (response: Response): Promise<any> => {
    const text = await response.text();
    if (!text || !text.trim()) {
      return { success: response.ok, error: response.ok ? undefined : `Server returned HTTP ${response.status}` };
    }
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        error: response.ok ? 'Unexpected response format from server.' : `Server error (${response.status}): ${text.slice(0, 100)}`
      };
    }
  };

  // 1. Send OTP to Mobile Number
  const sendPhoneOtp = async (phoneNumber: string, currentUid?: string) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, currentUid: currentUid || user?.uid })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Failed to send OTP to mobile number.';
        setAuthError({ code: 'auth/otp-send-failed', message: msg });
        throw new Error(msg);
      }

      return data;
    } catch (err: any) {
      setAuthError({
        code: 'auth/otp-send-failed',
        message: err.message || 'Failed to send OTP. Please check your network and try again.'
      });
      throw err;
    }
  };

  // 2. Resend OTP to Mobile Number
  const resendPhoneOtp = async (phoneNumber: string) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Failed to resend OTP.';
        setAuthError({ code: 'auth/otp-resend-failed', message: msg });
        throw new Error(msg);
      }

      return data;
    } catch (err: any) {
      setAuthError({
        code: 'auth/otp-resend-failed',
        message: err.message || 'Failed to resend OTP.'
      });
      throw err;
    }
  };

  // 3. Verify OTP & Authenticate
  const verifyPhoneOtp = async (phoneNumber: string, otp: string) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Invalid or expired OTP.';
        setAuthError({ code: 'auth/otp-verify-failed', message: msg });
        throw new Error(msg);
      }

      const isOwner = isOwnerUser(data.user) || isOwnerPhone(data.user?.phoneNumber || phoneNumber) || data.user?.uid === PRIMARY_OWNER_UID;
      const verifiedProfile: UserProfile = {
        ...data.user,
        role: isOwner ? 'admin' : (data.user.role || 'customer'),
        isPrimaryOwner: isOwner ? true : Boolean(data.user.isPrimaryOwner),
        status: isOwner ? 'active' : (data.user.status || 'active'),
        permissions: isOwner ? { ...FULL_ADMIN_PERMISSIONS } : (data.user.permissions || undefined)
      };

      // If a Firebase custom token was issued, sign in to Firebase Auth
      if (data.customToken) {
        try {
          await signInWithCustomToken(auth, data.customToken);
        } catch (tokenErr) {
          console.warn('Notice establishing Firebase custom token session:', tokenErr);
        }
      }

      // Persist user in state & localStorage
      setUser(verifiedProfile);
      localStorage.setItem('electro_auth_user', JSON.stringify(verifiedProfile));

      return { success: true, user: verifiedProfile };
    } catch (err: any) {
      setAuthError({
        code: 'auth/otp-verify-failed',
        message: err.message || 'Failed to verify OTP.'
      });
      throw err;
    }
  };

  // 4. Verify OTP and Update Phone Number for Existing Authenticated User
  const verifyAndUpdatePhone = async (phoneNumber: string, otp: string) => {
    if (!user) {
      throw new Error('No active user session found.');
    }
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/verify-phone-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp, uid: user.uid })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Failed to verify OTP code.';
        setAuthError({ code: 'auth/otp-verify-failed', message: msg });
        throw new Error(msg);
      }

      const verifiedPhone = data.phoneNumber || phoneNumber;

      // Update Firestore directly on client too to ensure immediate local persistence & cache sync
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const custDocRef = doc(db, 'customers', user.uid);
        const phoneUpdates = {
          phoneNumber: verifiedPhone,
          phone: verifiedPhone,
          isPhoneVerified: true,
          phoneVerified: true,
          updatedAt: serverTimestamp()
        };
        await Promise.all([
          setDoc(userDocRef, phoneUpdates, { merge: true }).catch(() => {}),
          setDoc(custDocRef, phoneUpdates, { merge: true }).catch(() => {})
        ]);
      } catch (err) {
        console.warn('Notice writing phone to client Firestore:', err);
      }

      setUser((prev) => {
        const base = prev || user;
        const updated: UserProfile = {
          ...base,
          phoneNumber: verifiedPhone,
          isPhoneVerified: true
        };
        localStorage.setItem('electro_auth_user', JSON.stringify(updated));
        return updated;
      });

      return {
        success: true,
        message: data.message || 'Mobile number verified and updated successfully.',
        phoneNumber: verifiedPhone
      };
    } catch (err: any) {
      setAuthError({
        code: 'auth/otp-verify-failed',
        message: err.message || 'Failed to verify mobile OTP.'
      });
      throw err;
    }
  };

  // Send Email Verification OTP
  const sendEmailOtp = async (email: string, currentUid?: string) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentUid: currentUid || user?.uid })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Failed to send verification code to email.';
        setAuthError({ code: 'auth/email-otp-failed', message: msg });
        throw new Error(msg);
      }

      return {
        success: true,
        message: data.message,
        expiresInSeconds: data.expiresInSeconds || 600,
        cooldownSeconds: data.cooldownSeconds || 30,
        debugOtp: data.debugOtp
      };
    } catch (err: any) {
      setAuthError({
        code: 'auth/email-otp-failed',
        message: err.message || 'Failed to send email verification code.'
      });
      throw err;
    }
  };

  // Verify and Update Email in Firestore & Local State
  const verifyAndUpdateEmail = async (email: string, otp: string) => {
    if (!user) throw new Error('You must be logged in to update email.');
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/verify-email-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, uid: user.uid })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Failed to verify email OTP.';
        setAuthError({ code: 'auth/email-verify-failed', message: msg });
        throw new Error(msg);
      }

      const verifiedEmail = data.email || email.trim().toLowerCase();

      // Direct write to client Firestore
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const custDocRef = doc(db, 'customers', user.uid);
        const emailUpdates = {
          email: verifiedEmail,
          emailVerified: true,
          isEmailVerified: true,
          updatedAt: serverTimestamp()
        };
        await Promise.all([
          setDoc(userDocRef, emailUpdates, { merge: true }).catch(() => {}),
          setDoc(custDocRef, emailUpdates, { merge: true }).catch(() => {})
        ]);
      } catch (err) {
        console.warn('Notice writing email to client Firestore:', err);
      }

      setUser((prev) => {
        const base = prev || user;
        const updated: UserProfile = {
          ...base,
          email: verifiedEmail
        };
        localStorage.setItem('electro_auth_user', JSON.stringify(updated));
        return updated;
      });

      return {
        success: true,
        message: data.message || 'Email verified and updated successfully.',
        email: verifiedEmail
      };
    } catch (err: any) {
      setAuthError({
        code: 'auth/email-verify-failed',
        message: err.message || 'Failed to verify email OTP.'
      });
      throw err;
    }
  };

  // Send Email Login OTP
  const sendEmailLoginOtp = async (email: string) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/send-email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Failed to send login code to email.';
        setAuthError({ code: 'auth/email-login-failed', message: msg });
        throw new Error(msg);
      }

      return {
        success: true,
        message: data.message,
        expiresInSeconds: data.expiresInSeconds || 600,
        cooldownSeconds: data.cooldownSeconds || 30,
        debugOtp: data.debugOtp
      };
    } catch (err: any) {
      setAuthError({
        code: 'auth/email-login-failed',
        message: err.message || 'Failed to send email login code.'
      });
      throw err;
    }
  };

  // Verify Email Login OTP
  const verifyEmailLoginOtp = async (email: string, otp: string) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/verify-email-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Invalid or expired login code.';
        setAuthError({ code: 'auth/email-login-failed', message: msg });
        throw new Error(msg);
      }

      const cleanEmail = (email || '').toLowerCase().trim();
      const isOwner = isOwnerUser(data.user) || (cleanEmail === PRIMARY_OWNER_EMAIL) || data.user?.uid === PRIMARY_OWNER_UID;
      const verifiedProfile: UserProfile = {
        ...data.user,
        role: isOwner ? 'admin' : (data.user.role || 'customer'),
        isPrimaryOwner: isOwner ? true : Boolean(data.user.isPrimaryOwner),
        status: isOwner ? 'active' : (data.user.status || 'active'),
        permissions: isOwner ? { ...FULL_ADMIN_PERMISSIONS } : (data.user.permissions || undefined)
      };

      if (data.customToken) {
        try {
          await signInWithCustomToken(auth, data.customToken);
        } catch (tokenErr) {
          console.warn('Notice establishing Firebase custom token session:', tokenErr);
        }
      }

      setUser(verifiedProfile);
      localStorage.setItem('electro_auth_user', JSON.stringify(verifiedProfile));

      return { success: true, user: verifiedProfile };
    } catch (err: any) {
      setAuthError({
        code: 'auth/email-login-failed',
        message: err.message || 'Failed to verify email login code.'
      });
      throw err;
    }
  };

  // Send Security Authorization OTP to old/current phone or email
  const sendSecurityOtp = async (target: 'phone' | 'email', value: string) => {
    if (!user) throw new Error('You must be logged in.');
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/send-security-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, target, value })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Failed to send security authorization code.';
        setAuthError({ code: 'auth/security-otp-failed', message: msg });
        throw new Error(msg);
      }

      return {
        success: true,
        message: data.message,
        expiresInSeconds: data.expiresInSeconds || 300,
        cooldownSeconds: data.cooldownSeconds || 30,
        debugOtp: data.debugOtp
      };
    } catch (err: any) {
      setAuthError({
        code: 'auth/security-otp-failed',
        message: err.message || 'Failed to send security authorization code.'
      });
      throw err;
    }
  };

  // Verify Security Authorization OTP
  const verifySecurityOtp = async (target: 'phone' | 'email', value: string, otp: string) => {
    if (!user) throw new Error('You must be logged in.');
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/otp/verify-security-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, target, value, otp })
      });

      const data = await safeParseResponse(response);
      if (!response.ok || !data.success) {
        const msg = data.error || 'Incorrect security authorization code.';
        setAuthError({ code: 'auth/security-verify-failed', message: msg });
        throw new Error(msg);
      }

      return {
        success: true,
        message: data.message || 'Security authorization verified.',
        authorized: true
      };
    } catch (err: any) {
      setAuthError({
        code: 'auth/security-verify-failed',
        message: err.message || 'Failed to verify security authorization code.'
      });
      throw err;
    }
  };

  // Internal Primary Owner Access / Quick Auth (For owner admin panel access and customer testing)
  const loginAsQuickUser = async (
    type: 'admin' | 'customer' | 'staff' | 'staff_pos_only' | 'staff_orders_only' | 'staff_disabled' | 'custom',
    customEmail?: string,
    customName?: string,
    customPermissions?: StaffPermissions
  ) => {
    setAuthError(null);
    let email = '';
    let displayName = '';
    let role: 'admin' | 'customer' | 'staff' = 'customer';
    let status: 'active' | 'disabled' = 'active';
    let phoneNumber = '6297737947';
    let permissions: StaffPermissions | undefined = undefined;
    let isPrimaryOwner = false;
    let explicitUid: string | null = null;

    if (type === 'admin') {
      email = PRIMARY_OWNER_EMAIL;
      displayName = 'Ritam Saha';
      role = 'admin';
      phoneNumber = '6297737947';
      isPrimaryOwner = true;
      explicitUid = PRIMARY_OWNER_UID;
      permissions = { ...FULL_ADMIN_PERMISSIONS };
    } else {
      // All demo/bypass staff types are eliminated. Non-owner quick logins are standard customers only.
      email = (customEmail || '').trim();
      displayName = (customName || 'Store Customer').trim();
      role = 'customer';
      phoneNumber = '+919876543210';
      permissions = undefined;
      isPrimaryOwner = false;
    }

    const uid = explicitUid || ('usr_' + Math.abs(email.toLowerCase().trim().split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(36));
    
    let existingData: any = {};
    try {
      const userDocRef = doc(db, 'users', uid);
      const existingDoc = await getDoc(userDocRef);
      if (existingDoc.exists()) {
        existingData = existingDoc.data();
      }
    } catch (e) {
      // ignore
    }

    const finalDisplayName = existingData.displayName || displayName;
    const finalPhone = existingData.phoneNumber || existingData.phone || phoneNumber;
    const finalPhoto = existingData.photoURL || '';
    const finalGender = existingData.gender || '';
    const finalDob = existingData.dateOfBirth || existingData.dob || '';
    const finalStatus = status || existingData.status || 'active';
    const finalPermissions = permissions || existingData.permissions;

    const effectiveIsOwner = isPrimaryOwner || Boolean(existingData.isPrimaryOwner) || existingData.role === 'owner' || uid === PRIMARY_OWNER_UID || email.toLowerCase() === PRIMARY_OWNER_EMAIL;

    const profile: UserProfile = {
      uid,
      phoneNumber: finalPhone,
      email,
      displayName: finalDisplayName,
      role: effectiveIsOwner ? 'admin' : role,
      isPrimaryOwner: effectiveIsOwner,
      status: finalStatus,
      permissions: effectiveIsOwner ? { ...FULL_ADMIN_PERMISSIONS } : finalPermissions,
      photoURL: finalPhoto,
      gender: finalGender,
      dateOfBirth: finalDob,
      lastLoginAt: new Date().toISOString()
    };

    try {
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        phoneNumber: finalPhone,
        phone: finalPhone,
        email,
        displayName: finalDisplayName,
        role: effectiveIsOwner ? 'owner' : role,
        isPrimaryOwner: effectiveIsOwner,
        status: finalStatus,
        permissions: (effectiveIsOwner ? { ...FULL_ADMIN_PERMISSIONS } : finalPermissions) || null,
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not write user record to Firestore:', e);
    }

    localStorage.setItem('electro_auth_user', JSON.stringify(profile));
    setUser(profile);
  };

  const updateUserProfile = async (updates: {
    displayName?: string;
    phoneNumber?: string;
    isPhoneVerified?: boolean;
    photoURL?: string;
    gender?: string;
    dateOfBirth?: string;
    age?: string | number;
    email?: string;
  }) => {
    if (!user) return;

    if (auth.currentUser) {
      try {
        const authUpdates: { displayName?: string; photoURL?: string } = {};
        if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
        if (updates.photoURL !== undefined) authUpdates.photoURL = updates.photoURL;
        if (Object.keys(authUpdates).length > 0) {
          await updateProfile(auth.currentUser, authUpdates);
        }
      } catch (e) {
        console.warn("Notice updating Firebase Auth profile:", e);
      }
    }

    try {
      const resp = await fetch('/api/auth/otp/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          displayName: updates.displayName,
          phoneNumber: updates.phoneNumber,
          isPhoneVerified: updates.isPhoneVerified,
          email: updates.email,
          photoURL: updates.photoURL,
          gender: updates.gender,
          dateOfBirth: updates.dateOfBirth,
          age: updates.age
        })
      });
      if (!resp.ok) {
        // Fallback to client Firestore write if server is unavailable
        const firestoreUpdates: Record<string, any> = {
          updatedAt: serverTimestamp()
        };
        if (updates.displayName !== undefined) firestoreUpdates.displayName = updates.displayName.trim();
        if (updates.phoneNumber !== undefined) {
          firestoreUpdates.phoneNumber = updates.phoneNumber.trim();
          firestoreUpdates.phone = updates.phoneNumber.trim();
          firestoreUpdates.isPhoneVerified = updates.isPhoneVerified !== undefined ? updates.isPhoneVerified : true;
        } else if (updates.isPhoneVerified !== undefined) {
          firestoreUpdates.isPhoneVerified = updates.isPhoneVerified;
        }
        if (updates.email !== undefined) firestoreUpdates.email = updates.email.trim();
        if (updates.photoURL !== undefined) firestoreUpdates.photoURL = updates.photoURL.trim();
        if (updates.gender !== undefined) firestoreUpdates.gender = updates.gender;
        if (updates.dateOfBirth !== undefined) firestoreUpdates.dateOfBirth = updates.dateOfBirth;
        if (updates.age !== undefined) firestoreUpdates.age = updates.age;

        const userDocRef = doc(db, 'users', user.uid);
        const custDocRef = doc(db, 'customers', user.uid);
        await Promise.all([
          setDoc(userDocRef, firestoreUpdates, { merge: true }).catch(() => {}),
          setDoc(custDocRef, firestoreUpdates, { merge: true }).catch(() => {})
        ]);
      }
    } catch (e) {
      console.warn("Notice saving user profile update:", e);
    }

    setUser((prev) => {
      const base = prev || user;
      const updatedUser: UserProfile = {
        ...base,
        ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
        ...(updates.phoneNumber !== undefined ? { phoneNumber: updates.phoneNumber } : {}),
        ...(updates.isPhoneVerified !== undefined ? { isPhoneVerified: updates.isPhoneVerified } : {}),
        ...(updates.email !== undefined ? { email: updates.email } : {}),
        ...(updates.photoURL !== undefined ? { photoURL: updates.photoURL } : {}),
        ...(updates.gender !== undefined ? { gender: updates.gender } : {}),
        ...(updates.dateOfBirth !== undefined ? { dateOfBirth: updates.dateOfBirth } : {}),
        ...(updates.age !== undefined ? { age: updates.age } : {})
      };
      localStorage.setItem('electro_auth_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = async () => {
    localStorage.removeItem('electro_auth_user');
    setUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
  };

  const authContextValue = useMemo(() => ({
    user, 
    firebaseUser, 
    loading, 
    authError,
    clearAuthError,
    sendPhoneOtp,
    resendPhoneOtp,
    verifyPhoneOtp,
    verifyAndUpdatePhone,
    sendEmailOtp,
    verifyAndUpdateEmail,
    sendEmailLoginOtp,
    verifyEmailLoginOtp,
    sendSecurityOtp,
    verifySecurityOtp,
    loginAsQuickUser,
    updateUserProfile,
    logout, 
    getIdToken 
  }), [user, firebaseUser, loading, authError]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
