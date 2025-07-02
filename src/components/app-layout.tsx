
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
    Award,
    Heart,
    MessageCircle,
    MessagesSquare,
    PanelLeft,
    PlusSquare,
    ShoppingBag,
    Sprout as SproutIcon,
    User as UserIcon,
    LogOut,
    LogIn as LogInIcon,
    X,
    ShoppingCart,
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
    SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { logoutUser } from "@/lib/firestoreService";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { useCart } from "@/contexts/cart-context";
import { CartSheet } from "@/components/cart-sheet";

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
}

const mainNavItems: NavItem[] = [
    { href: "/catalog", icon: ShoppingBag, label: "Plant Catalog" },
    { href: "/list-plant", icon: PlusSquare, label: "List a Plant" },
    { href: "/forums", icon: MessagesSquare, label: "Community Forums" },
    { href: "/wishlist", icon: Heart, label: "Wishlist" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/rewards", icon: Award, label: "Rewards" },
];

function AppSidebar() {
    const pathname = usePathname();
    const { toast } = useToast();
    const { setOpen, isMobile, setOpenMobile } = useSidebar();
    const { user, profile, loading, refreshUserProfile } = useAuth();

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
                            {item.href === "/messages" && profile && profile.unreadMessageCount > 0 && (
                                <SidebarMenuBadge>
                                    {profile.unreadMessageCount > 9 ? '9+' : profile.unreadMessageCount}
                                </SidebarMenuBadge>
                            )}
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

    return (
        <header className="sticky top-0 z-10 flex h-14 items-center justify-center px-4 border-b bg-background/80 backdrop-blur-sm relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <div className="relative">
                    <SidebarTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Toggle Menu" className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                            <PanelLeft />
                        </Button>
                    </SidebarTrigger>
                     {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground ring-2 ring-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </div>
            <Link href="/catalog" passHref aria-label="Sprout Home">
                <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
            </Link>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
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
    const isRootRoute = pathname === "/";
    const isSellerRoute = pathname.startsWith('/seller');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { profile } = useAuth();


    // The root page has its own full-screen layout (for redirection)
    if (isRootRoute) {
      return (
        <>
            {children}
            <Toaster />
        </>
      )
    }

    // Auth pages have a simpler layout
    if (isAuthRoute) {
        return (
            <>
                <AuthGuard>{children}</AuthGuard>
                <Toaster />
            </>
        );
    }

    // Seller dashboard has its own layout defined in (seller)/layout.tsx
    if (isSellerRoute) {
        return (
            <>
                <AuthGuard>{children}</AuthGuard>
                <Toaster />
            </>
        )
    }

    // Main application pages get the full sidebar layout
    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <SidebarInset className="flex flex-col min-h-screen">
                <PersistentHeader 
                    onCartClick={() => setIsCartOpen(true)} 
                    unreadCount={profile?.unreadMessageCount || 0}
                />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <AuthGuard>{children}</AuthGuard>
                </main>
            </SidebarInset>
            <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
            <Toaster />
        </SidebarProvider>
    );
}
