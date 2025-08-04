
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
    Award,
    Heart,
    Bell,
    Users,
    PanelLeft,
    PlusSquare,
    ShoppingBag,
    User as UserIcon,
    LogOut,
    LogIn as LogInIcon,
    X,
    ShoppingCart,
    MessagesSquare,
    Gem,
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { logoutUser } from "@/lib/firestoreService";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart-sheet";
import { NotificationPopover } from "@/components/notification-popover";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_ROUTES = ["/"]; // The root page (/) is now the main public landing page

interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
}

const mainNavItems: NavItem[] = [
    { href: "/catalog", icon: ShoppingBag, label: "Catalog" },
    { href: "/list-plant", icon: PlusSquare, label: "List an Item" },
    { href: "/forums", icon: Users, label: "Community Forums" },
    { href: "/messages", icon: MessagesSquare, label: "Messages" },
    { href: "/wishlist", icon: Heart, label: "Wishlist" },
    { href: "/rewards", icon: Award, label: "Rewards" },
];

function PublicHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-muted backdrop-blur supports-[backdrop-filter]:bg-muted/60">
            <div className="container mx-auto flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center">
                    <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
                </Link>
                <nav className="flex items-center gap-2">
                     <Button asChild variant="secondary" className="bg-gradient-to-r from-amber-200 to-yellow-300 text-amber-900 hover:from-amber-300 hover:to-yellow-400 hover:text-amber-900 shadow-sm">
                        <Link href="/subscription">
                            <Gem className="mr-2 h-4 w-4"/>
                            Upgrade to Pro
                        </Link>
                    </Button>
                    <Button asChild variant="ghost">
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}


function AppSidebar() {
    const pathname = usePathname();
    const { toast } = useToast();
    const { setOpen, isMobile, setOpenMobile } = useSidebar();
    const { user, loading, refreshUserProfile } = useAuth();

    const handleLogout = async () => {
        try {
            await logoutUser();
            await refreshUserProfile();
            
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

    return (
        <Sidebar>
            <SidebarHeader className="p-2 flex items-center relative w-full justify-start">
                <Link href="/catalog" passHref aria-label="Sprout Home" onClick={closeMobileSidebarPanel}>
                    <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
                </Link>
                {!isMobile && (
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                        className="h-7 w-7 absolute top-2 right-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        aria-label="Close sidebar panel"
                    >
                        <X />
                    </Button>
                )}
            </SidebarHeader>

            <SidebarSeparator className="mb-2 mx-2"/>

            <SidebarContent>
                <SidebarMenu>
                    {mainNavItems.map((item) => (
                        <SidebarMenuItem key={item.href} onClick={closeMobileSidebarPanel}>
                            <Link href={item.href} passHref legacyBehavior>
                                <SidebarMenuButton
                                    isActive={pathname === item.href}
                                    className="justify-start"
                                >
                                    <item.icon aria-hidden="true" />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarSeparator className="mt-auto mx-2" />

            <SidebarFooter className="py-2">
                <SidebarMenu>
                    {user && !loading && (
                        <>
                            <SidebarMenuItem onClick={closeMobileSidebarPanel}>
                                <Link href="/profile" passHref legacyBehavior>
                                    <SidebarMenuButton
                                        isActive={pathname === "/profile"}
                                        className="justify-start"
                                    >
                                        <UserIcon aria-hidden="true" />
                                        <span>Profile</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={handleLogout}
                                    className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <LogOut aria-hidden="true" />
                                    <span>Logout</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    )}
                    {(!user && !loading) && (
                        <SidebarMenuItem onClick={closeMobileSidebarPanel}>
                            <Link href="/login" passHref legacyBehavior>
                                <SidebarMenuButton
                                    isActive={pathname === "/login"}
                                    className="justify-start"
                                >
                                    <LogInIcon aria-hidden="true" />
                                    <span>Sign In</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

function PersistentHeader({ onCartClick, unreadCount }: { onCartClick: () => void; unreadCount: number }) {
    const { itemCount } = useCart();
    const { open } = useSidebar();

    return (
        <header className="sticky top-0 z-10 flex h-14 items-center justify-center px-4 border-b bg-background/80 backdrop-blur-sm relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <SidebarTrigger asChild>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        aria-label="Toggle Menu" 
                        className={cn("hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", open && "hidden")}
                    >
                        <PanelLeft />
                    </Button>
                </SidebarTrigger>
            </div>
            
            <Link href="/catalog" passHref aria-label="Sprout Home">
                <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
            </Link>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 <Link href="/subscription" passHref>
                    <Button size="sm" className="h-8 bg-gradient-to-r from-amber-200 to-yellow-300 text-amber-900 hover:from-amber-300 hover:to-yellow-400 hover:text-amber-900 shadow">
                        <Gem className="mr-2 h-4 w-4"/>
                        Upgrade to Pro
                    </Button>
                </Link>
                 <NotificationPopover>
                     <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Open notifications"
                        className="relative hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground ring-2 ring-background">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <Bell />
                    </Button>
                </NotificationPopover>
                
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open cart"
                    onClick={onCartClick}
                    className="relative hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {itemCount}
                        </span>
                    )}
                    <ShoppingCart />
                </Button>
            </div>
        </header>
    );
}

export function AppLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { unreadNotificationCount } = useAuth();

    if (isPublicRoute) {
        return (
            <div className="flex flex-col min-h-screen">
                <PublicHeader />
                <main className="flex-1">
                     <AuthGuard>{children}</AuthGuard>
                </main>
                 <Toaster />
            </div>
        );
    }
    
    if (isAuthRoute) {
      return (
        <>
            <AuthGuard>{children}</AuthGuard>
            <Toaster />
        </>
      )
    }

    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset className="flex flex-col min-h-screen">
                <PersistentHeader 
                    onCartClick={() => setIsCartOpen(true)} 
                    unreadCount={unreadNotificationCount || 0}
                />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <AuthGuard>{children}</AuthGuard>
                </main>
                <footer className="py-4 px-6 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} Sprout Marketplace, LLC. All Rights Reserved.
                </footer>
            </SidebarInset>
            <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
            <Toaster />
        </SidebarProvider>
    );
}
