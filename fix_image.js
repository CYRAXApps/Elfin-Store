import { initializeApp } from 'firebase/admin/app';
import { getFirestore } from 'firebase/admin/firestore';
const app = initializeApp();
const db = getFirestore();
// Need to use admin sdk? I don't have credentials easily in this bash shell.
