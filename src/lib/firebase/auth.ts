import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User,
} from "firebase/auth";
import { firebaseApp } from "./index";

export type { User };

export function getFirebaseAuth() {
  if (!firebaseApp) return null;
  return getAuth(firebaseApp);
}

export async function signIn(email: string, password: string) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase not configured");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  return fbSignOut(auth);
}

export function onAuthStateChanged(cb: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  if (!auth) {
    cb(null);
    return () => {};
  }
  return fbOnAuthStateChanged(auth, cb);
}
