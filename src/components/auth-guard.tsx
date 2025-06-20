
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES: string[] = []; // Root "/" is no longer public

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

    if (user) {
      // User is logged in
      if (pathIsAuthRoute) {
        // Logged-in user trying to access login/signup page
        router.push("/catalog");
      } else if (pathname === "/") {
        // Logged-in user at root, redirect to catalog
        router.push("/catalog");
      }
      // If user is logged in and on any other page (e.g. /catalog, /profile), allow access.
    } else {
      // User is not logged in
      if (!pathIsAuthRoute) {
        // Trying to access a protected page (including "/") without being logged in
        router.push("/login"); // Redirect to login
      }
      // If !user and on an auth page, allow access.
    }
  }, [user, loading, router, pathname]);

  // Show loader if auth state is still loading AND user is trying to access a non-auth route.
  if (loading && !AUTH_ROUTES.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prevents flashing content on protected routes if not logged in and not yet redirected.
  if (!user && !loading && !AUTH_ROUTES.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
