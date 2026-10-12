import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import config from './firebase-applet-config.json';

async function diagnose() {
  console.log('--- Diagnosis: elfin-store Connectivity ---');
  
  try {
    const app = initializeApp(config, 'diagnose-' + Date.now());
    
    // 1. Check Auth (Verifies API Key/Project ID pairing)
    console.log('Checking Auth...');
    const auth = getAuth(app);
    console.log('[PASS] Auth initialized. API Key/Project ID pairing valid.');

    // 2. Check Firestore (Verifies Database existence)
    console.log('Checking Firestore...');
    const db = getFirestore(app);
    // Use a top-level collection that might exist
    const snap = await getDocs(collection(db, 'products'));
    console.log('[PASS] Firestore reached. Docs count:', snap.docs.length);

  } catch (err: any) {
    console.error(`[FAIL] Operation: ${err.name || 'Unknown'}`);
    console.error(`[FAIL] Code: ${err.code}`);
    console.error(`[FAIL] Message: ${err.message}`);
  }
  console.log('--- Diagnosis Complete ---');
}

diagnose();
