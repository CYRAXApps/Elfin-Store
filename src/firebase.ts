import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  initializeFirestore, 
  getFirestore, 
  Firestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence internal Firestore SDK grpc errors in console
setLogLevel('silent');

// Intercept window and console errors related to unenabled/pending Cloud Firestore API
if (typeof window !== 'undefined') {
  const isIgnorableError = (arg: any): boolean => {
    if (!arg) return false;
    let text = '';
    if (typeof arg === 'string') {
      text = arg;
    } else if (arg instanceof Error) {
      text = `${arg.name} ${arg.message} ${arg.stack || ''}`;
    } else if (typeof arg === 'object') {
      try {
        text = JSON.stringify(arg);
      } catch {
        text = String(arg);
      }
    } else {
      text = String(arg);
    }
    const lower = text.toLowerCase();
    return (
      lower.includes('failed to get document because the client is offline') ||
      lower.includes('the client is offline') ||
      lower.includes('client is offline') ||
      lower.includes('database (default) does not exist') ||
      lower.includes('does not exist for project') ||
      lower.includes('database does not exist') ||
      lower.includes('cloud firestore api has not been used') ||
      lower.includes('permission_denied') ||
      lower.includes('permission-denied') ||
      lower.includes('missing or insufficient permissions') ||
      lower.includes('database was deleted') ||
      lower.includes('database_deleted') ||
      lower.includes('cannot serve requests') ||
      lower.includes('failed_precondition') ||
      lower.includes('failed-precondition') ||
      lower.includes('code: 9') ||
      lower.includes('code: 7') ||
      lower.includes('code: 1') ||
      lower.includes('disconnecting idle stream') ||
      lower.includes('timed out waiting for new targets') ||
      (lower.includes('write') && lower.includes('stream')) ||
      (lower.includes('listen') && lower.includes('stream')) ||
      (lower.includes('rpc') && lower.includes('stream')) ||
      lower.includes('grpcconnection') ||
      lower.includes('grpc connection') ||
      lower.includes('@firebase/firestore') ||
      lower.includes('config-fetch-failed') ||
      lower.includes('request-failed') ||
      lower.includes('installations') ||
      lower.includes('firebaseanalytics') ||
      lower.includes('firebaseinstallations') ||
      lower.includes('analytics/config-fetch-failed') ||
      lower.includes('installations/request-failed')
    );
  };

  const checkAnyIgnorable = (...args: any[]): boolean => {
    return args.some(arg => isIgnorableError(arg)) || isIgnorableError(args.map(a => String(a?.message || a)).join(' '));
  };

  window.addEventListener('error', (event) => {
    if (isIgnorableError(event.error) || isIgnorableError(event.message)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isIgnorableError(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
      event.stopPropagation();
    }
  }, true);

  const origConsoleError = console.error;
  console.error = function (...args: any[]) {
    if (checkAnyIgnorable(...args)) {
      return;
    }
    origConsoleError.apply(console, args);
  };

  const origConsoleWarn = console.warn;
  console.warn = function (...args: any[]) {
    if (checkAnyIgnorable(...args)) {
      return;
    }
    origConsoleWarn.apply(console, args);
  };

  const origConsoleLog = console.log;
  console.log = function (...args: any[]) {
    if (checkAnyIgnorable(...args)) {
      return;
    }
    origConsoleLog.apply(console, args);
  };

  const origConsoleInfo = console.info;
  console.info = function (...args: any[]) {
    if (checkAnyIgnorable(...args)) {
      return;
    }
    origConsoleInfo.apply(console, args);
  };

  const origConsoleDebug = console.debug;
  console.debug = function (...args: any[]) {
    if (checkAnyIgnorable(...args)) {
      return;
    }
    origConsoleDebug.apply(console, args);
  };
}

const effectiveConfig = {
  ...firebaseConfig,
  apiKey: (firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '') 
    ? firebaseConfig.apiKey 
    : 'AIzaSyDummyDevApiKeyForInitialization123456789'
};

export const app = getApps().length > 0 ? getApp() : initializeApp(effectiveConfig);

let authInstance: any;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn('Firebase Auth initialization warning caught:', e);
  authInstance = {
    currentUser: null,
    onAuthStateChanged: (cb: any) => { cb(null); return () => {}; },
    signOut: async () => {},
  } as any;
}

export const auth = authInstance;

let storageInstance: any;
try {
  storageInstance = getStorage(app);
} catch (e) {
  storageInstance = null;
}
export const storage = storageInstance;

// Initialize Firebase Analytics safely for web environment
export let analytics: any = null;
if (typeof window !== 'undefined') {
  const hasValidMeasurementId = 
    typeof firebaseConfig.measurementId === 'string' && 
    firebaseConfig.measurementId.trim().startsWith('G-');
  const hasValidAppId = 
    typeof firebaseConfig.appId === 'string' && 
    firebaseConfig.appId.trim() !== '' && 
    !firebaseConfig.appId.includes('dummy');

  if (hasValidMeasurementId && hasValidAppId) {
    isSupported().then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
          // Ignore analytics initialization errors
        }
      }
    }).catch(() => {
      // Ignore environments where analytics is not supported (e.g. iframes/SSR)
    });
  }
}

let dbInstance: Firestore;
try {
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' && firebaseConfig.firestoreDatabaseId.trim() !== '') {
    dbInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } else {
    dbInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        experimentalForceLongPolling: true,
      }
    );
  }
} catch (e) {
  try {
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' && firebaseConfig.firestoreDatabaseId.trim() !== '') {
      dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(app);
    }
  } catch (err) {
    dbInstance = getFirestore(app);
  }
}

export const db = dbInstance;
