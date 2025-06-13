
"use client";

import Link from "next/link";
import Image from "next/image"; // Import next/image
import { usePathname, useRouter } from "next/navigation";
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
import { SheetTitle } from "@/components/ui/sheet";
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
  const { open, isMobile, setOpenMobile } = useSidebar();
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

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (loading && !AUTH_ROUTES.includes(pathname) && !isMobile) {
    return (
        <Sidebar>
            <SidebarHeader className={cn("items-center h-[60px]", !open && "justify-center")}>
                 {open ? (
                    <Skeleton className="h-8 w-32" />
                 ) : (
                    <Skeleton className="h-8 w-8 rounded-full" />
                 )}
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {[...Array(mainNavItems.length)].map((_, i) => ( <SidebarMenuSkeleton key={i} showIcon={open} /> ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter className="py-2">
                <SidebarMenu>
                     <SidebarMenuSkeleton showIcon={open} />
                     <SidebarMenuSkeleton showIcon={open} />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
  }


  return (
    <Sidebar>
      <SidebarHeader 
        className={cn(
            "items-center h-[60px]", 
            isMobile ? "mb-4" : (!open && "justify-center px-2") // For mobile, remove px-2, add mb-4. For desktop collapsed, keep px-2 and justify-center
        )}
      >
        {isMobile ? (
          <Link href="/" passHref aria-label="Sprout Home" className="flex items-center">
            <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
          </Link>
        ) : open ? (
          <Link href="/" passHref aria-label="Sprout Home" className="px-2"> {/* Added px-2 here for consistency when open */}
            <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
          </Link>
        ) : (
          <SproutIcon className="text-primary size-8" aria-hidden="true" />
        )}
         {isMobile && <SheetTitle className="sr-only">Sprout Main Menu</SheetTitle>}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href} onClick={closeMobileSidebar}>
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
      
      {(user || !loading) && <SidebarSeparator />}
      
      <SidebarFooter className="py-2">
        <SidebarMenu>
           {user && ( 
            <>
              <SidebarMenuItem onClick={closeMobileSidebar}>
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
           {!user && !loading && ( 
            <SidebarMenuItem onClick={closeMobileSidebar}>
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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/80 backdrop-blur-sm md:hidden">
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <PanelLeft />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SidebarTrigger>
          <div className="flex items-center ml-4">
            <Link href="/" passHref aria-label="Sprout Home">
              <Image src="/logo.png" alt="Sprout Logo" width={90} height={25} priority />
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}

