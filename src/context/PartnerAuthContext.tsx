import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { IBPStore } from '../types';

export interface PartnerUser {
  uid: string;
  storeId: string;
  role: 'PARTNER_OWNER' | 'PARTNER_MANAGER' | 'PARTNER_STAFF';
  status: 'ACTIVE' | 'INACTIVE' | 'DISABLED';
  displayName?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PartnerAuthContextType {
  partnerUser: PartnerUser | null;
  partnerStore: IBPStore | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  verifyPartnerSession: (uid: string) => Promise<boolean>;
  logoutPartner: () => Promise<void>;
}

const PartnerAuthContext = createContext<PartnerAuthContextType | undefined>(undefined);

export function PartnerAuthProvider({ children }: { children: ReactNode }) {
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null);
  const [partnerStore, setPartnerStore] = useState<IBPStore | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const verifyPartnerSession = async (uid: string): Promise<boolean> => {
    try {
      setError(null);
      const res = await fetch('/api/partner/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPartnerUser(data.partnerUser);
        setPartnerStore(data.partnerStore);
        return true;
      } else {
        setPartnerUser(null);
        setPartnerStore(null);
        setError(data.error || 'Access Denied: You are not an authorized active Partner Store user.');
        return false;
      }
    } catch (err: any) {
      console.error('[PartnerAuth] Verification error:', err);
      setPartnerUser(null);
      setPartnerStore(null);
      setError('An error occurred while verifying partner access permissions.');
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await verifyPartnerSession(user.uid);
      } else {
        setPartnerUser(null);
        setPartnerStore(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logoutPartner = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('[PartnerAuth] Sign out error:', e);
    } finally {
      setPartnerUser(null);
      setPartnerStore(null);
      setFirebaseUser(null);
      setError(null);
      sessionStorage.clear();
      window.location.href = '/partner/login';
    }
  };

  return (
    <PartnerAuthContext.Provider
      value={{
        partnerUser,
        partnerStore,
        firebaseUser,
        loading,
        error,
        clearError,
        verifyPartnerSession,
        logoutPartner
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function usePartnerAuth() {
  const context = useContext(PartnerAuthContext);
  if (!context) {
    throw new Error('usePartnerAuth must be used within a PartnerAuthProvider');
  }
  return context;
}
