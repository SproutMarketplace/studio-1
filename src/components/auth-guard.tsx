
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
    // const pathIsPublicRoute = PUBLIC_ROUTES.includes(pathname); // Not strictly needed for this bypass

    // For development/editing:
    // If a user is logged in AND on an auth page, redirect to home.
    // Otherwise, allow access. This effectively makes non-auth pages accessible without login.
    if (user && pathIsAuthRoute) {
      router.push("/");
    }
    // If !user and !pathIsAuthRoute, we no longer redirect to /login, allowing access for editing.
    // If !user and pathIsAuthRoute, user can stay on login/signup page.

  }, [user, loading, router, pathname]);

  if (loading && !AUTH_ROUTES.includes(pathname)) { // Show loader on non-auth pages while auth state loads
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
