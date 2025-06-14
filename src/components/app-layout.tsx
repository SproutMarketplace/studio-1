
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Award,
  Heart,
  MessageCircle, // Kept for actual messages page
  MessagesSquare, // New icon for Forums
  PanelLeft,
  PlusSquare,
  ShoppingBag,
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
  { href: "/forums", icon: MessagesSquare, label: "Forums", tooltip: "Community Discussions" },
  { href: "/wishlist", icon: Heart, label: "Wishlist", tooltip: "Your Saved Plants" },
  { href: "/messages", icon: MessageCircle, label: "Messages", tooltip: "Your Conversations" },
  { href: "/rewards", icon: Award, label: "Rewards", tooltip: "Your Points & Badges" },
];

function AppSidebar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      if (isMobile) setOpenMobile(false);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an issue logging you out. Please try again.",
      });
    }
  };

  const closeMobileSidebarPanel = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  if (loading && !AUTH_ROUTES.includes(pathname) && !isMobile && !open && !openMobile) {
     return (
        <Sidebar>
            <SidebarHeader className={cn("items-center p-2 justify-center")}>
                 <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label="Open sidebar" onClick={() => setOpen(true)}>
                    <SproutIcon className="text-primary size-8" aria-hidden="true" />
                </Button>
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
  
  if (loading && !AUTH_ROUTES.includes(pathname) && (isMobile || open || openMobile )) {
    return (
        <Sidebar>
            <SidebarHeader className={cn(
                "p-2 flex items-center relative w-full", 
                 isMobile ? "justify-center mb-2" : "justify-start" 
              )}>
                 <Skeleton className="h-8 w-32" /> 
                 { (open && !isMobile) && <Skeleton className="h-7 w-7 rounded-md absolute top-2 right-2" /> }
                 { isMobile && <div className="w-7 h-7" /> } 
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

  // Actual Sidebar Content
  return (
    <Sidebar>
      <SidebarHeader className={cn(
        "p-2 flex items-center relative w-full", 
        isMobile ? "justify-center mb-2" : 
        (open ? 
          "justify-start" : 
          "justify-center")  
      )}>
        {isMobile ? (
          <Link href="/" passHref aria-label="Sprout Home" onClick={closeMobileSidebarPanel}>
            <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
          </Link>
        ) : open ? ( 
          <>
            <Link href="/" passHref aria-label="Sprout Home">
              <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setOpen(false)} 
              className="h-7 w-7 absolute top-2 right-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Close sidebar panel"
            >
              <X />
            </Button>
          </>
        ) : ( 
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} className="h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label="Open sidebar panel">
            <SproutIcon className="text-primary size-8" aria-hidden="true" />
          </Button>
        )}
      </SidebarHeader>

      <SidebarSeparator className="mb-2 mx-2"/>
      
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href} onClick={isMobile ? closeMobileSidebarPanel : undefined}>
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
              <SidebarMenuItem onClick={isMobile ? closeMobileSidebarPanel : undefined}>
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
            <SidebarMenuItem onClick={isMobile ? closeMobileSidebarPanel : undefined}>
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function PersistentHeader() {
  const { open, openMobile, isMobile } = useSidebar();
  const shouldShowHeaderElements = !(isMobile ? openMobile : open); 

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-center px-4 border-b bg-background/80 backdrop-blur-sm relative">
      {shouldShowHeaderElements && (
        <>
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <SidebarTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle Menu" className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <PanelLeft />
              </Button>
            </SidebarTrigger>
          </div>
          <Link href="/" passHref aria-label="Sprout Home">
            <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
          </Link>
        </>
      )}
      {!shouldShowHeaderElements && <div className="w-full h-full" />} 
    </header>
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
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <PersistentHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
    

    