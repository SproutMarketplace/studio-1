
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES: string[] = ["/"];
const ALLOWED_FOR_LOGGED_IN = ["/subscription"];


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
    const pathIsAllowed = ALLOWED_FOR_LOGGED_IN.includes(pathname);

    // If user is logged in, redirect them away from auth routes or the public landing page.
    // They are allowed to visit pages in ALLOWED_FOR_LOGGED_IN.
    if (user && (pathIsAuthRoute || (pathIsPublicRoute && !pathIsAllowed))) {
      router.replace("/catalog");
      return;
    }
    
    // If user is NOT logged in, and they try to access a protected route, redirect them to the landing page.
    if (!user && !pathIsAuthRoute && !pathIsPublicRoute && !pathIsAllowed) {
      router.replace("/");
      return;
    }

  }, [user, loading, router, pathname]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent flash of content on protected routes for non-logged-in users.
  if (!user && !AUTH_ROUTES.includes(pathname) && !PUBLIC_ROUTES.includes(pathname) && !ALLOWED_FOR_LOGGED_IN.includes(pathname)) {
    return (
       <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Prevent flash of auth/public pages for logged-in users.
  if (user && (AUTH_ROUTES.includes(pathname) || (PUBLIC_ROUTES.includes(pathname) && !ALLOWED_FOR_LOGGED_IN.includes(pathname)))) {
      return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
