import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDxfE6bwctKi73-yY8s3NbEHFYUZ93gYkc",
  authDomain: "rideshare-e175d.firebaseapp.com",
  projectId: "rideshare-e175d",
  storageBucket: "rideshare-e175d.firebasestorage.app",
  messagingSenderId: "392470096982",
  appId: "1:392470096982:web:25b30e0a65bd868750dff7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Test connection
console.log('Firebase initialized:', {
  app: !!app,
  auth: !!auth,
  db: !!db,
  storage: !!storage
});

export default app;