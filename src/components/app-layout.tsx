
"use client";

import Link from "next/link";
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
  LogIn as LogInIcon, // Added LogIn icon
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
  SidebarMenuSkeleton, // For loading state
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase"; // Import auth
import { signOut } from "firebase/auth"; // Import signOut
import { useAuth } from "@/contexts/auth-context"; // Import useAuth
import { AuthGuard } from "@/components/auth-guard"; // Import AuthGuard
import { Skeleton } from "@/components/ui/skeleton";


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
  // const router = useRouter(); // router not directly used in this version of AppSidebar
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
      // AuthGuard will handle redirection
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

  if (loading && !isMobile) { // Show skeleton sidebar on desktop during initial auth load
    return (
        <Sidebar>
            <SidebarHeader className={cn("items-center", !open && "justify-center")}>
                <SproutIcon className={cn("text-primary", open ? "mr-2 size-8" : "size-8")} aria-hidden="true" />
                {open && <h1 className="text-2xl font-semibold text-primary">Sprout</h1>}
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {[...Array(6)].map((_, i) => ( <SidebarMenuSkeleton key={i} showIcon={open} /> ))}
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
      <SidebarHeader className={cn("items-center", !open && "justify-center")}>
        <SproutIcon className={cn("text-primary", open ? "mr-2 size-8" : "size-8")} aria-hidden="true" />
        {open && <h1 className="text-2xl font-semibold text-primary">Sprout</h1>}
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {user && mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href} onClick={closeMobileSidebar}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.tooltip, className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                  className={cn( "justify-start", !open && "justify-center" )}
                >
                  <item.icon aria-hidden="true" />
                  {open && <span>{item.label}</span>}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          {!user && !loading && isMobile && ( // Show simplified message for mobile when logged out
             <SidebarMenuItem>
                <div className="p-2 text-center text-sm text-sidebar-foreground/70">
                    Sign in to see more.
                </div>
             </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      
      {user && <SidebarSeparator />}
      
      <SidebarFooter className="py-2">
        <SidebarMenu>
           {user && (
            <>
              <SidebarMenuItem onClick={closeMobileSidebar}>
                <Link href="/profile" passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === "/profile"}
                    tooltip={{ children: "Manage Your Profile", className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                    className={cn("justify-start", !open && "justify-center")}
                  >
                    <UserIcon aria-hidden="true" />
                    {open && <span>Profile</span>}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton
                    onClick={handleLogout}
                    tooltip={{ children: "Sign Out", className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                    className={cn(
                      "justify-start text-destructive hover:bg-destructive/10 hover:text-destructive",
                      !open && "justify-center"
                    )}
                  >
                    <LogOut aria-hidden="true" />
                    {open && <span>Logout</span>}
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
                  className={cn("justify-start", !open && "justify-center")}
                >
                  <LogInIcon aria-hidden="true" />
                  {open && <span>Sign In</span>}
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
            <SproutIcon className="w-6 h-6 mr-2 text-primary" />
            <h1 className="text-xl font-semibold text-primary">Sprout</h1>
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
