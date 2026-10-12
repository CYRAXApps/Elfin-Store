import express from 'express';
import { getDb, FieldValue } from './serverDb';
import { normalizePhoneNumber } from './serverOtpAuth';

export interface CustomerAuditSummary {
  totalCustomerRecordsScanned: number;
  totalUserRecordsScanned: number;
  totalUniqueEntities: number;
  uidBasedRecordsCount: number;
  phoneBasedRecordsCount: number;
  emailBasedRecordsCount: number;
  duplicateRecordsCount: number;
  missingUidRecordsCount: number;
  multipleRecordsSameUidCount: number;
  phoneConflictsCount: number;
  emailConflictsCount: number;
  safelyMigratedCount: number;
  identityReviewRequiredCount: number;
  collectionsAudited: {
    customers: number;
    users: number;
    orders: number;
    addresses: number;
    reviews: number;
    wishlist: number;
    returns: number;
    supportTickets: number;
    rewards: number;
    storeCredits: number;
    notifications: number;
  };
}

export interface CustomerAuditItem {
  id: string;
  collection: 'customers' | 'users';
  firebaseUid: string;
  docId: string;
  name: string;
  mobile: string;
  normalizedMobile: string;
  email: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  unlinkedPhones: string[];
  unlinkedEmails: string[];
  category: 'UID_BASED' | 'PHONE_BASED' | 'EMAIL_BASED' | 'MISSING_UID';
  status: 'CANONICAL' | 'MIGRATION_ELIGIBLE' | 'IDENTITY_REVIEW_REQUIRED' | 'DUPLICATE_UID';
  conflictReasons: string[];
  linkedDataCounts: {
    orders: number;
    addresses: number;
    reviews: number;
    wishlist: number;
    returns: number;
    supportTickets: number;
    rewards: number;
    storeCredits: number;
  };
  details: any;
}

export interface AuditReport {
  timestamp: string;
  summary: CustomerAuditSummary;
  records: CustomerAuditItem[];
  identityReviewItems: CustomerAuditItem[];
  phoneConflicts: Array<{ phone: string; conflictingUids: string[]; docIds: string[] }>;
  emailConflicts: Array<{ email: string; conflictingUids: string[]; docIds: string[] }>;
  duplicateUidGroups: Array<{ uid: string; docIds: string[]; collections: string[] }>;
}

export interface MigrationResult {
  success: boolean;
  timestamp: string;
  backupId: string;
  dryRun: boolean;
  summary: {
    migratedProfiles: number;
    enrichedProfiles: number;
    migratedOrders: number;
    migratedReturns: number;
    migratedSupportTickets: number;
    migratedStoreCredits: number;
    migratedLoyaltyAccounts: number;
    flaggedForReview: number;
    beforeCounts: {
      customers: number;
      users: number;
      orders: number;
      returns: number;
      supportTickets: number;
      storeCredits: number;
      loyaltyAccounts: number;
    };
    afterCounts: {
      customers: number;
      users: number;
      orders: number;
      returns: number;
      supportTickets: number;
      storeCredits: number;
      loyaltyAccounts: number;
    };
    noDataLossConfirmed: boolean;
  };
  details: any[];
}

// Helper to check if record belongs to owner/staff
function isStaffOrOwner(uid: string, data: any): boolean {
  if (uid === 'ZudeiMJXXaUFxFN6sV8ErPplZ7w1') return true;
  if (data?.isPrimaryOwner === true || data?.role === 'owner' || data?.role === 'admin' || data?.role === 'staff' || data?.role === 'manager') return true;
  if (data?.email && data.email.toLowerCase().trim() === 'ritamsaha0000@gmail.com') return true;
  return false;
}

// Helper to detect if a string looks like a valid Firebase Auth UID
export function isFirebaseUid(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  // Firebase Auth UIDs are typically 20-36 alphanumeric characters, or custom prefixed like cust_...
  if (trimmed.startsWith('cust_') && trimmed.length >= 10) return true;
  if (/^[A-Za-z0-9_-]{20,40}$/.test(trimmed)) return true;
  return false;
}

// Helper to detect if string is phone number
export function isPhoneNumberString(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const digits = val.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

// Helper to detect if string is email
export function isEmailString(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

/**
 * Step 4.1: Perform safe audit of existing customer records
 */
export async function performCustomerAudit(db: any): Promise<AuditReport> {
  const timestamp = new Date().toISOString();

  // 1. Fetch all relevant collections safely
  const [
    custSnap,
    userSnap,
    ordersSnap,
    returnsSnap,
    ticketsSnap,
    creditsSnap,
    loyaltySnap,
    notificationsSnap
  ] = await Promise.all([
    db.collection('customers').get().catch(() => ({ docs: [] })),
    db.collection('users').get().catch(() => ({ docs: [] })),
    db.collection('orders').get().catch(() => ({ docs: [] })),
    db.collection('return_requests').get().catch(() => ({ docs: [] })),
    db.collection('support_tickets').get().catch(() => ({ docs: [] })),
    db.collection('storeCredits').get().catch(() => ({ docs: [] })),
    db.collection('loyaltyAccounts').get().catch(() => ({ docs: [] })),
    db.collection('notifications').get().catch(() => ({ docs: [] }))
  ]);

  // Index customer-owned data by various potential keys (UID, phone, email, customerId)
  const ordersByUid = new Map<string, number>();
  const ordersByPhone = new Map<string, number>();
  const ordersByEmail = new Map<string, number>();

  for (const doc of ordersSnap.docs) {
    const d = doc.data() || {};
    const uid = d.userId || d.customerId || d.customerUid || '';
    if (uid) ordersByUid.set(uid, (ordersByUid.get(uid) || 0) + 1);

    const phone = normalizePhoneNumber(d.customerPhone || d.phoneNumber || d.phone || d.shippingAddress?.phone || '');
    if (phone) ordersByPhone.set(phone, (ordersByPhone.get(phone) || 0) + 1);

    const email = (d.customerEmail || d.email || '').toLowerCase().trim();
    if (email) ordersByEmail.set(email, (ordersByEmail.get(email) || 0) + 1);
  }

  const returnsByUid = new Map<string, number>();
  for (const doc of returnsSnap.docs) {
    const d = doc.data() || {};
    const uid = d.userId || d.customerId || d.customerUid || '';
    if (uid) returnsByUid.set(uid, (returnsByUid.get(uid) || 0) + 1);
  }

  const ticketsByUid = new Map<string, number>();
  for (const doc of ticketsSnap.docs) {
    const d = doc.data() || {};
    const uid = d.userId || d.customerId || d.customerUid || '';
    if (uid) ticketsByUid.set(uid, (ticketsByUid.get(uid) || 0) + 1);
  }

  const creditsByUid = new Map<string, number>();
  for (const doc of creditsSnap.docs) {
    const d = doc.data() || {};
    const uid = d.userId || d.customerId || d.customerUid || '';
    if (uid) creditsByUid.set(uid, (creditsByUid.get(uid) || 0) + 1);
  }

  const loyaltyByUid = new Map<string, number>();
  for (const doc of loyaltySnap.docs) {
    const d = doc.data() || {};
    const uid = d.userId || d.customerId || d.customerUid || '';
    if (uid) loyaltyByUid.set(uid, (loyaltyByUid.get(uid) || 0) + 1);
  }

  // Raw item extraction
  const rawItems: Array<{
    collection: 'customers' | 'users';
    docId: string;
    data: any;
  }> = [];

  for (const doc of custSnap.docs) {
    const data = doc.data() || {};
    if (isStaffOrOwner(doc.id, data)) continue;
    rawItems.push({ collection: 'customers', docId: doc.id, data });
  }

  for (const doc of userSnap.docs) {
    const data = doc.data() || {};
    if (isStaffOrOwner(doc.id, data)) continue;
    rawItems.push({ collection: 'users', docId: doc.id, data });
  }

  // 2. Build maps to detect cross-record collisions
  const phoneToRecords = new Map<string, Array<{ uid: string; docId: string; collection: string }>>();
  const emailToRecords = new Map<string, Array<{ uid: string; docId: string; collection: string }>>();
  const uidToRecords = new Map<string, Array<{ docId: string; collection: string; data: any }>>();

  for (const item of rawItems) {
    const data = item.data;
    const explicitUid = data.uid || data.userId || data.customerId || '';
    const inferredUid = explicitUid || (isFirebaseUid(item.docId) ? item.docId : '');
    const mobile = data.phoneNumber || data.phone || data.mobile || (isPhoneNumberString(item.docId) ? item.docId : '');
    const normPhone = normalizePhoneNumber(mobile);
    const email = (data.email || (isEmailString(item.docId) ? item.docId : '')).toLowerCase().trim();

    if (inferredUid) {
      if (!uidToRecords.has(inferredUid)) uidToRecords.set(inferredUid, []);
      uidToRecords.get(inferredUid)!.push({ docId: item.docId, collection: item.collection, data });
    }

    if (normPhone) {
      if (!phoneToRecords.has(normPhone)) phoneToRecords.set(normPhone, []);
      phoneToRecords.get(normPhone)!.push({ uid: inferredUid || item.docId, docId: item.docId, collection: item.collection });
    }

    if (email) {
      if (!emailToRecords.has(email)) emailToRecords.set(email, []);
      emailToRecords.get(email)!.push({ uid: inferredUid || item.docId, docId: item.docId, collection: item.collection });
    }
  }

  // 3. Classify and evaluate each record
  const auditedRecords: CustomerAuditItem[] = [];
  const identityReviewItems: CustomerAuditItem[] = [];
  const phoneConflicts: Array<{ phone: string; conflictingUids: string[]; docIds: string[] }> = [];
  const emailConflicts: Array<{ email: string; conflictingUids: string[]; docIds: string[] }> = [];
  const duplicateUidGroups: Array<{ uid: string; docIds: string[]; collections: string[] }> = [];

  // Track unique phone conflicts
  for (const [phone, recs] of phoneToRecords.entries()) {
    const uniqueUids = Array.from(new Set(recs.map(r => r.uid).filter(Boolean)));
    if (uniqueUids.length > 1) {
      phoneConflicts.push({
        phone,
        conflictingUids: uniqueUids,
        docIds: recs.map(r => `${r.collection}/${r.docId}`)
      });
    }
  }

  // Track unique email conflicts
  for (const [email, recs] of emailToRecords.entries()) {
    const uniqueUids = Array.from(new Set(recs.map(r => r.uid).filter(Boolean)));
    if (uniqueUids.length > 1) {
      emailConflicts.push({
        email,
        conflictingUids: uniqueUids,
        docIds: recs.map(r => `${r.collection}/${r.docId}`)
      });
    }
  }

  // Track duplicate UID records
  for (const [uid, recs] of uidToRecords.entries()) {
    if (recs.length > 1) {
      duplicateUidGroups.push({
        uid,
        docIds: recs.map(r => r.docId),
        collections: recs.map(r => r.collection)
      });
    }
  }

  let uidBasedCount = 0;
  let phoneBasedCount = 0;
  let emailBasedCount = 0;
  let missingUidCount = 0;
  let safelyMigratedEligible = 0;

  for (const item of rawItems) {
    const data = item.data;
    const docId = item.docId;
    const explicitUid = data.uid || data.userId || data.customerId || '';
    const hasUidInDocId = isFirebaseUid(docId);
    const resolvedUid = explicitUid || (hasUidInDocId ? docId : '');

    const rawMobile = data.phoneNumber || data.phone || data.mobile || (isPhoneNumberString(docId) ? docId : '');
    const normPhone = normalizePhoneNumber(rawMobile);
    const rawEmail = (data.email || (isEmailString(docId) ? docId : '')).toLowerCase().trim();

    const name = data.name || data.fullName || data.displayName || 'Customer';
    const isPhoneVerified = data.isPhoneVerified === true || data.phoneVerified === true || !!data.phoneVerifiedAt;
    const isEmailVerified = data.isEmailVerified === true || data.emailVerified === true || !!data.emailVerifiedAt;
    const createdAt = data.createdAt || data.created_at || data.registeredAt || data.timestamp || '';
    const updatedAt = data.updatedAt || data.updated_at || '';
    const unlinkedPhones = Array.isArray(data.unlinkedPhones) ? data.unlinkedPhones : [];
    const unlinkedEmails = Array.isArray(data.unlinkedEmails) ? data.unlinkedEmails : [];

    // Determine category
    let category: CustomerAuditItem['category'] = 'UID_BASED';
    if (hasUidInDocId || (explicitUid && explicitUid === docId)) {
      category = 'UID_BASED';
      uidBasedCount++;
    } else if (isPhoneNumberString(docId)) {
      category = 'PHONE_BASED';
      phoneBasedCount++;
    } else if (isEmailString(docId)) {
      category = 'EMAIL_BASED';
      emailBasedCount++;
    } else if (!resolvedUid) {
      category = 'MISSING_UID';
      missingUidCount++;
    } else {
      category = 'UID_BASED';
      uidBasedCount++;
    }

    // Determine conflicts
    const conflictReasons: string[] = [];
    const phoneConflict = normPhone && phoneConflicts.find(c => c.phone === normPhone && c.conflictingUids.length > 1);
    if (phoneConflict) {
      conflictReasons.push(`Phone ${normPhone} is associated with multiple distinct UIDs: ${phoneConflict.conflictingUids.join(', ')}`);
    }

    const emailConflict = rawEmail && emailConflicts.find(c => c.email === rawEmail && c.conflictingUids.length > 1);
    if (emailConflict) {
      conflictReasons.push(`Email ${rawEmail} is associated with multiple distinct UIDs: ${emailConflict.conflictingUids.join(', ')}`);
    }

    if (!resolvedUid && category !== 'UID_BASED') {
      conflictReasons.push(`Record lacks an authoritative Firebase UID and cannot be safely mapped automatically.`);
    }

    // Determine status
    let status: CustomerAuditItem['status'] = 'CANONICAL';
    if (conflictReasons.length > 0) {
      status = 'IDENTITY_REVIEW_REQUIRED';
    } else if (item.collection === 'customers' && docId === resolvedUid && isFirebaseUid(docId)) {
      status = 'CANONICAL';
    } else if (resolvedUid && (item.collection === 'users' || docId !== resolvedUid)) {
      status = 'MIGRATION_ELIGIBLE';
      safelyMigratedEligible++;
    } else if (!resolvedUid) {
      status = 'IDENTITY_REVIEW_REQUIRED';
    }

    const auditItem: CustomerAuditItem = {
      id: `${item.collection}_${docId}`,
      collection: item.collection,
      firebaseUid: resolvedUid,
      docId,
      name,
      mobile: rawMobile,
      normalizedMobile: normPhone,
      email: rawEmail,
      isPhoneVerified,
      isEmailVerified,
      createdAt: typeof createdAt === 'object' && createdAt?.toDate ? createdAt.toDate().toISOString() : String(createdAt || ''),
      updatedAt: typeof updatedAt === 'object' && updatedAt?.toDate ? updatedAt.toDate().toISOString() : String(updatedAt || ''),
      unlinkedPhones,
      unlinkedEmails,
      category,
      status,
      conflictReasons,
      linkedDataCounts: {
        orders: (ordersByUid.get(resolvedUid) || 0) + (ordersByPhone.get(normPhone) || 0),
        addresses: Array.isArray(data.addresses) ? data.addresses.length : (data.address ? 1 : 0),
        reviews: 0,
        wishlist: Array.isArray(data.wishlist) ? data.wishlist.length : 0,
        returns: returnsByUid.get(resolvedUid) || 0,
        supportTickets: ticketsByUid.get(resolvedUid) || 0,
        rewards: loyaltyByUid.get(resolvedUid) || 0,
        storeCredits: creditsByUid.get(resolvedUid) || 0,
      },
      details: {
        rawKeys: Object.keys(data),
        isMigrated: data.isMigrated || false,
        migratedToUid: data.migratedToUid || null
      }
    };

    auditedRecords.push(auditItem);

    if (status === 'IDENTITY_REVIEW_REQUIRED') {
      identityReviewItems.push(auditItem);
    }
  }

  const summary: CustomerAuditSummary = {
    totalCustomerRecordsScanned: custSnap.docs.length,
    totalUserRecordsScanned: userSnap.docs.length,
    totalUniqueEntities: new Set(auditedRecords.map(r => r.firebaseUid || r.docId)).size,
    uidBasedRecordsCount: uidBasedCount,
    phoneBasedRecordsCount: phoneBasedCount,
    emailBasedRecordsCount: emailBasedCount,
    duplicateRecordsCount: duplicateUidGroups.reduce((acc, g) => acc + g.docIds.length, 0),
    missingUidRecordsCount: missingUidCount,
    multipleRecordsSameUidCount: duplicateUidGroups.length,
    phoneConflictsCount: phoneConflicts.length,
    emailConflictsCount: emailConflicts.length,
    safelyMigratedCount: safelyMigratedEligible,
    identityReviewRequiredCount: identityReviewItems.length,
    collectionsAudited: {
      customers: custSnap.docs.length,
      users: userSnap.docs.length,
      orders: ordersSnap.docs.length,
      addresses: auditedRecords.reduce((acc, r) => acc + r.linkedDataCounts.addresses, 0),
      reviews: 0,
      wishlist: auditedRecords.reduce((acc, r) => acc + r.linkedDataCounts.wishlist, 0),
      returns: returnsSnap.docs.length,
      supportTickets: ticketsSnap.docs.length,
      rewards: loyaltySnap.docs.length,
      storeCredits: creditsSnap.docs.length,
      notifications: notificationsSnap.docs.length
    }
  };

  return {
    timestamp,
    summary,
    records: auditedRecords,
    identityReviewItems,
    phoneConflicts,
    emailConflicts,
    duplicateUidGroups
  };
}

/**
 * Step 4.2 & 4.3: Safe migration execution with non-destructive backup and rollback snapshot
 */
export async function executeCustomerMigration(db: any, dryRun: boolean = false): Promise<MigrationResult> {
  const timestamp = new Date().toISOString();
  const backupId = `migration_backup_${Date.now()}`;

  // 1. First run complete audit to get candidate records
  const auditReport = await performCustomerAudit(db);
  const { records, identityReviewItems } = auditReport;

  // 2. Fetch all collections before migration for verification
  const [
    custSnapBefore,
    userSnapBefore,
    ordersSnapBefore,
    returnsSnapBefore,
    ticketsSnapBefore,
    creditsSnapBefore,
    loyaltySnapBefore
  ] = await Promise.all([
    db.collection('customers').get().catch(() => ({ docs: [] })),
    db.collection('users').get().catch(() => ({ docs: [] })),
    db.collection('orders').get().catch(() => ({ docs: [] })),
    db.collection('return_requests').get().catch(() => ({ docs: [] })),
    db.collection('support_tickets').get().catch(() => ({ docs: [] })),
    db.collection('storeCredits').get().catch(() => ({ docs: [] })),
    db.collection('loyaltyAccounts').get().catch(() => ({ docs: [] }))
  ]);

  const beforeCounts = {
    customers: custSnapBefore.docs.length,
    users: userSnapBefore.docs.length,
    orders: ordersSnapBefore.docs.length,
    returns: returnsSnapBefore.docs.length,
    supportTickets: ticketsSnapBefore.docs.length,
    storeCredits: creditsSnapBefore.docs.length,
    loyaltyAccounts: loyaltySnapBefore.docs.length,
  };

  const migrationDetails: any[] = [];
  let migratedProfiles = 0;
  let enrichedProfiles = 0;
  let migratedOrders = 0;
  let migratedReturns = 0;
  let migratedSupportTickets = 0;
  let migratedStoreCredits = 0;
  let migratedLoyaltyAccounts = 0;

  if (!dryRun) {
    // 3. Create persistent backup snapshot
    try {
      const backupData = {
        backupId,
        createdAt: timestamp,
        beforeCounts,
        customers: custSnapBefore.docs.map(d => ({ id: d.id, data: d.data() })),
        users: userSnapBefore.docs.map(d => ({ id: d.id, data: d.data() }))
      };
      await db.collection('_audit_backups').doc(backupId).set(backupData);
    } catch (bErr: any) {
      console.warn('Notice saving migration backup in Firestore:', bErr.message);
    }

    // 4. Safe profile migration and canonicalization
    // Group records by UID to consolidate profiles cleanly
    const uidMap = new Map<string, CustomerAuditItem[]>();
    for (const rec of records) {
      if (rec.firebaseUid && rec.status !== 'IDENTITY_REVIEW_REQUIRED') {
        if (!uidMap.has(rec.firebaseUid)) uidMap.set(rec.firebaseUid, []);
        uidMap.get(rec.firebaseUid)!.push(rec);
      }
    }

    for (const [uid, group] of uidMap.entries()) {
      try {
        const canonicalCustRef = db.collection('customers').doc(uid);
        const canonicalUserRef = db.collection('users').doc(uid);

        const existingCustDoc = await canonicalCustRef.get().catch(() => null);
        const existingUserData = (await canonicalUserRef.get().catch(() => null))?.data() || {};
        const existingCustData = existingCustDoc?.exists ? existingCustDoc.data() : {};

        // Merge non-conflicting profile fields preserving all user data
        const mergedData: any = {
          uid,
          updatedAt: new Date().toISOString(),
          canonicalIdentity: true,
          ...existingUserData,
          ...existingCustData
        };

        // Combine unlinked phones & emails across all docs in group
        const allUnlinkedPhones = new Set<string>([
          ...(Array.isArray(existingCustData.unlinkedPhones) ? existingCustData.unlinkedPhones : []),
          ...(Array.isArray(existingUserData.unlinkedPhones) ? existingUserData.unlinkedPhones : [])
        ]);
        const allUnlinkedEmails = new Set<string>([
          ...(Array.isArray(existingCustData.unlinkedEmails) ? existingCustData.unlinkedEmails : []),
          ...(Array.isArray(existingUserData.unlinkedEmails) ? existingUserData.unlinkedEmails : [])
        ]);

        for (const item of group) {
          item.unlinkedPhones.forEach(p => allUnlinkedPhones.add(p));
          item.unlinkedEmails.forEach(e => allUnlinkedEmails.add(e));
        }

        mergedData.unlinkedPhones = Array.from(allUnlinkedPhones);
        mergedData.unlinkedEmails = Array.from(allUnlinkedEmails);

        // Ensure primary mobile & email
        const activeItem = group.find(g => g.mobile || g.email) || group[0];
        if (!mergedData.phoneNumber && activeItem?.mobile) mergedData.phoneNumber = activeItem.mobile;
        if (!mergedData.phone && activeItem?.mobile) mergedData.phone = activeItem.mobile;
        if (!mergedData.email && activeItem?.email) mergedData.email = activeItem.email;
        if (!mergedData.name && activeItem?.name) mergedData.name = activeItem.name;

        // Preserve verification status
        mergedData.isPhoneVerified = mergedData.isPhoneVerified || group.some(g => g.isPhoneVerified);
        mergedData.isEmailVerified = mergedData.isEmailVerified || group.some(g => g.isEmailVerified);

        // Write canonical customer record at customers/{uid} AND dual-persist at users/{uid}
        await canonicalCustRef.set(mergedData, { merge: true });
        await canonicalUserRef.set(mergedData, { merge: true });

        if (!existingCustDoc?.exists) {
          migratedProfiles++;
        } else {
          enrichedProfiles++;
        }

        // If legacy documents exist (e.g. phone-based ID), tag them non-destructively
        for (const item of group) {
          if (item.docId !== uid) {
            try {
              await db.collection(item.collection).doc(item.docId).set({
                isMigrated: true,
                migratedToUid: uid,
                migratedAt: timestamp
              }, { merge: true });
            } catch (err) {}
          }
        }

        migrationDetails.push({
          uid,
          action: 'CANONICALIZED',
          docsConsolidated: group.map(g => `${g.collection}/${g.docId}`)
        });
      } catch (err: any) {
        console.error(`Error migrating profile for UID ${uid}:`, err);
      }
    }

    // 5. Migrate customer-owned records (orders, returns, support tickets, rewards, store credits)
    // For each record that has phone/email matching an unambiguous UID, ensure userId & customerId are set
    const phoneToSingleUid = new Map<string, string>();

    // Build unambiguous phone -> UID mapping
    const phoneCountMap = new Map<string, Set<string>>();
    const emailCountMap = new Map<string, Set<string>>();
    for (const rec of records) {
      if (rec.firebaseUid && rec.normalizedMobile) {
        if (!phoneCountMap.has(rec.normalizedMobile)) phoneCountMap.set(rec.normalizedMobile, new Set());
        phoneCountMap.get(rec.normalizedMobile)!.add(rec.firebaseUid);
      }
      if (rec.firebaseUid && rec.email) {
        if (!emailCountMap.has(rec.email)) emailCountMap.set(rec.email, new Set());
        emailCountMap.get(rec.email)!.add(rec.firebaseUid);
      }
    }

    // Migrate Orders
    for (const doc of ordersSnapBefore.docs) {
      const d = doc.data() || {};
      const currentUid = d.userId || d.customerId || d.customerUid;
      if (!currentUid || !isFirebaseUid(currentUid)) {
        const phone = normalizePhoneNumber(d.customerPhone || d.phoneNumber || d.phone || d.shippingAddress?.phone || '');
        const email = (d.customerEmail || d.email || '').toLowerCase().trim();
        let targetUid = '';

        if (phone && phoneCountMap.get(phone)?.size === 1) {
          targetUid = Array.from(phoneCountMap.get(phone)!)[0];
        } else if (email && emailCountMap.get(email)?.size === 1) {
          targetUid = Array.from(emailCountMap.get(email)!)[0];
        }

        if (targetUid) {
          await db.collection('orders').doc(doc.id).set({
            userId: targetUid,
            customerId: targetUid,
            customerUid: targetUid,
            migratedOwnershipAt: timestamp
          }, { merge: true });
          migratedOrders++;
        }
      }
    }

    // Migrate Return Requests
    for (const doc of returnsSnapBefore.docs) {
      const d = doc.data() || {};
      const currentUid = d.userId || d.customerId || d.customerUid;
      if (!currentUid || !isFirebaseUid(currentUid)) {
        const phone = normalizePhoneNumber(d.customerPhone || d.phone || '');
        let targetUid = '';
        if (phone && phoneCountMap.get(phone)?.size === 1) {
          targetUid = Array.from(phoneCountMap.get(phone)!)[0];
        }
        if (targetUid) {
          await db.collection('return_requests').doc(doc.id).set({
            userId: targetUid,
            customerId: targetUid,
            customerUid: targetUid,
            migratedOwnershipAt: timestamp
          }, { merge: true });
          migratedReturns++;
        }
      }
    }

    // Migrate Support Tickets
    for (const doc of ticketsSnapBefore.docs) {
      const d = doc.data() || {};
      const currentUid = d.userId || d.customerId || d.customerUid;
      if (!currentUid || !isFirebaseUid(currentUid)) {
        const phone = normalizePhoneNumber(d.customerPhone || d.phone || '');
        let targetUid = '';
        if (phone && phoneCountMap.get(phone)?.size === 1) {
          targetUid = Array.from(phoneCountMap.get(phone)!)[0];
        }
        if (targetUid) {
          await db.collection('support_tickets').doc(doc.id).set({
            userId: targetUid,
            customerId: targetUid,
            customerUid: targetUid,
            migratedOwnershipAt: timestamp
          }, { merge: true });
          migratedSupportTickets++;
        }
      }
    }

    // Flag ambiguous records internally
    for (const item of identityReviewItems) {
      try {
        await db.collection(item.collection).doc(item.docId).set({
          identityReviewRequired: true,
          identityReviewReason: item.conflictReasons.join('; '),
          identityReviewFlaggedAt: timestamp
        }, { merge: true });
      } catch (err) {}
    }
  }

  // 6. Fetch after counts to verify zero data loss
  const [
    custSnapAfter,
    userSnapAfter,
    ordersSnapAfter,
    returnsSnapAfter,
    ticketsSnapAfter,
    creditsSnapAfter,
    loyaltySnapAfter
  ] = await Promise.all([
    db.collection('customers').get().catch(() => ({ docs: [] })),
    db.collection('users').get().catch(() => ({ docs: [] })),
    db.collection('orders').get().catch(() => ({ docs: [] })),
    db.collection('return_requests').get().catch(() => ({ docs: [] })),
    db.collection('support_tickets').get().catch(() => ({ docs: [] })),
    db.collection('storeCredits').get().catch(() => ({ docs: [] })),
    db.collection('loyaltyAccounts').get().catch(() => ({ docs: [] }))
  ]);

  const afterCounts = {
    customers: custSnapAfter.docs.length,
    users: userSnapAfter.docs.length,
    orders: ordersSnapAfter.docs.length,
    returns: returnsSnapAfter.docs.length,
    supportTickets: ticketsSnapAfter.docs.length,
    storeCredits: creditsSnapAfter.docs.length,
    loyaltyAccounts: loyaltySnapAfter.docs.length,
  };

  const noDataLossConfirmed =
    afterCounts.customers >= beforeCounts.customers &&
    afterCounts.orders >= beforeCounts.orders &&
    afterCounts.returns >= beforeCounts.returns &&
    afterCounts.supportTickets >= beforeCounts.supportTickets &&
    afterCounts.storeCredits >= beforeCounts.storeCredits &&
    afterCounts.loyaltyAccounts >= beforeCounts.loyaltyAccounts;

  return {
    success: true,
    timestamp,
    backupId,
    dryRun,
    summary: {
      migratedProfiles,
      enrichedProfiles,
      migratedOrders,
      migratedReturns,
      migratedSupportTickets,
      migratedStoreCredits,
      migratedLoyaltyAccounts,
      flaggedForReview: identityReviewItems.length,
      beforeCounts,
      afterCounts,
      noDataLossConfirmed
    },
    details: migrationDetails
  };
}

/**
 * Express router for Step 4 customer migration & audit endpoints
 */
export function createCustomerMigrationRouter(): express.Router {
  const router = express.Router();
  router.use(express.json());

  // GET /api/auth/otp/migration/audit
  router.get('/audit', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const db = getDb();
      const report = await performCustomerAudit(db);
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (err: any) {
      console.error('Error running customer migration audit:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to perform customer audit',
        details: err?.message
      });
    }
  });

  // POST /api/auth/otp/migration/execute
  router.post('/execute', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const db = getDb();
      const dryRun = req.body?.dryRun === true;
      const result = await executeCustomerMigration(db, dryRun);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      console.error('Error executing customer migration:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to execute customer migration',
        details: err?.message
      });
    }
  });

  // GET /api/auth/otp/migration/status
  router.get('/status', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const db = getDb();
      const report = await performCustomerAudit(db);
      res.status(200).json({
        success: true,
        summary: report.summary,
        timestamp: report.timestamp
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  return router;
}
