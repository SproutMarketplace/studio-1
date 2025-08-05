
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES: string[] = ["/"]; // Landing page
const ALLOWED_FOR_LOGGED_IN = ["/subscription"]; // Routes logged-in users can access even if they are "public-like"


interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until auth state and profile are fully resolved
    if (loading) {
      return; 
    }

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isAllowedForLoggedIn = ALLOWED_FOR_LOGGED_IN.includes(pathname);

    // If a user is logged in (and we have their profile)
    if (user && profile) {
      // If they are on an auth route (login/signup) or the public landing page,
      // redirect them to the main app page (marketplace), unless it's an explicitly allowed page.
      if ((isAuthRoute || isPublicRoute) && !isAllowedForLoggedIn) {
        router.replace("/marketplace");
        return;
      }
    }
    // If a user is NOT logged in:
    else {
      // If they try to access any page that is NOT public, an auth route, or an allowed route,
      // send them to the landing page to log in or sign up.
      if (!isPublicRoute && !isAuthRoute && !isAllowedForLoggedIn) {
        router.replace("/");
        return;
      }
    }
  }, [user, profile, loading, router, pathname]);
  
  // --- Loading State and Content Flash Prevention ---

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flash of protected pages for logged-out users
  if (!user && !AUTH_ROUTES.includes(pathname) && !PUBLIC_ROUTES.includes(pathname) && !ALLOWED_FOR_LOGGED_IN.includes(pathname)) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Prevent flash of auth/public pages for logged-in users who haven't been redirected yet
  if (user && (AUTH_ROUTES.includes(pathname) || (PUBLIC_ROUTES.includes(pathname) && !ALLOWED_FOR_LOGGED_IN.includes(pathname)))) {
      return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
