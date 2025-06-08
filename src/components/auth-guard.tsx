
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
// Add any other genuinely public routes here. For now, none.
const PUBLIC_ROUTES: string[] = []; 

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Wait for auth state to load
    }

    const pathIsAuthRoute = AUTH_ROUTES.includes(pathname);
    const pathIsPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !pathIsAuthRoute && !pathIsPublicRoute) {
      // Not logged in, not on an auth/public page -> redirect to login
      router.push("/login");
    } else if (user && pathIsAuthRoute) {
      // Logged in and on an auth page -> redirect to home
      router.push("/");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]"> {/* Adjust height if needed */}
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If a redirect is pending, children might render briefly.
  // This is usually acceptable, or more complex handling (like returning null until redirect is confirmed) can be added.
  return <>{children}</>;
}
