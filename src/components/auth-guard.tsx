
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES: string[] = ["/"]; // Landing page is public

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; 
    }

    const pathIsAuthRoute = AUTH_ROUTES.includes(pathname);
    const pathIsPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (user) {
      // User is logged in
      if (pathIsAuthRoute) {
        // Logged-in user trying to access login/signup page
        router.push("/catalog"); // Redirect to main app catalog
      }
      // If user is logged in and on any other page (public or main app), allow access.
    } else {
      // User is not logged in
      if (!pathIsAuthRoute && !pathIsPublicRoute) {
        // Trying to access a protected main app page without being logged in
        router.push("/login"); // Redirect to login
      }
      // If !user and on an auth page, or on a public page, allow access.
    }
  }, [user, loading, router, pathname]);

  // Show loader for main app routes or auth routes if auth state is still loading
  if (loading && (!PUBLIC_ROUTES.includes(pathname))) { 
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is not logged in and trying to access a non-public, non-auth page,
  // AuthGuard will redirect, but we might briefly render children before redirect.
  // This check prevents flashing content on protected routes if not logged in.
  if (!user && !loading && !AUTH_ROUTES.includes(pathname) && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return <>{children}</>;
}
