
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES: string[] = []; // Root "/" is no longer public here, handled by src/app/page.tsx

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
    const pathIsPublicRoute = PUBLIC_ROUTES.includes(pathname); // Will always be false now

    if (user) {
      // User is logged in
      if (pathIsAuthRoute) {
        // Logged-in user trying to access login/signup page
        router.push("/catalog"); // Redirect to main app content
      }
      // If user is logged in and on a public route (none defined here) or any other non-auth route, allow access.
    } else {
      // User is not logged in
      if (!pathIsAuthRoute && !pathIsPublicRoute) {
        // Trying to access a protected page (not auth, not public) without being logged in
        // This AuthGuard is within (main) layout, so / is handled by src/app/page.tsx
        router.push("/login"); // Redirect to login
      }
      // If !user and on an auth page, allow access.
    }
  }, [user, loading, router, pathname]);

  // Show loader if auth state is still loading AND user is trying to access a non-auth, non-public route.
  if (loading && !AUTH_ROUTES.includes(pathname) && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prevents flashing content on protected routes if not logged in and not yet redirected.
  if (!user && !loading && !AUTH_ROUTES.includes(pathname) && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
