import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import config from './firebase-applet-config.json';

async function runAudit() {
  console.log('--- Starting Firebase Consistency Audit ---');
  
  // 1. Verify Configuration
  const expectedProjectId = 'elfin-store';
  console.log('Configured Project ID:', config.projectId);
  console.log('Configured Database ID:', config.firestoreDatabaseId || '(default)');

  if (config.projectId !== expectedProjectId) {
    console.error(`[FAILED] Project ID Mismatch. Expected: ${expectedProjectId}, Actual: ${config.projectId}`);
    process.exit(1);
  } else {
    console.log('[VERIFIED] Project ID matches expected value.');
  }

  // 2. Test Connectivity
  try {
    const app = initializeApp(config, 'audit-app-' + Date.now());
    const db = getFirestore(app);

    console.log('Testing Firestore database reachability...');
    // Accessing a path that likely does not exist to test connectivity/rules, not data availability.
    const testRef = collection(db, '_audit_test_connectivity');
    await getDocs(testRef);
    console.log('[VERIFIED] Firestore reached successfully.');
  } catch (err: any) {
    if (err.code === 'permission-denied' || err.code === 'missing-or-insufficient-permissions') {
      console.log('[VERIFIED] Firestore reached (Connectivity confirmed, but access to _audit_test_connectivity was blocked by security rules as expected).');
    } else {
      console.error(`[FAILED] Connectivity test failed: ${err.message}`);
      process.exit(1);
    }
  }

  console.log('--- Audit Complete ---');
}

runAudit();
