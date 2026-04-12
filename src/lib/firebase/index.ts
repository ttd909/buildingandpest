import { initializeApp, getApps, FirebaseApp } from "firebase/app";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Firebase is optional — app works offline-only if not configured
export let firebaseApp: FirebaseApp | null = null;

if (apiKey && typeof window !== "undefined") {
  const config = {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  firebaseApp = getApps().length === 0 ? initializeApp(config) : getApps()[0];
}
