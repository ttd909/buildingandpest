"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged } from "@/lib/firebase/auth";
import { firebaseApp } from "@/lib/firebase/index";

interface AuthContextValue {
  user: User | null;
  /** true while we are waiting for Firebase to resolve the initial auth state */
  loading: boolean;
  /** false if Firebase is not configured (no env vars) */
  firebaseEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  firebaseEnabled: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseEnabled = !!firebaseApp;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, [firebaseEnabled]);

  return (
    <AuthContext.Provider value={{ user, loading, firebaseEnabled }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
