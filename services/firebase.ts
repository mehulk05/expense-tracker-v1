
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxFNyiCuT2dBSuDsB5fCIalwYXsIRFP2k",
  authDomain: "expense-tracker-0320.firebaseapp.com",
  projectId: "expense-tracker-0320",
  storageBucket: "expense-tracker-0320.firebasestorage.app",
  messagingSenderId: "244367064728",
  appId: "1:244367064728:web:a4a0a6c6c4caafaaf8daed",
  measurementId: "G-2DZNYJ6719"
};

// Singleton initialization pattern
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get service instances
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
