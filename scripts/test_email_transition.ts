import { getDb, getAdminAuth, FieldValue } from '../serverDb';
import { 
  findActiveCustomerByEmail, 
  matchesActiveCustomerEmail, 
  saveCustomerDocument,
  generatePermanentCustomerUid
} from '../serverOtpAuth';

async function runEmailTest() {
  console.log('==================================================');
  console.log('TESTING REQUIREMENT 16: EMAIL TRANSITION (Email A -> Email B)');
  console.log('==================================================');

  const db = getDb();
  const testId = `test_${Date.now()}`;
  const emailA = `test_user_a_${testId}@example.com`;
  const emailB = `test_user_b_${testId}@example.com`;
  const permanentUid = generatePermanentCustomerUid();

  console.log(`[SETUP] Generated Permanent UID: ${permanentUid}`);
  console.log(`[SETUP] Email A: ${emailA}`);
  console.log(`[SETUP] Email B: ${emailB}`);

  // Step 1: Create initial user with Email A
  await saveCustomerDocument(db, permanentUid, {
    uid: permanentUid,
    email: emailA,
    displayName: 'Test Email User',
    phoneNumber: '+919876500001',
    role: 'customer',
    createdAt: FieldValue.serverTimestamp()
  });

  console.log('[STEP 1] Account created with Email A.');
  
  // Verify lookup by Email A succeeds
  const docA = await findActiveCustomerByEmail(db, emailA);
  if (!docA || docA.id !== permanentUid) {
    throw new Error(`Lookup by Email A failed. Expected ${permanentUid}, got ${docA?.id}`);
  }
  console.log(`[STEP 1 PASS] Email A resolves to UID: ${docA.id}`);

  // Step 2: Change email from Email A to Email B (simulating /api/auth/otp/verify-email-update)
  const custDoc = await db.collection('customers').doc(permanentUid).get();
  const currentData = custDoc.data() || {};
  
  const updates: Record<string, any> = {
    email: emailB,
    emailVerified: true,
    isEmailVerified: true,
    unlinkedEmails: [emailA],
    previousEmails: [emailA],
    updatedAt: FieldValue.serverTimestamp()
  };

  await saveCustomerDocument(db, permanentUid, {
    ...currentData,
    ...updates
  });
  console.log('[STEP 2] Successfully updated account email from Email A to Email B.');

  // Step 3: Verify Email A CANNOT find or access the account anymore
  const docAfterA = await findActiveCustomerByEmail(db, emailA);
  if (docAfterA) {
    throw new Error(`SECURITY FAILURE: Email A STILL resolved to an active account: ${docAfterA.id}`);
  }
  console.log('[STEP 3 PASS] Email A does NOT resolve to any account. Old email is fully decoupled.');

  // Step 4: Verify Email B resolves to THE EXACT SAME UID
  const docAfterB = await findActiveCustomerByEmail(db, emailB);
  if (!docAfterB || docAfterB.id !== permanentUid) {
    throw new Error(`RESOLUTION FAILURE: Email B resolved to ${docAfterB?.id} instead of original UID ${permanentUid}`);
  }
  console.log(`[STEP 4 PASS] Email B resolves to THE EXACT SAME UID: ${docAfterB.id}`);

  // Step 5: Verify customer document integrity
  const finalDoc = await db.collection('customers').doc(permanentUid).get();
  const finalData = finalDoc.data() || {};
  if (finalData.email !== emailB) {
    throw new Error(`Data mismatch: expected email ${emailB}, got ${finalData.email}`);
  }
  if (!finalData.unlinkedEmails?.includes(emailA)) {
    throw new Error(`Unlinked emails missing Email A: ${JSON.stringify(finalData.unlinkedEmails)}`);
  }
  console.log('[STEP 5 PASS] Customer document retains permanent UID, updated email, and audit trail of previous emails.');

  console.log('==================================================');
  console.log('ALL EMAIL TRANSITION TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runEmailTest().then(() => process.exit(0)).catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
