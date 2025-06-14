
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Award,
  Heart,
  MessageCircle,
  PanelLeft,
  PlusSquare,
  ShoppingBag,
  Sparkles,
  Sprout as SproutIcon,
  User as UserIcon,
  LogOut,
  LogIn as LogInIcon,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
// SheetClose is not explicitly needed here if we rely on Sheet's default X for mobile.
// For desktop, we add our own X button.
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { Skeleton } from "@/components/ui/skeleton";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  tooltip: string;
}

const mainNavItems: NavItem[] = [
  { href: "/", icon: ShoppingBag, label: "Plant Catalog", tooltip: "Browse Plants" },
  { href: "/list-plant", icon: PlusSquare, label: "List a Plant", tooltip: "Sell or Trade" },
  { href: "/ai-finder", icon: Sparkles, label: "AI Plant Finder", tooltip: "Find Similar Plants" },
  { href: "/wishlist", icon: Heart, label: "Wishlist", tooltip: "Your Saved Plants" },
  { href: "/messages", icon: MessageCircle, label: "Messages", tooltip: "Your Conversations" },
  { href: "/rewards", icon: Award, label: "Rewards", tooltip: "Your Points & Badges" },
];

function AppSidebar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const { open, isMobile, setOpenMobile, toggleSidebar, setOpen } = useSidebar();
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      if (isMobile) setOpenMobile(false);
      else setOpen(false); // Close sidebar on logout for desktop too
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an issue logging you out. Please try again.",
      });
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleDesktopSidebarClose = () => {
    setOpen(false);
  };
  
  const handleDesktopSidebarToggle = () => {
    setOpen(!open);
  };

  if (loading && !AUTH_ROUTES.includes(pathname) && !isMobile && !open) {
     return (
        <Sidebar>
            <SidebarHeader className={cn("items-center p-2 justify-center")}>
                <SidebarTrigger asChild>
                    <button aria-label="Expand sidebar">
                        <SproutIcon className="text-primary size-8" aria-hidden="true" />
                    </button>
                </SidebarTrigger>
            </SidebarHeader>
            <SidebarSeparator className="mb-2 mx-2"/>
            <SidebarContent>
                <SidebarMenu>
                    {[...Array(mainNavItems.length)].map((_, i) => ( <SidebarMenuSkeleton key={i} showIcon={false} /> ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarSeparator className="mt-auto mx-2" />
            <SidebarFooter className="py-2">
                <SidebarMenu>
                     <SidebarMenuSkeleton showIcon={false} />
                     <SidebarMenuSkeleton showIcon={false} />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
  }
  
  if (loading && !AUTH_ROUTES.includes(pathname) && (isMobile || open)) {
    return (
        <Sidebar>
            <SidebarHeader className={cn(
                "p-2",
                isMobile ? "flex justify-center items-center" : "flex items-center justify-between"
              )}>
                 {(open || isMobile) ? (
                    <Skeleton className="h-8 w-32" />
                 ) : (
                    <Skeleton className="h-8 w-8 rounded-full" />
                 )}
                 {(open || isMobile) && !isMobile && <Skeleton className="h-7 w-7" />}
                 {isMobile && <div className="w-7 h-7" />} {/* Placeholder for mobile X */}
            </SidebarHeader>
            <SidebarSeparator className="mb-2 mx-2"/>
            <SidebarContent>
                <SidebarMenu>
                    {[...Array(mainNavItems.length)].map((_, i) => ( <SidebarMenuSkeleton key={i} showIcon={true} /> ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarSeparator className="mt-auto mx-2" />
            <SidebarFooter className="py-2">
                <SidebarMenu>
                     <SidebarMenuSkeleton showIcon={true} />
                     <SidebarMenuSkeleton showIcon={true} />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
  }


  return (
    <Sidebar>
      {isMobile ? (
        <SidebarHeader className="flex justify-center items-center mb-2">
          {/* Mobile Sheet provides its own X, logo is centered */}
          <Link href="/" passHref aria-label="Sprout Home" onClick={closeMobileSidebar}>
            <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
          </Link>
        </SidebarHeader>
      ) : open ? ( // Desktop Expanded
        <SidebarHeader className="flex items-center justify-between p-2">
          <Link href="/" passHref aria-label="Sprout Home" className="block">
            <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
          </Link>
          <Button variant="ghost" size="icon" onClick={handleDesktopSidebarClose} className="h-7 w-7" aria-label="Close sidebar">
            <X />
          </Button>
        </SidebarHeader>
      ) : ( // Desktop Collapsed
        <SidebarHeader className="flex justify-center items-center p-2">
          <SidebarTrigger asChild>
            <button aria-label="Expand sidebar">
              <SproutIcon className="text-primary size-8" aria-hidden="true" />
            </button>
          </SidebarTrigger>
        </SidebarHeader>
      )}

      <SidebarSeparator className="mb-2 mx-2"/>
      
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href} onClick={isMobile ? closeMobileSidebar : undefined}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.tooltip, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  className={cn( "justify-start", !open && !isMobile && "justify-center" )}
                >
                  <item.icon aria-hidden="true" />
                  {(open || isMobile) && <span>{item.label}</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      {(!loading || user || isMobile || open ) && <SidebarSeparator className="mt-auto mx-2" />}
      
      <SidebarFooter className="py-2">
        <SidebarMenu>
           {user && !loading && ( 
            <>
              <SidebarMenuItem onClick={isMobile ? closeMobileSidebar : undefined}>
                <Link href="/profile" passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === "/profile"}
                    tooltip={{ children: "Manage Your Profile", className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                    className={cn("justify-start", !open && !isMobile && "justify-center")}
                  >
                    <UserIcon aria-hidden="true" />
                    {(open || isMobile) && <span>Profile</span>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip={{ children: "Sign Out", className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                    className={cn(
                      "justify-start text-destructive hover:bg-destructive/10 hover:text-destructive",
                      !open && !isMobile && "justify-center"
                    )}
                  >
                    <LogOut aria-hidden="true" />
                    {(open || isMobile) && <span>Logout</span>}
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </>
           )}
           {(!user && !loading) && (
            <SidebarMenuItem onClick={isMobile ? closeMobileSidebar : undefined}>
              <Link href="/login" passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === "/login"}
                  tooltip={{ children: "Sign In", className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  className={cn("justify-start", !open && !isMobile && "justify-center")}
                >
                  <LogInIcon aria-hidden="true" />
                  {(open || isMobile) && <span>Sign In</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
           )}
           {(loading && (isMobile || open) && !AUTH_ROUTES.includes(pathname)) && (
            <>
              <SidebarMenuSkeleton showIcon={open || isMobile} />
              <SidebarMenuSkeleton showIcon={open || isMobile} />
            </>
           )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute) {
    return (
      <>
        <AuthGuard>{children}</AuthGuard>
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}> {/* Default open for desktop */}
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* Persistent Top Header for all views (mobile and desktop) */}
        <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/80 backdrop-blur-sm">
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Toggle Menu">
              <PanelLeft />
            </Button>
          </SidebarTrigger>
          <Link href="/" passHref aria-label="Sprout Home" className="ml-4">
            <Image src="/logo.png" alt="Sprout Logo" width={90} height={25} priority />
          </Link>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
    
