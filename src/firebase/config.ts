import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCEWGS5scl4vEgju5Z5KV8BPVSYOP_MKIY",
  authDomain: "deep-bug.firebaseapp.com",
  databaseURL: "https://deep-bug-default-rtdb.firebaseio.com",
  projectId: "deep-bug",
  storageBucket: "deep-bug.firebasestorage.app",
  messagingSenderId: "754168432797",
  appId: "1:754168432797:web:1cc39a2fe4c0ea7199ac74",
  measurementId: "G-ZYLWBJ4B3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
