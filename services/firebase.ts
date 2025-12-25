
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Updated with provided Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCxFNyiCuT2dBSuDsB5fCIalwYXsIRFP2k",
  authDomain: "expense-tracker-0320.firebaseapp.com",
  projectId: "expense-tracker-0320",
  storageBucket: "expense-tracker-0320.firebasestorage.app",
  messagingSenderId: "244367064728",
  appId: "1:244367064728:web:a4a0a6c6c4caafaaf8daed",
  measurementId: "G-2DZNYJ6719"
};

// Initialize Firebase only once to avoid "Component already registered" or "App already exists" errors
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Explicitly pass the app instance to ensure services are registered correctly
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
