import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import config from './firebase-applet-config.json';

async function verifyConnectivity() {
  console.log('--- Starting Read-Only Firestore Connectivity Verification ---');
  console.log('Target Project:', config.projectId);
  console.log('Target Database:', config.firestoreDatabaseId || '(default)');

  const app = initializeApp(config, 'verify-app-' + Date.now());
  const db = getFirestore(app);

  try {
    // 1. Harmless read against a nonexistent document path
    // If the DB/Project exists, this should return a snapshot with .exists() === false (not throw an error).
    const docRef = doc(db, '_read_only_audit', 'nonexistent_test_doc_00000');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      console.log('[PASS] Firestore reachable: Document read returned "does not exist" as expected.');
    } else {
      console.log('[NOT VERIFIED] Document exists unexpectedly.');
    }
  } catch (err: any) {
    // Distinguish errors
    if (err.code === 'permission-denied' || err.code === 'missing-or-insufficient-permissions') {
      console.log('[PASS] Connectivity confirmed: Server returned Permission Denied (Database/Project exists, but rules block access).');
    } else if (err.code === 'not-found') {
      console.error('[FAIL] Project or Database NOT FOUND.');
    } else {
      console.error(`[FAIL] Unexpected error: ${err.code} - ${err.message}`);
    }
  }

  console.log('--- Verification Complete ---');
}

verifyConnectivity();
