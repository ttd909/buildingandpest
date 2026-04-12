"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useInspectionStore } from "@/lib/store/useInspectionStore";

function AuthGuardAndSync({ children }: { children: React.ReactNode }) {
  const { user, loading, firebaseEnabled } = useAuth();
  const { setUserId } = useInspectionStore();
  const router = useRouter();
  const pathname = usePathname();

  // Wire auth user into the inspection store for cloud sync
  useEffect(() => {
    setUserId(user?.uid ?? null);
  }, [user, setUserId]);

  // Redirect to login if Firebase is enabled and user is not signed in
  useEffect(() => {
    if (firebaseEnabled && !loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
    // Redirect away from login if already signed in
    if (!loading && user && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [user, loading, firebaseEnabled, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (firebaseEnabled && !user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuardAndSync>{children}</AuthGuardAndSync>
    </AuthProvider>
  );
}
