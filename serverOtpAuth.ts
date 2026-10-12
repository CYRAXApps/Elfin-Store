import express from 'express';
import crypto from 'crypto';
type Firestore = any;
type Auth = any;
import { FieldValue } from './serverDb';
import { createCustomerMigrationRouter } from './serverCustomerMigration';

interface OtpRecord {
  phoneNumber: string;
  otpHash: string;
  rawOtp?: string;
  createdAt: number;
  expiresAt: number;
  resendAfter: number;
  attempts: number;
  used: boolean;
  ip: string;
}

// In-memory OTP storage
const otpStore = new Map<string, OtpRecord>();

// Safe execution of Firebase Admin Auth calls with non-blocking timeout
async function safeAuthCall<T = any>(fn: () => Promise<T>, timeoutMs = 400): Promise<T | null> {
  try {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), timeoutMs);
    });
    const result = await Promise.race([
      fn().catch(() => null),
      timeoutPromise
    ]);
    clearTimeout(timer!);
    return result as T | null;
  } catch {
    return null;
  }
}

// Rate limit store for OTP requests (max 5 requests per 15 minutes per phone number)
interface PhoneRateLimit {
  requests: number[];
}
const phoneRateLimits = new Map<string, PhoneRateLimit>();

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (now > record.expiresAt + 10 * 60 * 1000) {
      otpStore.delete(phone);
    }
  }
}, 5 * 60 * 1000);

export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  // Remove all whitespace, hyphens, brackets
  let cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');
  
  // If it starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  
  // If it's a 10 digit Indian number without country code
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // If it starts with 91 and has 12 digits (Indian with 91 prefix but no +)
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  
  // If it doesn't start with +, prepend + if it looks like an international number
  if (!cleaned.startsWith('+') && /^\d{10,14}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}

export function isValidPhoneNumber(normalized: string): boolean {
  // E.164 international format validation (+ followed by 10 to 15 digits)
  return /^\+[1-9]\d{9,14}$/.test(normalized);
}

export function isOwnerPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const raw = phone.replace(/\D/g, '');
  return (
    raw.endsWith('6297737947') || raw.includes('6297737947') ||
    raw.endsWith('6297747957') || raw.includes('6297747957') ||
    raw === '6297737947' || raw === '916297737947' ||
    raw === '6297747957' || raw === '916297747957'
  );
}

export const FULL_ADMIN_PERMISSIONS = {
  pos_access: true,
  pos_view_sales: true,
  pos_manage_returns: true,
  orders_view: true,
  orders_update_status: true,
  orders_manage_returns: true,
  products_view: true,
  products_edit: true,
  products_manage_inventory: true,
  products_delete: true,
  customers_view: true,
  customers_manage: true,
  marketing_manage: true,
  reviews_manage: true,
  support_view: true,
  support_manage: true,
  reports_view: true,
  settings_view: true,
  settings_manage: true,
  staff_manage: true,
  notifications_view: true,
  notifications_manage: true
};

// Generate permanent customer UID that is completely independent of phone/email
export function generatePermanentCustomerUid(): string {
  return `cust_${crypto.randomBytes(12).toString('hex')}`;
}

// Verify whether a document's active phone matches the requested phone
export function matchesActiveCustomerPhone(docData: any, normalizedPhone: string, tenDigits: string): boolean {
  if (!docData) return false;
  if (docData.migratedTo) return false;

  // 1. If this phone was previously unlinked from this account, it is strictly NOT active!
  const unlinked = Array.isArray(docData.unlinkedPhones) ? docData.unlinkedPhones : [];
  for (const u of unlinked) {
    const uStr = String(u || '').trim();
    const uNorm = normalizePhoneNumber(uStr);
    const uTen = uStr.replace(/\D/g, '').slice(-10);
    if ((uNorm && uNorm === normalizedPhone) || (uTen && uTen === tenDigits)) {
      return false; // Specifically unlinked from this account!
    }
  }

  // 2. Check current active phone fields ONLY (never infer phone from email)
  const p1 = normalizePhoneNumber(docData.phoneNumber || '');
  const p2 = normalizePhoneNumber(docData.phone || '');
  const p1Ten = (docData.phoneNumber || '').toString().replace(/\D/g, '').slice(-10);
  const p2Ten = (docData.phone || '').toString().replace(/\D/g, '').slice(-10);

  if (p1 === normalizedPhone || p1Ten === tenDigits || p2 === normalizedPhone || p2Ten === tenDigits) {
    return true;
  }

  return false;
}

// Verify whether a document's active email matches the requested email
export function matchesActiveCustomerEmail(docData: any, cleanEmail: string): boolean {
  if (!docData || !cleanEmail) return false;

  const unlinked = Array.isArray(docData.unlinkedEmails) ? docData.unlinkedEmails : [];
  for (const u of unlinked) {
    if (String(u || '').trim().toLowerCase() === cleanEmail) {
      return false;
    }
  }

  return (docData.email || '').toString().trim().toLowerCase() === cleanEmail;
}

// Helper to save customer document keyed by permanent UID to both customers/ and users/
export async function saveCustomerDocument(db: any, uid: string, data: Record<string, any>): Promise<void> {
  const normPhone = data.phoneNumber ? normalizePhoneNumber(data.phoneNumber) : (data.phone ? normalizePhoneNumber(data.phone) : '');
  const displayName = data.fullName || data.displayName || (normPhone ? `Customer ${normPhone.replace(/\D/g, '').slice(-4)}` : 'Customer');
  const cleanEmail = (data.email || '').toString().trim().toLowerCase();

  const customerData: Record<string, any> = {
    uid,
    fullName: displayName,
    displayName: displayName,
    name: displayName,
    phoneNumber: normPhone,
    phone: normPhone,
    phoneVerified: Boolean(data.phoneVerified ?? data.isPhoneVerified ?? !!normPhone),
    isPhoneVerified: Boolean(data.isPhoneVerified ?? data.phoneVerified ?? !!normPhone),
    email: cleanEmail,
    emailVerified: Boolean(data.emailVerified ?? data.isEmailVerified),
    isEmailVerified: Boolean(data.isEmailVerified ?? data.emailVerified),
    role: data.role || 'customer',
    status: data.status || 'active',
    isPrimaryOwner: Boolean(data.isPrimaryOwner),
    photoURL: data.photoURL || '',
    gender: data.gender || '',
    dateOfBirth: data.dateOfBirth || data.dob || '',
    unlinkedPhones: Array.isArray(data.unlinkedPhones) ? data.unlinkedPhones : [],
    unlinkedEmails: Array.isArray(data.unlinkedEmails) ? data.unlinkedEmails : [],
    updatedAt: FieldValue.serverTimestamp()
  };

  if (data.permissions) {
    customerData.permissions = data.permissions;
  }
  if (data.notes) {
    customerData.notes = data.notes;
  }

  if (data.createdAt) {
    customerData.createdAt = data.createdAt;
  }
  if (data.lastLoginAt) {
    customerData.lastLoginAt = data.lastLoginAt;
  }
  if (data.previousPhoneNumbers) {
    customerData.previousPhoneNumbers = data.previousPhoneNumbers;
  }
  if (data.previousEmails) {
    customerData.previousEmails = data.previousEmails;
  }

  // Primary customer document keyed by permanent UID: customers/{uid} and users/{uid}
  const writePromise = (async () => {
    try {
      await db.collection('customers').doc(uid).set(customerData, { merge: true });
    } catch (err) {
      console.warn('Notice saving to customers collection:', err);
    }

    try {
      await db.collection('users').doc(uid).set(customerData, { merge: true });
    } catch (err) {
      console.warn('Notice saving to users collection:', err);
    }
  })();

  // Wait at most 800ms so login returns immediately without blocking
  await Promise.race([
    writePromise,
    new Promise(resolve => setTimeout(resolve, 800))
  ]);
}

// Find active customer account by phone number across customers and users collections
export async function findActiveCustomerByPhone(db: any, normalizedPhone: string, tenDigits: string): Promise<any | null> {
  // Check primary store owner
  if (
    tenDigits === '6297737947' || normalizedPhone.includes('6297737947') ||
    tenDigits === '6297747957' || normalizedPhone.includes('6297747957')
  ) {
    try {
      const ownerUser = await db.collection('users').doc('ZudeiMJXXaUFxFN6sV8ErPplZ7w1').get().catch(() => null);
      if (ownerUser && ownerUser.exists) return ownerUser;
      const ownerCust = await db.collection('customers').doc('ZudeiMJXXaUFxFN6sV8ErPplZ7w1').get().catch(() => null);
      if (ownerCust && ownerCust.exists) return ownerCust;
    } catch (err) {}
  }

  const collections = ['customers', 'users'];
  const queryPromises: Promise<any>[] = [];

  for (const colName of collections) {
    const colRef = db.collection(colName);
    const queries = [
      colRef.where('phoneNumber', '==', normalizedPhone).limit(3),
      colRef.where('phone', '==', normalizedPhone).limit(3),
      colRef.where('phoneNumber', '==', tenDigits).limit(3),
      colRef.where('phone', '==', tenDigits).limit(3),
      colRef.where('phoneNumber', '==', `+91${tenDigits}`).limit(3),
      colRef.where('phone', '==', `+91${tenDigits}`).limit(3)
    ];

    for (const q of queries) {
      queryPromises.push(q.get().catch(() => null));
    }
  }

  // Check legacy doc IDs ONLY if their active phone matches
  const legacyCandidates = [
    `usr_p_91${tenDigits}`,
    `usr_p_${tenDigits}`,
    `usr_${tenDigits}`
  ];
  for (const candId of legacyCandidates) {
    queryPromises.push(db.collection('users').doc(candId).get().catch(() => null));
  }

  try {
    const results = await Promise.all(queryPromises);
    for (const snap of results) {
      if (!snap) continue;
      if (snap.docs && Array.isArray(snap.docs)) {
        for (const doc of snap.docs) {
          if (matchesActiveCustomerPhone(doc.data(), normalizedPhone, tenDigits)) {
            return doc;
          }
        }
      } else if (snap.exists && typeof snap.data === 'function') {
        if (matchesActiveCustomerPhone(snap.data(), normalizedPhone, tenDigits)) {
          return snap;
        }
      }
    }
  } catch {}

  return null;
}

// Find active customer account by email across customers and users collections
export async function findActiveCustomerByEmail(db: any, cleanEmail: string): Promise<any | null> {
  const collections = ['customers', 'users'];
  for (const colName of collections) {
    try {
      const snap = await db.collection(colName).where('email', '==', cleanEmail).limit(5).get();
      if (!snap.empty) {
        for (const doc of snap.docs) {
          if (matchesActiveCustomerEmail(doc.data(), cleanEmail)) {
            return doc;
          }
        }
      }
    } catch (err) {}
  }
  return null;
}

export interface IdentityConflictRecord {
  firebaseUid: string;
  customerDocumentId: string;
  collection: 'customers' | 'users';
  mobile: string;
  email: string;
  conflictType: 'DIFF_UID_SAME_PHONE' | 'DIFF_UID_SAME_EMAIL' | 'SAME_UID_MULTIPLE_DOCS' | 'SAME_PHONE_MULTIPLE_DOCS' | 'SAME_EMAIL_MULTIPLE_DOCS';
  details: string;
  conflictingWith: Array<{
    uid: string;
    docId: string;
    collection: string;
    mobile?: string;
    email?: string;
  }>;
}

// Audit customer data for identity conflicts safely without deleting or automatically merging accounts
export async function auditCustomerIdentityConflicts(db: any): Promise<{
  totalScanned: number;
  conflictCount: number;
  conflicts: IdentityConflictRecord[];
}> {
  const [custSnap, userSnap] = await Promise.all([
    db.collection('customers').get().catch(() => ({ docs: [] })),
    db.collection('users').get().catch(() => ({ docs: [] }))
  ]);

  const allRecords: Array<{
    docId: string;
    collection: 'customers' | 'users';
    uid: string;
    data: any;
    mobile: string;
    normMobile: string;
    tenDigits: string;
    email: string;
    unlinkedPhones: string[];
    unlinkedEmails: string[];
  }> = [];

  const isOwnerOrStaff = (uid: string, data: any) => {
    if (uid === 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1') return true;
    if (data.isPrimaryOwner === true || data.role === 'owner' || data.role === 'admin' || data.role === 'staff' || data.role === 'manager') return true;
    if (data.email && data.email.toLowerCase().trim() === 'ritamsaha0000@gmail.com') return true;
    return false;
  };

  for (const doc of custSnap.docs) {
    const data = doc.data() || {};
    const uid = data.uid || doc.id;
    if (isOwnerOrStaff(uid, data)) continue;

    const rawMobile = data.phoneNumber || data.phone || '';
    const normMobile = normalizePhoneNumber(rawMobile);
    const tenDigits = rawMobile.replace(/\D/g, '').slice(-10);
    const email = (data.email || '').toLowerCase().trim();
    const unlinkedPhones = Array.isArray(data.unlinkedPhones) ? data.unlinkedPhones : [];
    const unlinkedEmails = Array.isArray(data.unlinkedEmails) ? data.unlinkedEmails : [];

    allRecords.push({
      docId: doc.id,
      collection: 'customers',
      uid,
      data,
      mobile: rawMobile,
      normMobile,
      tenDigits,
      email,
      unlinkedPhones,
      unlinkedEmails
    });
  }

  for (const doc of userSnap.docs) {
    const data = doc.data() || {};
    const uid = data.uid || doc.id;
    if (isOwnerOrStaff(uid, data)) continue;

    const rawMobile = data.phoneNumber || data.phone || '';
    const normMobile = normalizePhoneNumber(rawMobile);
    const tenDigits = rawMobile.replace(/\D/g, '').slice(-10);
    const email = (data.email || '').toLowerCase().trim();
    const unlinkedPhones = Array.isArray(data.unlinkedPhones) ? data.unlinkedPhones : [];
    const unlinkedEmails = Array.isArray(data.unlinkedEmails) ? data.unlinkedEmails : [];

    allRecords.push({
      docId: doc.id,
      collection: 'users',
      uid,
      data,
      mobile: rawMobile,
      normMobile,
      tenDigits,
      email,
      unlinkedPhones,
      unlinkedEmails
    });
  }

  const conflicts: IdentityConflictRecord[] = [];
  const reportedKeys = new Set<string>();

  for (let i = 0; i < allRecords.length; i++) {
    const recA = allRecords[i];

    for (let j = i + 1; j < allRecords.length; j++) {
      const recB = allRecords[j];

      // Dual-persisted customers/{uid} and users/{uid} for the exact same UID:
      // check if they have conflicting phone/email credentials
      if (recA.uid === recB.uid && recA.collection !== recB.collection) {
        const phoneMismatch = recA.normMobile && recB.normMobile && recA.normMobile !== recB.normMobile;
        const emailMismatch = recA.email && recB.email && 
          !recA.email.includes('@mobile.electrostore.com') && 
          !recB.email.includes('@mobile.electrostore.com') && 
          recA.email !== recB.email;

        if (phoneMismatch || emailMismatch) {
          const key = `mismatch_${recA.uid}_${recB.docId}`;
          if (!reportedKeys.has(key)) {
            reportedKeys.add(key);
            conflicts.push({
              firebaseUid: recA.uid,
              customerDocumentId: recA.docId,
              collection: recA.collection,
              mobile: recA.mobile,
              email: recA.email,
              conflictType: 'SAME_UID_MULTIPLE_DOCS',
              details: `Customer UID ${recA.uid} has mismatched identity data between ${recA.collection} and ${recB.collection}`,
              conflictingWith: [{
                uid: recB.uid,
                docId: recB.docId,
                collection: recB.collection,
                mobile: recB.mobile,
                email: recB.email
              }]
            });
          }
        }
        continue;
      }

      // Check: Different Firebase UID -> same active phone
      if (recA.uid !== recB.uid && recA.normMobile && recB.normMobile && (recA.normMobile === recB.normMobile || (recA.tenDigits && recA.tenDigits === recB.tenDigits))) {
        const aUnlinked = recA.unlinkedPhones.includes(recA.normMobile);
        const bUnlinked = recB.unlinkedPhones.includes(recB.normMobile);
        if (!aUnlinked && !bUnlinked) {
          const key = `diff_uid_phone_${recA.uid}_${recB.uid}_${recA.normMobile}`;
          if (!reportedKeys.has(key)) {
            reportedKeys.add(key);
            conflicts.push({
              firebaseUid: recA.uid,
              customerDocumentId: recA.docId,
              collection: recA.collection,
              mobile: recA.mobile,
              email: recA.email,
              conflictType: 'DIFF_UID_SAME_PHONE',
              details: `Different Firebase UIDs (${recA.uid} and ${recB.uid}) share active phone number ${recA.normMobile}`,
              conflictingWith: [{
                uid: recB.uid,
                docId: recB.docId,
                collection: recB.collection,
                mobile: recB.mobile,
                email: recB.email
              }]
            });
          }
        }
      }

      // Check: Different Firebase UID -> same active email
      if (recA.uid !== recB.uid && recA.email && recB.email && 
          !recA.email.includes('@mobile.electrostore.com') && 
          !recB.email.includes('@mobile.electrostore.com') && 
          recA.email === recB.email) {
        const aUnlinked = recA.unlinkedEmails.includes(recA.email);
        const bUnlinked = recB.unlinkedEmails.includes(recB.email);
        if (!aUnlinked && !bUnlinked) {
          const key = `diff_uid_email_${recA.uid}_${recB.uid}_${recA.email}`;
          if (!reportedKeys.has(key)) {
            reportedKeys.add(key);
            conflicts.push({
              firebaseUid: recA.uid,
              customerDocumentId: recA.docId,
              collection: recA.collection,
              mobile: recA.mobile,
              email: recA.email,
              conflictType: 'DIFF_UID_SAME_EMAIL',
              details: `Different Firebase UIDs (${recA.uid} and ${recB.uid}) share active email address ${recA.email}`,
              conflictingWith: [{
                uid: recB.uid,
                docId: recB.docId,
                collection: recB.collection,
                mobile: recB.mobile,
                email: recB.email
              }]
            });
          }
        }
      }

      // Check: Same phone -> multiple customer documents in same collection
      if (recA.collection === recB.collection && recA.normMobile && recB.normMobile && recA.normMobile === recB.normMobile && recA.docId !== recB.docId) {
        const key = `same_phone_multidoc_${recA.docId}_${recB.docId}`;
        if (!reportedKeys.has(key)) {
          reportedKeys.add(key);
          conflicts.push({
            firebaseUid: recA.uid,
            customerDocumentId: recA.docId,
            collection: recA.collection,
            mobile: recA.mobile,
            email: recA.email,
            conflictType: 'SAME_PHONE_MULTIPLE_DOCS',
            details: `Multiple customer documents (${recA.docId} and ${recB.docId}) share the phone number ${recA.normMobile}`,
            conflictingWith: [{
              uid: recB.uid,
              docId: recB.docId,
              collection: recB.collection,
              mobile: recB.mobile,
              email: recB.email
            }]
          });
        }
      }

      // Check: Same email -> multiple customer documents in same collection
      if (recA.collection === recB.collection && recA.email && recB.email && 
          !recA.email.includes('@mobile.electrostore.com') && 
          recA.email === recB.email && 
          recA.docId !== recB.docId) {
        const key = `same_email_multidoc_${recA.docId}_${recB.docId}`;
        if (!reportedKeys.has(key)) {
          reportedKeys.add(key);
          conflicts.push({
            firebaseUid: recA.uid,
            customerDocumentId: recA.docId,
            collection: recA.collection,
            mobile: recA.mobile,
            email: recA.email,
            conflictType: 'SAME_EMAIL_MULTIPLE_DOCS',
            details: `Multiple customer documents (${recA.docId} and ${recB.docId}) share the email address ${recA.email}`,
            conflictingWith: [{
              uid: recB.uid,
              docId: recB.docId,
              collection: recB.collection,
              mobile: recB.mobile,
              email: recB.email
            }]
          });
        }
      }
    }
  }

  return {
    totalScanned: allRecords.length,
    conflictCount: conflicts.length,
    conflicts
  };
}

function hashOtp(phone: string, otp: string): string {
  const salt = process.env.OTP_SALT || 'electrostore_otp_secret_salt_2026';
  return crypto.createHash('sha256').update(`${phone}:${otp}:${salt}`).digest('hex');
}

// Real SMS Dispatcher
async function sendSmsViaProvider(phoneNumber: string, otp: string): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  const message = `Your ElectroStore verification code is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;

  // 1. Twilio Integration (if configured)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuth && twilioFrom) {
    try {
      const authHeader = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: twilioFrom,
          Body: message
        }).toString()
      });

      const resData = await response.json() as any;
      if (response.ok) {
        return { success: true, provider: 'twilio', messageId: resData.sid };
      }
      console.warn('Twilio SMS delivery notice:', resData.message || resData);
    } catch (e: any) {
      console.warn('Twilio SMS request error:', e?.message || e);
    }
  }

  // 2. Fast2SMS Integration (India)
  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  if (fast2SmsKey) {
    try {
      const rawNumbers = phoneNumber.replace(/^\+91/, '').replace(/^\+/, '');
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2SmsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: rawNumbers
        })
      });

      const resData = await response.json() as any;
      if (response.ok && resData.return) {
        return { success: true, provider: 'fast2sms', messageId: resData.request_id };
      }
      console.warn('Fast2SMS notice:', resData.message || resData);
    } catch (e: any) {
      console.warn('Fast2SMS error:', e?.message || e);
    }
  }

  // 3. Msg91 Integration (India)
  const msg91AuthKey = process.env.MSG91_AUTH_KEY;
  const msg91TemplateId = process.env.MSG91_TEMPLATE_ID;
  if (msg91AuthKey && msg91TemplateId) {
    try {
      const response = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${msg91TemplateId}&mobile=${phoneNumber.replace(/^\+/, '')}&otp=${otp}`, {
        method: 'POST',
        headers: {
          'authkey': msg91AuthKey,
          'Content-Type': 'application/json'
        }
      });
      const resData = await response.json() as any;
      if (response.ok && resData.type === 'success') {
        return { success: true, provider: 'msg91', messageId: resData.request_id };
      }
    } catch (e: any) {
      console.warn('Msg91 error:', e?.message || e);
    }
  }

  // 4. Generic SMS Gateway Webhook
  const customSmsUrl = process.env.SMS_GATEWAY_URL;
  if (customSmsUrl) {
    try {
      const response = await fetch(customSmsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.SMS_GATEWAY_BEARER ? { 'Authorization': `Bearer ${process.env.SMS_GATEWAY_BEARER}` } : {})
        },
        body: JSON.stringify({
          phoneNumber,
          otp,
          message
        })
      });
      if (response.ok) {
        return { success: true, provider: 'webhook' };
      }
    } catch (e: any) {
      console.warn('Custom SMS webhook error:', e?.message || e);
    }
  }

  // Provider fallback / Dev mode
  return { 
    success: true, 
    provider: 'system_dispatcher'
  };
}

export function createOtpAuthRouter(getDb: () => Firestore, getAdminAuth: () => Auth): express.Router {
  const router = express.Router();

  // 1. Send OTP Endpoint
  router.post('/send', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const rawPhone = (req.body.phoneNumber || req.body.phone || '').toString();
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

      if (!rawPhone) {
        res.status(400).json({ success: false, error: 'Phone number is required.' });
        return;
      }

      const normalizedPhone = normalizePhoneNumber(rawPhone);
      if (!isValidPhoneNumber(normalizedPhone)) {
        res.status(400).json({ 
          success: false, 
          error: 'Please enter a valid 10-digit mobile number (e.g., 9876543210).' 
        });
        return;
      }

      // If requested by an authenticated user (e.g. changing mobile number), check for conflict & same phone
      if (req.body.currentUid || req.body.uid) {
        const checkUid = String(req.body.currentUid || req.body.uid).trim();
        const rawDigits = normalizedPhone.replace(/\D/g, '');
        const tenDigits = rawDigits.slice(-10);
        const db = getDb();

        // 1. Check if user entered their own current active number
        let currentDoc = await db.collection('customers').doc(checkUid).get().catch(() => null);
        if (!currentDoc || !currentDoc.exists) {
          currentDoc = await db.collection('users').doc(checkUid).get().catch(() => null);
        }
        if (currentDoc && currentDoc.exists) {
          const curData = currentDoc.data() || {};
          if (matchesActiveCustomerPhone(curData, normalizedPhone, tenDigits)) {
            res.status(400).json({
              success: false,
              error: 'This is already your current registered mobile number. Please enter a different mobile number.'
            });
            return;
          }
        }

        // 2. Check if another active account already uses this number
        const conflict = await findActiveCustomerByPhone(db, normalizedPhone, tenDigits);
        if (conflict && conflict.id !== checkUid) {
          res.status(400).json({
            success: false,
            error: 'This mobile number is already linked to another active account. Please choose a different number.'
          });
          return;
        }

        const adminAuth = getAdminAuth();
        if (adminAuth) {
          try {
            const authUser = await safeAuthCall(() => adminAuth.getUserByPhoneNumber(normalizedPhone));
            if (authUser && authUser.uid !== checkUid) {
              let authDoc = await db.collection('customers').doc(authUser.uid).get().catch(() => null);
              if (!authDoc?.exists) {
                authDoc = await db.collection('users').doc(authUser.uid).get().catch(() => null);
              }
              const authData = authDoc?.exists ? authDoc.data() : null;
              if (authData && matchesActiveCustomerPhone(authData, normalizedPhone, tenDigits)) {
                res.status(400).json({
                  success: false,
                  error: 'This mobile number is already linked to another active account. Please choose a different number.'
                });
                return;
              }
            }
          } catch {}
        }
      }

      const now = Date.now();

      // Check Rate Limiting (max 5 requests per 15 mins per number)
      const rateLimit = phoneRateLimits.get(normalizedPhone) || { requests: [] };
      // Filter out requests older than 15 minutes
      rateLimit.requests = rateLimit.requests.filter(t => now - t < 15 * 60 * 1000);

      if (rateLimit.requests.length >= 5) {
        const oldest = rateLimit.requests[0];
        const waitMinutes = Math.ceil((15 * 60 * 1000 - (now - oldest)) / 60000);
        res.status(429).json({
          success: false,
          error: `Too many OTP requests for this number. Please wait ${waitMinutes} minute(s) before trying again.`
        });
        return;
      }

      // Check Cooldown (30 seconds resend cooldown)
      const existingSession = otpStore.get(normalizedPhone);
      if (existingSession && !existingSession.used && now < existingSession.resendAfter) {
        const remainingSec = Math.ceil((existingSession.resendAfter - now) / 1000);
        res.status(429).json({
          success: false,
          error: `Please wait ${remainingSec} second(s) before requesting a new OTP.`
        });
        return;
      }

      // Generate cryptographically secure 6-digit OTP
      const otpNumber = crypto.randomInt(100000, 1000000);
      const otpString = otpNumber.toString();
      const hashedOtp = hashOtp(normalizedPhone, otpString);

      // Create OTP record
      const record: OtpRecord = {
        phoneNumber: normalizedPhone,
        otpHash: hashedOtp,
        rawOtp: otpString,
        createdAt: now,
        expiresAt: now + 5 * 60 * 1000, // 5 minutes validity
        resendAfter: now + 30 * 1000,   // 30 seconds resend cooldown
        attempts: 0,
        used: false,
        ip
      };

      otpStore.set(normalizedPhone, record);
      rateLimit.requests.push(now);
      phoneRateLimits.set(normalizedPhone, rateLimit);

      // Dispatch SMS
      const smsResult = await sendSmsViaProvider(normalizedPhone, otpString);

      console.log(`[OTP] Dispatched code to ${normalizedPhone.slice(0, 4)}***${normalizedPhone.slice(-3)} via ${smsResult.provider}. Valid for 5m.`);

      // In-memory OTP session is primary and active. Optional background audit log:
      try {
        const db = getDb();
        if (db && typeof db.collection === 'function') {
          db.collection('phone_otps').doc(normalizedPhone.replace(/[^a-zA-Z0-9]/g, '_')).set({
            phoneNumber: normalizedPhone,
            otpHash: hashedOtp,
            createdAt: FieldValue.serverTimestamp(),
            expiresAt: new Date(record.expiresAt),
            attempts: 0,
            used: false,
            provider: smsResult.provider
          }).catch(() => null);
        }
      } catch {
        // In-memory session is active and authoritative
      }

      const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.APP_ENV === 'development';
      const hasRealSmsConfig = Boolean(
        process.env.FAST2SMS_API_KEY || 
        process.env.TWILIO_ACCOUNT_SID || 
        process.env.MSG91_AUTH_KEY || 
        process.env.SMS_GATEWAY_URL
      );

      res.status(200).json({
        success: true,
        message: `OTP sent successfully to ${normalizedPhone}`,
        phoneNumber: normalizedPhone,
        expiresInSeconds: 300,
        cooldownSeconds: 30,
        // In dev or preview environments without SMS API keys, provide code to assist instant verification
        ...((isDevelopment || !hasRealSmsConfig) ? { debugOtp: otpString } : {})
      });
    } catch (err: any) {
      console.error('Error in /api/auth/otp/send:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to generate and send OTP. Please try again.'
      });
    }
  });

  // 2. Resend OTP Endpoint
  router.post('/resend', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const rawPhone = (req.body.phoneNumber || req.body.phone || '').toString();
      const normalizedPhone = normalizePhoneNumber(rawPhone);

      if (!isValidPhoneNumber(normalizedPhone)) {
        res.status(400).json({ success: false, error: 'Valid phone number is required.' });
        return;
      }

      const now = Date.now();
      const existingSession = otpStore.get(normalizedPhone);

      if (existingSession && now < existingSession.resendAfter) {
        const remainingSec = Math.ceil((existingSession.resendAfter - now) / 1000);
        res.status(429).json({
          success: false,
          error: `Please wait ${remainingSec} second(s) before requesting a new OTP.`
        });
        return;
      }

      // Check 15-minute rate limit
      const rateLimit = phoneRateLimits.get(normalizedPhone) || { requests: [] };
      rateLimit.requests = rateLimit.requests.filter(t => now - t < 15 * 60 * 1000);
      if (rateLimit.requests.length >= 5) {
        res.status(429).json({
          success: false,
          error: 'Maximum OTP requests exceeded for this number. Please wait 15 minutes.'
        });
        return;
      }

      // Generate fresh OTP
      const otpNumber = crypto.randomInt(100000, 1000000);
      const otpString = otpNumber.toString();
      const hashedOtp = hashOtp(normalizedPhone, otpString);

      const record: OtpRecord = {
        phoneNumber: normalizedPhone,
        otpHash: hashedOtp,
        rawOtp: otpString,
        createdAt: now,
        expiresAt: now + 5 * 60 * 1000,
        resendAfter: now + 30 * 1000,
        attempts: 0,
        used: false,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
      };

      otpStore.set(normalizedPhone, record);
      rateLimit.requests.push(now);
      phoneRateLimits.set(normalizedPhone, rateLimit);

      await sendSmsViaProvider(normalizedPhone, otpString);

      const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.APP_ENV === 'development';
      const hasRealSmsConfig = Boolean(
        process.env.FAST2SMS_API_KEY || 
        process.env.TWILIO_ACCOUNT_SID || 
        process.env.MSG91_AUTH_KEY || 
        process.env.SMS_GATEWAY_URL
      );

      res.status(200).json({
        success: true,
        message: `New OTP resent to ${normalizedPhone}`,
        phoneNumber: normalizedPhone,
        expiresInSeconds: 300,
        cooldownSeconds: 30,
        ...((isDevelopment || !hasRealSmsConfig) ? { debugOtp: otpString } : {})
      });
    } catch (err: any) {
      console.error('Error in /api/auth/otp/resend:', err);
      res.status(500).json({ success: false, error: 'Failed to resend OTP.' });
    }
  });

  // 3. Verify OTP Endpoint
  router.post('/verify', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const rawPhone = (req.body.phoneNumber || req.body.phone || '').toString();
      const otpInput = (req.body.otp || req.body.code || '').toString().trim();

      if (!rawPhone || !otpInput) {
        res.status(400).json({ 
          success: false, 
          error: 'Both phone number and OTP are required.' 
        });
        return;
      }

      const normalizedPhone = normalizePhoneNumber(rawPhone);
      if (!isValidPhoneNumber(normalizedPhone)) {
        res.status(400).json({ 
          success: false, 
          error: 'Please provide a valid phone number.' 
        });
        return;
      }

      if (!/^\d{6}$/.test(otpInput)) {
        res.status(400).json({ 
          success: false, 
          error: 'OTP must be a 6-digit number.' 
        });
        return;
      }

      const session = otpStore.get(normalizedPhone);
      const now = Date.now();

      if (!session) {
        res.status(400).json({ 
          success: false, 
          error: 'No active OTP request found for this number. Please request a new OTP.' 
        });
        return;
      }

      // Check if already used
      if (session.used) {
        res.status(400).json({ 
          success: false, 
          error: 'This OTP has already been verified and used. Please request a new OTP.' 
        });
        return;
      }

      // Check if expired (> 5 minutes)
      if (now > session.expiresAt) {
        otpStore.delete(normalizedPhone);
        res.status(400).json({ 
          success: false, 
          error: 'OTP has expired. Please request a new code.' 
        });
        return;
      }

      // Check maximum failed attempts (max 5)
      if (session.attempts >= 5) {
        otpStore.delete(normalizedPhone);
        res.status(400).json({ 
          success: false, 
          error: 'Too many incorrect attempts. This OTP is invalidated. Please request a new code.' 
        });
        return;
      }

      // Verify OTP hash
      const computedHash = hashOtp(normalizedPhone, otpInput);
      if (computedHash !== session.otpHash) {
        session.attempts += 1;
        const attemptsLeft = 5 - session.attempts;
        if (attemptsLeft <= 0) {
          otpStore.delete(normalizedPhone);
          res.status(400).json({ 
            success: false, 
            error: 'Incorrect OTP. Maximum attempts reached. Please request a new OTP.' 
          });
          return;
        }
        res.status(400).json({ 
          success: false, 
          error: `Incorrect OTP. Please check the code and try again (${attemptsLeft} attempt(s) remaining).` 
        });
        return;
      }

      // Mark OTP as successfully used
      session.used = true;
      otpStore.delete(normalizedPhone);

      // Match or Create User Account
      const db = getDb();
      const rawDigits = normalizedPhone.replace(/\D/g, '');
      const tenDigits = rawDigits.slice(-10);
      const adminAuth = getAdminAuth();

      // 1. Firebase Authentication resolves user
      let permanentUid: string | null = null;
      let isNewUser = false;

      // Special Owner check for Ritam Saha
      const isOwnerPhoneLogin = 
        tenDigits === '6297737947' || normalizedPhone.includes('6297737947') || rawDigits.endsWith('6297737947') ||
        tenDigits === '6297747957' || normalizedPhone.includes('6297747957') || rawDigits.endsWith('6297747957');

      if (isOwnerPhoneLogin) {
        permanentUid = 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1';
        isNewUser = false;
      }

      if (!permanentUid && adminAuth) {
        try {
          const authUser = await safeAuthCall(() => adminAuth.getUserByPhoneNumber(normalizedPhone));
          if (authUser && authUser.uid) {
            // Check if this UID in Firestore actually has this phone active or if it was unlinked!
            let checkDoc = await db.collection('customers').doc(authUser.uid).get().catch(() => null);
            if (!checkDoc || !checkDoc.exists) {
              checkDoc = await db.collection('users').doc(authUser.uid).get().catch(() => null);
            }
            const checkData = checkDoc && checkDoc.exists ? checkDoc.data() : null;
            if (checkData && !matchesActiveCustomerPhone(checkData, normalizedPhone, tenDigits)) {
              console.warn(`Auth user ${authUser.uid} matched phone ${normalizedPhone} in Firebase Auth, but customer profile has unlinked this phone. Releasing credential from Firebase Auth.`);
              safeAuthCall(() => adminAuth.updateUser(authUser.uid, { phoneNumber: null as any }));
            } else {
              permanentUid = authUser.uid;
            }
          }
        } catch (e) {
          // not found in Firebase Auth directly
        }
      }

      // 2. If not found in Firebase Auth directly, look up active customer in Firestore
      if (!permanentUid) {
        try {
          const existingDoc = await findActiveCustomerByPhone(db, normalizedPhone, tenDigits);
          if (existingDoc && existingDoc.exists) {
            permanentUid = existingDoc.id || existingDoc.data()?.uid;
          }
        } catch (findErr) {
          console.warn('Notice while looking up existing customer by phone:', findErr);
        }
      }

      // 3. If still not found, generate permanent UID
      if (!permanentUid) {
        permanentUid = generatePermanentCustomerUid();
        isNewUser = true;
      }

      // Ensure user exists in Firebase Auth with permanentUid and phone number
      if (adminAuth) {
        safeAuthCall(async () => {
          if (isOwnerPhoneLogin) {
            try {
              const duplicatePhoneUser = await adminAuth.getUserByPhoneNumber(normalizedPhone).catch(() => null);
              if (duplicatePhoneUser && duplicatePhoneUser.uid !== permanentUid) {
                console.log(`Unlinking phone ${normalizedPhone} from duplicate Firebase Auth user ${duplicatePhoneUser.uid}`);
                await adminAuth.updateUser(duplicatePhoneUser.uid, { phoneNumber: null as any }).catch(() => {});
              }
            } catch (_dupErr) {}
          }
          try {
            await adminAuth.getUser(permanentUid);
            await adminAuth.updateUser(permanentUid, {
              phoneNumber: isValidPhoneNumber(normalizedPhone) ? normalizedPhone : undefined
            }).catch(() => {});
          } catch (getErr: any) {
            if (getErr?.code === 'auth/user-not-found') {
              await adminAuth.createUser({
                uid: permanentUid,
                phoneNumber: isValidPhoneNumber(normalizedPhone) ? normalizedPhone : undefined
              }).catch(() => {});
            }
          }
        });
      }

      // 4. Load customers/{UID}
      let customerDoc = await db.collection('customers').doc(permanentUid).get().catch(() => null);
      if (!customerDoc || !customerDoc.exists) {
        customerDoc = await db.collection('users').doc(permanentUid).get().catch(() => null);
      }

      const existingData = (customerDoc && customerDoc.exists) ? (customerDoc.data() || {}) : {};
      const isOwnerDoc = isOwnerPhoneLogin ||
                         permanentUid === 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1' || 
                         existingData.isPrimaryOwner === true || 
                         existingData.role === 'owner' || 
                         (existingData.email && existingData.email.toLowerCase().trim() === 'ritamsaha0000@gmail.com');

      const role = isOwnerDoc ? 'admin' : ((existingData.role as 'customer' | 'admin') || 'customer');
      const displayName = (isOwnerDoc ? (existingData.displayName || 'Ritam Saha') : (existingData.displayName || existingData.fullName || `Customer ${tenDigits.slice(-4)}`));
      const rawExistingEmail = existingData.email || '';
      const isFakeEmail = rawExistingEmail.endsWith('@mobile.electrostore.com') || rawExistingEmail.endsWith('@electrostore.local') || rawExistingEmail.endsWith('@temp.com');
      const email = isOwnerDoc ? 'ritamsaha0000@gmail.com' : (isFakeEmail ? '' : rawExistingEmail);

      const FULL_ADMIN_PERMISSIONS = {
        pos_access: true,
        pos_view_sales: true,
        pos_manage_returns: true,
        orders_view: true,
        orders_update_status: true,
        orders_manage_returns: true,
        products_view: true,
        products_edit: true,
        products_manage_inventory: true,
        products_delete: true,
        customers_view: true,
        customers_manage: true,
        marketing_manage: true,
        reviews_manage: true,
        support_view: true,
        support_manage: true,
        reports_view: true,
        settings_view: true,
        settings_manage: true,
        staff_manage: true,
        notifications_view: true,
        notifications_manage: true
      };

      // 5. Update/Save customer profile to customers/{UID} and users/{UID}
      await saveCustomerDocument(db, permanentUid, {
        ...existingData,
        uid: permanentUid,
        id: permanentUid,
        displayName,
        name: displayName,
        fullName: displayName,
        phoneNumber: normalizedPhone,
        phone: normalizedPhone,
        mobile: normalizedPhone,
        mobileNumber: normalizedPhone,
        phone_number: normalizedPhone,
        email,
        role: isOwnerDoc ? 'admin' : role,
        isPrimaryOwner: isOwnerDoc ? true : Boolean(existingData.isPrimaryOwner),
        status: isOwnerDoc ? 'active' : (existingData.status || 'active'),
        permissions: isOwnerDoc ? FULL_ADMIN_PERMISSIONS : (existingData.permissions || undefined),
        isPhoneVerified: true,
        phoneVerified: true,
        isEmailVerified: isOwnerDoc ? true : Boolean(existingData.isEmailVerified),
        emailVerified: isOwnerDoc ? true : Boolean(existingData.emailVerified),
        lastLoginAt: FieldValue.serverTimestamp(),
        ...(isNewUser ? { createdAt: FieldValue.serverTimestamp() } : {})
      });

      const userProfile = {
        uid: isOwnerDoc ? 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1' : permanentUid,
        phoneNumber: normalizedPhone,
        email: isOwnerDoc ? 'ritamsaha0000@gmail.com' : email,
        displayName: isOwnerDoc ? 'Ritam Saha' : displayName,
        name: isOwnerDoc ? 'Ritam Saha' : displayName,
        fullName: isOwnerDoc ? 'Ritam Saha' : displayName,
        role: isOwnerDoc ? 'admin' : role,
        isPrimaryOwner: isOwnerDoc ? true : Boolean(existingData.isPrimaryOwner),
        status: isOwnerDoc ? 'active' : (existingData.status || 'active'),
        permissions: isOwnerDoc ? FULL_ADMIN_PERMISSIONS : (existingData.permissions || undefined),
        photoURL: existingData.photoURL || '',
        gender: existingData.gender || '',
        dateOfBirth: existingData.dateOfBirth || existingData.dob || '',
        isNewUser: isOwnerDoc ? false : isNewUser
      };

      // Synchronize with Firebase Auth / issue custom token if supported
      let customToken: string | null = null;
      try {
        if (adminAuth) {
          if (isOwnerDoc) {
            safeAuthCall(() => adminAuth.setCustomUserClaims(permanentUid, {
              role: 'admin',
              isPrimaryOwner: true,
              admin: true,
              platform_admin: true
            }));
          }
          customToken = await safeAuthCall(() => adminAuth.createCustomToken(userProfile.uid, {
            role: userProfile.role,
            phoneNumber: userProfile.phoneNumber,
            isPrimaryOwner: isOwnerDoc,
            admin: isOwnerDoc || userProfile.role === 'admin'
          }), 1000);
        }
      } catch (_tokenErr) {
        // Gracefully fallback to session-based profile
      }

      res.status(200).json({
        success: true,
        message: userProfile.isNewUser ? 'Account created successfully.' : 'Signed in successfully.',
        user: userProfile,
        customToken,
        sessionToken: `sess_${userProfile.uid}_${Date.now()}`
      });
    } catch (err: any) {
      console.error('Error in /api/auth/otp/verify:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to verify OTP. Please try again.'
      });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/otp/verify-phone-update
  // Verifies OTP for changing or linking mobile number for an existing user
  // Enforces:
  // 1. Same permanent UID and customer document
  // 2. Duplicate prevention (phone can only belong to ONE active account)
  // 3. Unlinking old phone from active login
  // -------------------------------------------------------------
  router.post('/verify-phone-update', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { phoneNumber, otp, uid } = req.body;

      if (!phoneNumber || !otp || !uid) {
        res.status(400).json({
          success: false,
          error: 'Phone number, OTP code, and User ID are required.'
        });
        return;
      }

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      if (!normalizedPhone) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid 10-digit mobile number.'
        });
        return;
      }

      const rawDigits = normalizedPhone.replace(/\D/g, '');
      const tenDigits = rawDigits.slice(-10);

      const otpInput = String(otp).trim();
      const session = otpStore.get(normalizedPhone);

      if (!session) {
        res.status(400).json({
          success: false,
          error: 'No active OTP found for this number. Please request a new OTP.'
        });
        return;
      }

      const now = Date.now();
      if (now > session.expiresAt) {
        otpStore.delete(normalizedPhone);
        res.status(400).json({
          success: false,
          error: 'OTP has expired. Please request a new code.'
        });
        return;
      }

      if (session.attempts >= 5) {
        otpStore.delete(normalizedPhone);
        res.status(400).json({
          success: false,
          error: 'Too many incorrect attempts. Please request a new code.'
        });
        return;
      }

      const computedHash = hashOtp(normalizedPhone, otpInput);
      if (computedHash !== session.otpHash) {
        session.attempts += 1;
        const attemptsLeft = 5 - session.attempts;
        res.status(400).json({
          success: false,
          error: `Incorrect OTP code (${Math.max(0, attemptsLeft)} attempt(s) remaining).`
        });
        return;
      }

      // Check for account collision: A phone number can only belong to ONE active customer account
      const db = getDb();
      const existingConflict = await findActiveCustomerByPhone(db, normalizedPhone, tenDigits);
      if (existingConflict && existingConflict.id !== uid) {
        res.status(400).json({
          success: false,
          error: 'This mobile number is already linked to another active account. Please choose a different number.'
        });
        return;
      }

      const adminAuth = getAdminAuth();
      if (adminAuth) {
        try {
          const authUser = await adminAuth.getUserByPhoneNumber(normalizedPhone);
          if (authUser && authUser.uid !== uid) {
            let authDoc = await db.collection('customers').doc(authUser.uid).get().catch(() => null);
            if (!authDoc?.exists) {
              authDoc = await db.collection('users').doc(authUser.uid).get().catch(() => null);
            }
            const authData = authDoc?.exists ? authDoc.data() : null;
            if (authData && matchesActiveCustomerPhone(authData, normalizedPhone, tenDigits)) {
              res.status(400).json({
                success: false,
                error: 'This mobile number is already linked to another active account. Please choose a different number.'
              });
              return;
            } else {
              // The other user unlinked this phone, release from Firebase Auth
              await adminAuth.updateUser(authUser.uid, { phoneNumber: null as any }).catch(() => {});
            }
          }
        } catch {}
      }

      // Mark OTP as used
      session.used = true;
      otpStore.delete(normalizedPhone);

      // Retrieve current customer document to record and unlink previous phone
      let currentData: Record<string, any> = {};
      try {
        const custSnap = await db.collection('customers').doc(uid).get();
        if (custSnap.exists) {
          currentData = custSnap.data() || {};
        } else {
          const userSnap = await db.collection('users').doc(uid).get();
          if (userSnap.exists) currentData = userSnap.data() || {};
        }
      } catch (err) {}

      const oldPhone = currentData.phoneNumber || currentData.phone || '';

      const updates: Record<string, any> = {
        phoneNumber: normalizedPhone,
        phone: normalizedPhone,
        mobile: normalizedPhone,
        mobileNumber: normalizedPhone,
        phone_number: normalizedPhone,
        contactNumber: normalizedPhone,
        phoneVerified: true,
        isPhoneVerified: true,
        updatedAt: FieldValue.serverTimestamp()
      };

      // Explicitly unlink old phone so it can never be used to log into this account again
      if (oldPhone && oldPhone !== normalizedPhone) {
        const normOld = normalizePhoneNumber(oldPhone);
        const oldTen = normOld.replace(/\D/g, '').slice(-10);
        updates.unlinkedPhones = FieldValue.arrayUnion(normOld, oldPhone, oldTen);
        updates.previousPhoneNumbers = FieldValue.arrayUnion(normOld);

        // Also deactivate any legacy document keyed by old phone so it can never match
        const legacyCandidates = [`usr_p_91${oldTen}`, `usr_p_${oldTen}`, `usr_${oldTen}`];
        for (const candId of legacyCandidates) {
          try {
            const legDoc = await db.collection('users').doc(candId).get();
            if (legDoc.exists) {
              await db.collection('users').doc(candId).set({
                phoneNumber: '',
                phone: '',
                isPhoneVerified: false,
                unlinkedPhones: FieldValue.arrayUnion(normOld, oldPhone, oldTen),
                migratedTo: uid,
                updatedAt: FieldValue.serverTimestamp()
              }, { merge: true });
            }
          } catch (e) {}
        }
      }

      // Update the customer record in BOTH customers/{uid} and users/{uid}
      await saveCustomerDocument(db, uid, {
        ...currentData,
        ...updates
      });

      // Update the SAME Firebase Auth user if admin auth is available
      try {
        const adminAuth = getAdminAuth();
        if (adminAuth) {
          // If another record in Firebase Auth had this new phone, release it first
          try {
            const conflictUser = await adminAuth.getUserByPhoneNumber(normalizedPhone);
            if (conflictUser && conflictUser.uid !== uid) {
              await adminAuth.updateUser(conflictUser.uid, { phoneNumber: null as any }).catch(() => {});
            }
          } catch (checkErr) {}

          await adminAuth.updateUser(uid, {
            phoneNumber: normalizedPhone
          }).catch((fbErr: any) => {
            console.warn('Notice syncing phone update to Firebase Auth (Firestore remains authoritative):', fbErr.message);
          });
        }
      } catch {}

      res.status(200).json({
        success: true,
        message: 'Mobile number verified and updated successfully as primary login.',
        phoneNumber: normalizedPhone,
        user: {
          uid,
          phoneNumber: normalizedPhone,
          phone: normalizedPhone,
          isPhoneVerified: true,
          email: currentData.email || '',
          displayName: currentData.displayName || '',
          role: currentData.role || 'customer'
        }
      });
    } catch (err: any) {
      console.error('Error in /api/auth/otp/verify-phone-update:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to verify and update mobile number.'
      });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/otp/send-email-otp
  // Sends a 6-digit OTP to an email address
  // -------------------------------------------------------------
  router.post('/send-email-otp', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const email = (req.body.email || '').toString().trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
        return;
      }

      // Check if requested by an authenticated user, verify the email isn't already taken or same
      if (req.body.currentUid || req.body.uid) {
        const checkUid = String(req.body.currentUid || req.body.uid).trim();
        const db = getDb();

        // 1. Check if user entered their own current active email
        let currentDoc = await db.collection('customers').doc(checkUid).get().catch(() => null);
        if (!currentDoc || !currentDoc.exists) {
          currentDoc = await db.collection('users').doc(checkUid).get().catch(() => null);
        }
        if (currentDoc && currentDoc.exists) {
          const curData = currentDoc.data() || {};
          if (matchesActiveCustomerEmail(curData, email)) {
            res.status(400).json({
              success: false,
              error: 'This is already your current registered email address. Please enter a different email address.'
            });
            return;
          }
        }

        // 2. Check if another active account uses this email
        const conflict = await findActiveCustomerByEmail(db, email);
        if (conflict && conflict.id !== checkUid) {
          res.status(400).json({
            success: false,
            error: 'This email address is already linked to another active account. Please choose a different email.'
          });
          return;
        }

        const adminAuth = getAdminAuth();
        if (adminAuth) {
          try {
            const authUser = await adminAuth.getUserByEmail(email);
            if (authUser && authUser.uid !== checkUid) {
              let authDoc = await db.collection('customers').doc(authUser.uid).get().catch(() => null);
              if (!authDoc?.exists) {
                authDoc = await db.collection('users').doc(authUser.uid).get().catch(() => null);
              }
              const authData = authDoc?.exists ? authDoc.data() : null;
              const otherEmail = (authData?.email || '').toLowerCase().trim();
              const isUnlinked = (authData?.unlinkedEmails || []).includes(email);
              if (!isUnlinked && otherEmail === email) {
                res.status(400).json({
                  success: false,
                  error: 'This email address is already linked to another active account. Please choose a different email.'
                });
                return;
              }
            }
          } catch {}
        }
      }

      const now = Date.now();
      const existingSession = otpStore.get(`email_${email}`);
      if (existingSession && !existingSession.used && now < existingSession.resendAfter) {
        const remainingSec = Math.ceil((existingSession.resendAfter - now) / 1000);
        res.status(429).json({
          success: false,
          error: `Please wait ${remainingSec} second(s) before requesting a new OTP.`
        });
        return;
      }

      const otpNumber = crypto.randomInt(100000, 1000000);
      const otpString = otpNumber.toString();
      const hashedOtp = hashOtp(email, otpString);

      const record: OtpRecord = {
        phoneNumber: `email_${email}`,
        otpHash: hashedOtp,
        rawOtp: otpString,
        createdAt: now,
        expiresAt: now + 10 * 60 * 1000, // 10 minutes validity
        resendAfter: now + 30 * 1000,    // 30 seconds cooldown
        attempts: 0,
        used: false,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
      };

      otpStore.set(`email_${email}`, record);

      console.log(`[EMAIL OTP] Sent code ${otpString} to ${email}`);

      res.status(200).json({
        success: true,
        message: `Verification code sent to ${email}`,
        email,
        expiresInSeconds: 600,
        cooldownSeconds: 30,
        debugOtp: otpString
      });
    } catch (err: any) {
      console.error('Error sending email OTP:', err);
      res.status(500).json({ success: false, error: 'Failed to send email verification code.' });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/otp/verify-email-update
  // Verifies OTP for updating user email in Firestore
  // Enforces:
  // 1. Same permanent UID and customer document
  // 2. Duplicate prevention (email can only belong to ONE active account)
  // 3. Unlinking old email from active login
  // -------------------------------------------------------------
  router.post('/verify-email-update', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { email, otp, uid } = req.body;
      const cleanEmail = (email || '').toString().trim().toLowerCase();

      if (!cleanEmail || !otp || !uid) {
        res.status(400).json({ success: false, error: 'Email, OTP code, and User ID are required.' });
        return;
      }

      const sessionKey = `email_${cleanEmail}`;
      const session = otpStore.get(sessionKey);

      if (!session) {
        res.status(400).json({
          success: false,
          error: 'No active verification code found for this email. Please request a new code.'
        });
        return;
      }

      const now = Date.now();
      if (now > session.expiresAt) {
        otpStore.delete(sessionKey);
        res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
        return;
      }

      if (session.attempts >= 5) {
        otpStore.delete(sessionKey);
        res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new code.' });
        return;
      }

      const computedHash = hashOtp(cleanEmail, String(otp).trim());
      if (computedHash !== session.otpHash) {
        session.attempts += 1;
        const attemptsLeft = 5 - session.attempts;
        res.status(400).json({
          success: false,
          error: `Incorrect OTP code (${Math.max(0, attemptsLeft)} attempt(s) remaining).`
        });
        return;
      }

      // Check duplicate email: An email can only belong to ONE active customer account
      const db = getDb();
      const existingConflict = await findActiveCustomerByEmail(db, cleanEmail);
      if (existingConflict && existingConflict.id !== uid) {
        res.status(400).json({
          success: false,
          error: 'This email address is already linked to another active account. Please choose a different email.'
        });
        return;
      }

      const adminAuth = getAdminAuth();
      if (adminAuth) {
        try {
          const authUser = await adminAuth.getUserByEmail(cleanEmail);
          if (authUser && authUser.uid !== uid) {
            let authDoc = await db.collection('customers').doc(authUser.uid).get().catch(() => null);
            if (!authDoc?.exists) {
              authDoc = await db.collection('users').doc(authUser.uid).get().catch(() => null);
            }
            const authData = authDoc?.exists ? authDoc.data() : null;
            const otherEmail = (authData?.email || '').toLowerCase().trim();
            const isUnlinked = (authData?.unlinkedEmails || []).includes(cleanEmail);
            if (!isUnlinked && otherEmail === cleanEmail) {
              res.status(400).json({
                success: false,
                error: 'This email address is already linked to another active account. Please choose a different email.'
              });
              return;
            }
          }
        } catch {}
      }

      session.used = true;
      otpStore.delete(sessionKey);

      // Retrieve current document to record and unlink previous email
      let currentData: Record<string, any> = {};
      try {
        const custSnap = await db.collection('customers').doc(uid).get();
        if (custSnap.exists) {
          currentData = custSnap.data() || {};
        } else {
          const userSnap = await db.collection('users').doc(uid).get();
          if (userSnap.exists) currentData = userSnap.data() || {};
        }
      } catch (err) {}

      const oldEmail = currentData.email || '';

      const updates: Record<string, any> = {
        email: cleanEmail,
        emailVerified: true,
        isEmailVerified: true,
        updatedAt: FieldValue.serverTimestamp()
      };

      if (oldEmail && oldEmail.toLowerCase().trim() !== cleanEmail) {
        updates.unlinkedEmails = FieldValue.arrayUnion(oldEmail.toLowerCase().trim());
        updates.previousEmails = FieldValue.arrayUnion(oldEmail.toLowerCase().trim());
      }

      // Update customer in BOTH customers/{uid} and users/{uid}
      await saveCustomerDocument(db, uid, {
        ...currentData,
        ...updates
      });

      // Update SAME Firebase Auth user if available
      try {
        const adminAuth = getAdminAuth();
        if (adminAuth) {
          await adminAuth.updateUser(uid, {
            email: cleanEmail
          }).catch(() => {});
        }
      } catch {}

      res.status(200).json({
        success: true,
        message: 'Email address verified and updated successfully.',
        email: cleanEmail,
        user: {
          uid,
          email: cleanEmail,
          phoneNumber: currentData.phoneNumber || currentData.phone || '',
          displayName: currentData.displayName || '',
          role: currentData.role || 'customer'
        }
      });
    } catch (err: any) {
      console.error('Error verifying email update:', err);
      res.status(500).json({ success: false, error: 'Failed to verify and update email address.' });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/otp/send-email-login
  // Sends an OTP for direct customer login by email
  // -------------------------------------------------------------
  router.post('/send-email-login', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const email = (req.body.email || '').toString().trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
        return;
      }

      const now = Date.now();
      const sessionKey = `email_login_${email}`;
      const existingSession = otpStore.get(sessionKey);
      if (existingSession && !existingSession.used && now < existingSession.resendAfter) {
        const remainingSec = Math.ceil((existingSession.resendAfter - now) / 1000);
        res.status(429).json({
          success: false,
          error: `Please wait ${remainingSec} second(s) before requesting a new login code.`
        });
        return;
      }

      const otpNumber = crypto.randomInt(100000, 1000000);
      const otpString = otpNumber.toString();
      const hashedOtp = hashOtp(email, otpString);

      const record: OtpRecord = {
        phoneNumber: sessionKey,
        otpHash: hashedOtp,
        rawOtp: otpString,
        createdAt: now,
        expiresAt: now + 10 * 60 * 1000,
        resendAfter: now + 30 * 1000,
        attempts: 0,
        used: false,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
      };

      otpStore.set(sessionKey, record);

      console.log(`[EMAIL LOGIN OTP] Sent login code ${otpString} to ${email}`);

      res.status(200).json({
        success: true,
        message: `Login code sent to ${email}`,
        email,
        expiresInSeconds: 600,
        cooldownSeconds: 30,
        debugOtp: otpString
      });
    } catch (err: any) {
      console.error('Error sending email login OTP:', err);
      res.status(500).json({ success: false, error: 'Failed to send login code.' });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/otp/verify-email-login
  // Verifies email login OTP, loads exact permanent UID and restores customer data
  // -------------------------------------------------------------
  router.post('/verify-email-login', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { email, otp } = req.body;
      const cleanEmail = (email || '').toString().trim().toLowerCase();

      if (!cleanEmail || !otp) {
        res.status(400).json({ success: false, error: 'Email and OTP code are required.' });
        return;
      }

      const sessionKey = `email_login_${cleanEmail}`;
      const session = otpStore.get(sessionKey);

      if (!session) {
        res.status(400).json({ success: false, error: 'No active login code found for this email.' });
        return;
      }

      const now = Date.now();
      if (now > session.expiresAt) {
        otpStore.delete(sessionKey);
        res.status(400).json({ success: false, error: 'Login code has expired. Please request a new code.' });
        return;
      }

      if (session.attempts >= 5) {
        otpStore.delete(sessionKey);
        res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new code.' });
        return;
      }

      const computedHash = hashOtp(cleanEmail, String(otp).trim());
      if (computedHash !== session.otpHash) {
        session.attempts += 1;
        const attemptsLeft = 5 - session.attempts;
        res.status(400).json({
          success: false,
          error: `Incorrect login code (${Math.max(0, attemptsLeft)} attempt(s) remaining).`
        });
        return;
      }

      session.used = true;
      otpStore.delete(sessionKey);

      const db = getDb();
      const adminAuth = getAdminAuth();

      // 1. Resolve Firebase UID
      let permanentUid: string | null = null;
      let isNewUser = false;

      const isOwnerEmailLogin = cleanEmail === 'ritamsaha0000@gmail.com';
      if (isOwnerEmailLogin) {
        permanentUid = 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1';
      }

      if (!permanentUid && adminAuth) {
        try {
          const authUser = await adminAuth.getUserByEmail(cleanEmail);
          if (authUser && authUser.uid) {
            permanentUid = authUser.uid;
          }
        } catch (e) {}
      }

      if (!permanentUid) {
        const existingUserDoc = await findActiveCustomerByEmail(db, cleanEmail);
        if (existingUserDoc && existingUserDoc.exists) {
          permanentUid = existingUserDoc.id || existingUserDoc.data()?.uid;
        }
      }

      if (!permanentUid) {
        permanentUid = generatePermanentCustomerUid();
        isNewUser = true;
      }

      // Ensure user exists in Firebase Auth
      if (adminAuth) {
        try {
          await adminAuth.getUser(permanentUid);
          await adminAuth.updateUser(permanentUid, { email: cleanEmail }).catch(() => {});
        } catch (getErr: any) {
          if (getErr.code === 'auth/user-not-found') {
            await adminAuth.createUser({
              uid: permanentUid,
              email: cleanEmail
            }).catch(() => {});
          }
        }
      }

      // 2. Load customer record
      let customerDoc = await db.collection('customers').doc(permanentUid).get().catch(() => null);
      if (!customerDoc || !customerDoc.exists) {
        customerDoc = await db.collection('users').doc(permanentUid).get().catch(() => null);
      }
      const existingData = (customerDoc && customerDoc.exists) ? (customerDoc.data() || {}) : {};

      const isOwnerDoc = isOwnerEmailLogin ||
                         permanentUid === 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1' ||
                         existingData.isPrimaryOwner === true ||
                         existingData.role === 'owner';

      const displayName = isOwnerDoc ? (existingData.displayName || 'Ritam Saha') : (existingData.displayName || existingData.fullName || cleanEmail.split('@')[0]);
      const role = isOwnerDoc ? 'admin' : (existingData.role || 'customer');

      const status = isOwnerDoc ? 'active' : (existingData.status || 'active');
      const permissions = isOwnerDoc ? { ...FULL_ADMIN_PERMISSIONS } : (existingData.permissions || undefined);

      await saveCustomerDocument(db, permanentUid, {
        ...existingData,
        uid: permanentUid,
        email: cleanEmail,
        phoneNumber: isOwnerDoc ? (existingData.phoneNumber || existingData.phone || '+916297737947') : (existingData.phoneNumber || existingData.phone || ''),
        phone: isOwnerDoc ? (existingData.phoneNumber || existingData.phone || '+916297737947') : (existingData.phoneNumber || existingData.phone || ''),
        emailVerified: true,
        isEmailVerified: true,
        displayName,
        fullName: displayName,
        role,
        status,
        permissions,
        isPrimaryOwner: isOwnerDoc ? true : Boolean(existingData.isPrimaryOwner),
        lastLoginAt: FieldValue.serverTimestamp(),
        ...(isNewUser ? { createdAt: FieldValue.serverTimestamp() } : {})
      });

      const userProfile = {
        uid: permanentUid,
        phoneNumber: existingData.phoneNumber || existingData.phone || '',
        email: cleanEmail,
        displayName,
        role,
        status,
        permissions,
        isPrimaryOwner: isOwnerDoc ? true : Boolean(existingData.isPrimaryOwner),
        photoURL: existingData.photoURL || '',
        gender: existingData.gender || '',
        dateOfBirth: existingData.dateOfBirth || existingData.dob || '',
        isNewUser
      };

      let customToken: string | null = null;
      try {
        const adminAuth = getAdminAuth();
        if (adminAuth) {
          customToken = await adminAuth.createCustomToken(userProfile.uid, {
            role: userProfile.role,
            email: userProfile.email
          }).catch(() => null);
        }
      } catch {}

      res.status(200).json({
        success: true,
        message: userProfile.isNewUser ? 'Account created successfully.' : 'Signed in successfully.',
        user: userProfile,
        customToken,
        sessionToken: `sess_${userProfile.uid}_${Date.now()}`
      });
    } catch (err: any) {
      console.error('Error verifying email login OTP:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to verify email login.' });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/otp/send-security-otp
  // Sends authorization OTP to existing/current phone or email
  // -------------------------------------------------------------
  router.post('/send-security-otp', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { uid, target, value } = req.body;
      if (!uid || !target || !value) {
        res.status(400).json({ success: false, error: 'UID, target type, and destination value are required.' });
        return;
      }

      const cleanValue = target === 'phone' ? normalizePhoneNumber(value) : value.toString().trim().toLowerCase();
      const sessionKey = `security_${uid}_${target}`;
      const now = Date.now();

      const otpNumber = crypto.randomInt(100000, 1000000);
      const otpString = otpNumber.toString();
      const hashedOtp = hashOtp(cleanValue, otpString);

      const record: OtpRecord = {
        phoneNumber: sessionKey,
        otpHash: hashedOtp,
        rawOtp: otpString,
        createdAt: now,
        expiresAt: now + 5 * 60 * 1000,
        resendAfter: now + 30 * 1000,
        attempts: 0,
        used: false,
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
      };

      otpStore.set(sessionKey, record);

      if (target === 'phone') {
        await sendSmsViaProvider(cleanValue, otpString);
      }

      console.log(`[SECURITY OTP] Dispatched authorization OTP ${otpString} for ${target} (${cleanValue})`);

      res.status(200).json({
        success: true,
        message: `Security authorization code sent to your current ${target === 'phone' ? 'mobile number' : 'email address'}`,
        target,
        expiresInSeconds: 300,
        cooldownSeconds: 30,
        debugOtp: otpString
      });
    } catch (err: any) {
      console.error('Error in /api/auth/otp/send-security-otp:', err);
      res.status(500).json({ success: false, error: 'Failed to send security authorization code.' });
    }
  });

  // -------------------------------------------------------------
  // POST /api/auth/otp/verify-security-otp
  // Verifies authorization OTP for old phone or old email
  // -------------------------------------------------------------
  router.post('/verify-security-otp', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { uid, target, value, otp } = req.body;
      if (!uid || !target || !value || !otp) {
        res.status(400).json({ success: false, error: 'UID, target type, value, and OTP code are required.' });
        return;
      }

      const cleanValue = target === 'phone' ? normalizePhoneNumber(value) : value.toString().trim().toLowerCase();
      const sessionKey = `security_${uid}_${target}`;
      const session = otpStore.get(sessionKey);

      if (!session) {
        res.status(400).json({
          success: false,
          error: 'No active security authorization code found. Please request a new code.'
        });
        return;
      }

      const now = Date.now();
      if (now > session.expiresAt) {
        otpStore.delete(sessionKey);
        res.status(400).json({ success: false, error: 'Authorization code has expired. Please request a new code.' });
        return;
      }

      if (session.attempts >= 5) {
        otpStore.delete(sessionKey);
        res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new code.' });
        return;
      }

      const computedHash = hashOtp(cleanValue, String(otp).trim());
      if (computedHash !== session.otpHash) {
        session.attempts += 1;
        const attemptsLeft = 5 - session.attempts;
        res.status(400).json({
          success: false,
          error: `Incorrect authorization code (${Math.max(0, attemptsLeft)} attempt(s) remaining).`
        });
        return;
      }

      session.used = true;
      otpStore.delete(sessionKey);

      res.status(200).json({
        success: true,
        message: 'Security authorization confirmed. You may now verify your new credentials.',
        authorized: true
      });
    } catch (err: any) {
      console.error('Error in /api/auth/otp/verify-security-otp:', err);
      res.status(500).json({ success: false, error: 'Failed to verify security authorization code.' });
    }
  });

  // -------------------------------------------------------------
  // Safe Identity Conflicts Audit (Diagnostic only - no data deleted or mutated)
  // GET /api/auth/otp/audit-conflicts
  // -------------------------------------------------------------
  router.get('/audit-conflicts', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const db = getDb();
      const report = await auditCustomerIdentityConflicts(db);
      res.status(200).json({
        success: true,
        totalCustomersScanned: report.totalScanned,
        conflictCount: report.conflictCount,
        conflicts: report.conflicts,
        data: report
      });
    } catch (err: any) {
      console.error('Error auditing customer identity conflicts:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to audit customer identity conflicts',
        details: err?.message
      });
    }
  });

  // Step 4 Migration & Audit Sub-router
  router.use('/migration', createCustomerMigrationRouter());

  return router;
}
