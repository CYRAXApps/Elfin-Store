import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  runTransaction,
  writeBatch,
  type Firestore as ClientFirestore,
  type DocumentReference,
  type CollectionReference,
  type Query as ClientQuery,
  type DocumentData,
  setLogLevel
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Suppress unhandled internal gRPC stream logging in server environment
try {
  setLogLevel('silent');
} catch {
  // Non-fatal if logger already configured
}

let clientAppInstance: FirebaseApp | null = null;
let clientFirestoreInstance: ClientFirestore | null = null;

export function getClientFirestore(): ClientFirestore {
  if (clientFirestoreInstance) return clientFirestoreInstance;

  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json not found');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  if (getApps().length > 0) {
    clientAppInstance = getApps()[0];
  } else {
    clientAppInstance = initializeApp(config, 'server-db-app');
  }

  const dbId = (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' && config.firestoreDatabaseId.trim() !== '') 
    ? config.firestoreDatabaseId 
    : undefined;

  try {
    clientFirestoreInstance = initializeFirestore(clientAppInstance, {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true
    }, dbId);
  } catch (e) {
    clientFirestoreInstance = dbId 
      ? getFirestore(clientAppInstance, dbId) 
      : getFirestore(clientAppInstance);
  }

  return clientFirestoreInstance;
}

// Recursively sanitize objects to remove undefined values
function sanitizeData(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (obj._methodName || (obj.constructor && obj.constructor.name === 'FieldValue')) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeData);
  }

  const res: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      res[key] = sanitizeData(value);
    }
  }
  return res;
}

// Wrapper for document snapshots ensuring compatibility with both snap.exists (boolean) and snap.exists() (function)
function wrapDocSnapshot(snap: any): any {
  if (!snap) return snap;
  if ('docs' in snap && Array.isArray(snap.docs)) {
    const wrappedDocs = snap.docs.map(wrapDocSnapshot);
    return {
      empty: snap.empty,
      size: snap.size,
      docs: wrappedDocs,
      forEach(callback: any) {
        wrappedDocs.forEach(callback);
      },
      docChanges() {
        return typeof snap.docChanges === 'function' ? snap.docChanges() : [];
      }
    };
  }

  const isExisting = typeof snap.exists === 'function' ? snap.exists() : Boolean(snap.exists);
  const existsFn = () => isExisting;
  
  const proxy = new Proxy(existsFn, {
    get(target, prop) {
      if (prop === 'id') return snap.id;
      if (prop === 'ref') return snap.ref ? wrapDocRef(snap.ref) : snap.ref;
      if (prop === 'exists') return isExisting;
      if (prop === 'data') return () => (typeof snap.data === 'function' ? snap.data() : undefined);
      if (prop === 'get') return (fieldPath: string) => (typeof snap.get === 'function' ? snap.get(fieldPath) : undefined);
      return (snap as any)[prop];
    },
    apply(target, thisArg, argArray) {
      return isExisting;
    }
  });

  return Object.assign(proxy, {
    id: snap.id,
    ref: snap.ref ? wrapDocRef(snap.ref) : snap.ref,
    exists: isExisting,
    data: () => (typeof snap.data === 'function' ? snap.data() : undefined),
    get: (fieldPath: string) => (typeof snap.get === 'function' ? snap.get(fieldPath) : undefined)
  });
}

function handleDbError(opName: string, err: any) {
  if (err && (err.code === 'failed-precondition' || String(err?.message || err).includes('database was deleted') || String(err?.message || err).includes('FAILED_PRECONDITION'))) {
    // Database unprovisioned or deleted — operating in quiet resilient mode
    return;
  }
  console.warn(`Notice in ${opName}:`, err?.message || err);
}

function decodeFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in val) return decodeFirestoreFields(val.mapValue.fields || {});
  return null;
}

function decodeFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fields) return result;
  for (const [key, val] of Object.entries(fields)) {
    result[key] = decodeFirestoreValue(val);
  }
  return result;
}

function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === 'object') {
    if (val._methodName === 'serverTimestamp') {
      return { timestampValue: new Date().toISOString() };
    }
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = encodeFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function encodeFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) fields[k] = encodeFirestoreValue(v);
  }
  return fields;
}

async function restGetDoc(docPath: string) {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${encodeURIComponent(config.firestoreDatabaseId)}/documents/${docPath}?key=${config.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return wrapDocSnapshot({ exists: false, data: () => undefined, id: docPath.split('/').pop() });
      return null;
    }
    const json: any = await res.json();
    const dataObj = decodeFirestoreFields(json.fields || {});
    return wrapDocSnapshot({
      exists: true,
      id: json.name ? json.name.split('/').pop() : docPath.split('/').pop(),
      data: () => dataObj
    });
  } catch {
    return null;
  }
}

async function restSetDoc(docPath: string, data: any, merge: boolean = true) {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) throw new Error('Config missing');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${encodeURIComponent(config.firestoreDatabaseId)}/documents/${docPath}?key=${config.apiKey}`;
  
  const encodedFields = encodeFirestoreFields(data);
  const bodyPayload: any = { fields: encodedFields };
  
  let patchUrl = url;
  if (merge && Object.keys(encodedFields).length > 0) {
    const masks = Object.keys(encodedFields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&');
    patchUrl += `&${masks}`;
  }
  
  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyPayload)
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`REST setDoc failed (${res.status}): ${errText}`);
  }
  return true;
}

async function restDeleteDoc(docPath: string) {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) return true;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${encodeURIComponent(config.firestoreDatabaseId)}/documents/${docPath}?key=${config.apiKey}`;
  const res = await fetch(url, { method: 'DELETE' });
  return res.ok || res.status === 404;
}

export function wrapDocRef(dRef: DocumentReference): any {
  return {
    id: dRef.id,
    path: dRef.path,
    _clientRef: dRef,
    async get() {
      const restSnap = await restGetDoc(dRef.path);
      if (restSnap) return restSnap;
      try {
        const snap = await Promise.race([
          getDoc(dRef),
          new Promise<null>((res) => setTimeout(() => res(null), 3000))
        ]);
        return snap ? wrapDocSnapshot(snap) : { exists: false, data: () => undefined, id: dRef.id };
      } catch (err) {
        handleDbError('getDoc', err);
        return { exists: false, data: () => undefined, id: dRef.id };
      }
    },
    async set(data: any, options?: { merge?: boolean }) {
      const sanitized = sanitizeData(data);
      try {
        await restSetDoc(dRef.path, sanitized, options?.merge !== false);
        return this;
      } catch (restErr) {
        try {
          await Promise.race([
            setDoc(dRef, sanitized, options || {}),
            new Promise((_, rej) => setTimeout(() => rej(new Error('Firestore write timed out')), 4000))
          ]);
        } catch (err) {
          handleDbError('setDoc', err);
          throw err;
        }
        return this;
      }
    },
    async update(data: any) {
      const sanitized = sanitizeData(data);
      try {
        await restSetDoc(dRef.path, sanitized, true);
        return this;
      } catch (restErr) {
        try {
          await Promise.race([
            updateDoc(dRef, sanitized),
            new Promise((_, rej) => setTimeout(() => rej(new Error('Firestore update timed out')), 4000))
          ]);
        } catch (err) {
          handleDbError('updateDoc', err);
          throw err;
        }
        return this;
      }
    },
    async delete() {
      try {
        await restDeleteDoc(dRef.path);
      } catch (restErr) {
        try {
          await Promise.race([
            deleteDoc(dRef),
            new Promise((_, rej) => setTimeout(() => rej(new Error('Firestore delete timed out')), 4000))
          ]);
        } catch (err) {
          handleDbError('deleteDoc', err);
          throw err;
        }
      }
    },
    collection(subName: string) {
      const fdb = getClientFirestore();
      return wrapCollection(collection(fdb, `${dRef.path}/${subName}`));
    }
  };
}

export function wrapQuery(q: ClientQuery, colPath?: string): any {
  return {
    _q: q,
    _path: colPath,
    where(fieldPath: string, opStr: any, value: any) {
      return wrapQuery(query(this._q, where(fieldPath, opStr, value)), this._path);
    },
    orderBy(fieldPath: string, directionStr: 'asc' | 'desc' = 'asc') {
      return wrapQuery(query(this._q, orderBy(fieldPath, directionStr)), this._path);
    },
    limit(limitNum: number) {
      return wrapQuery(query(this._q, limit(limitNum)), this._path);
    },
    async get() {
      try {
        const snap = await Promise.race([
          getDocs(this._q),
          new Promise<null>((res) => setTimeout(() => res(null), 8000))
        ]);
        const wrappedDocs = snap && snap.docs ? snap.docs.map(wrapDocSnapshot) : [];
        return {
          empty: snap ? snap.empty : true,
          size: snap ? snap.size : 0,
          docs: wrappedDocs,
          forEach(callback: (doc: any) => void) {
            wrappedDocs.forEach(callback);
          },
          docChanges() {
            return typeof snap?.docChanges === 'function' ? snap.docChanges() : [];
          }
        };
      } catch {
        return {
          empty: true,
          size: 0,
          docs: [],
          forEach() {},
          docChanges() { return []; }
        };
      }
    }
  };
}

export function wrapCollection(colRef: CollectionReference): any {
  const qWrapper = wrapQuery(colRef, colRef.path);
  return {
    ...qWrapper,
    id: colRef.id,
    path: colRef.path,
    doc(id?: string) {
      const dRef = id ? doc(colRef, id) : doc(colRef);
      return wrapDocRef(dRef);
    },
    async add(data: any) {
      const sanitized = sanitizeData(data);
      const dRef = doc(colRef);
      try {
        await Promise.race([
          setDoc(dRef, sanitized),
          new Promise((_, rej) => setTimeout(() => rej(new Error('addDoc timeout')), 4000))
        ]);
      } catch (err) {
        handleDbError('addDoc', err);
      }
      return wrapDocRef(dRef);
    }
  };
}

export const FieldValue = {
  serverTimestamp() {
    return serverTimestamp();
  },
  increment(n: number) {
    return increment(n);
  },
  arrayUnion(...elements: any[]) {
    return arrayUnion(...elements);
  },
  arrayRemove(...elements: any[]) {
    return arrayRemove(...elements);
  },
  delete() {
    return deleteField();
  }
};

export function getDb(): any {
  const fdb = getClientFirestore();
  return {
    _rawDb: fdb,
    collection(name: string) {
      return wrapCollection(collection(fdb, name));
    },
    async runTransaction(updateFunction: (transaction: any) => Promise<any>) {
      return await runTransaction(fdb, async (clientTx) => {
        const txWrapper = {
          async get(ref: any) {
            const clientRef = ref._clientRef || ref;
            const snap = await clientTx.get(clientRef);
            return wrapDocSnapshot(snap);
          },
          set(ref: any, data: any, options?: any) {
            const clientRef = ref._clientRef || ref;
            clientTx.set(clientRef, sanitizeData(data), options || {});
            return txWrapper;
          },
          update(ref: any, data: any) {
            const clientRef = ref._clientRef || ref;
            clientTx.update(clientRef, sanitizeData(data));
            return txWrapper;
          },
          delete(ref: any) {
            const clientRef = ref._clientRef || ref;
            clientTx.delete(clientRef);
            return txWrapper;
          }
        };
        return await updateFunction(txWrapper);
      });
    },
    batch() {
      const clientB = writeBatch(fdb);
      return {
        set(ref: any, data: any, options?: any) {
          const clientRef = ref._clientRef || ref;
          clientB.set(clientRef, sanitizeData(data), options || {});
          return this;
        },
        update(ref: any, data: any) {
          const clientRef = ref._clientRef || ref;
          clientB.update(clientRef, sanitizeData(data));
          return this;
        },
        delete(ref: any) {
          const clientRef = ref._clientRef || ref;
          clientB.delete(clientRef);
          return this;
        },
        async commit() {
          return await clientB.commit();
        }
      };
    }
  };
}
