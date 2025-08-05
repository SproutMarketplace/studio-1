
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
    LayoutDashboard,
    Package,
    BarChart3,
    Megaphone,
    CircleDollarSign,
    ArrowLeft,
    Tag,
    Gem,
    Loader2
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
}

const sellerNavItems: NavItem[] = [
    { href: "/seller/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/seller/orders", icon: Package, label: "Orders" },
    { href: "/seller/stats", icon: BarChart3, label: "Stats" },
    { href: "/seller/marketing", icon: Megaphone, label: "Marketing" },
    { href: "/seller/pricing-tool", icon: Tag, label: "Pricing Tool" },
    { href: "/seller/finances", icon: CircleDollarSign, label: "Finances" },
];

function SellerSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 bg-background border-r">
            <div className="p-4 border-b flex flex-col items-center text-center gap-4">
                <Link href="/marketplace">
                    <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} />
                </Link>
                <Separator/>
                <p className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">Seller Dashboard</p>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
                {sellerNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                            pathname === item.href
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t">
                 <Button variant="outline" className="w-full" asChild>
                    <Link href="/profile">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Profile
                    </Link>
                </Button>
            </div>
        </aside>
    );
}

function UpgradePrompt() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-center px-4 border-b bg-background/80 backdrop-blur-sm relative">
                <Link href="/marketplace" passHref aria-label="Sprout Home">
                    <Image src="/logo.png" alt="Sprout Logo" width={120} height={34} priority />
                </Link>
                <div className="absolute right-4">
                    <Button asChild>
                        <Link href="/profile">Back to Profile</Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/40">
                <Card className="max-w-md w-full text-center shadow-lg">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 text-primary p-3 rounded-full w-fit mb-3">
                            <Gem className="h-8 w-8" />
                        </div>
                        <CardTitle>Unlock Seller Tools</CardTitle>
                        <CardDescription>
                            Upgrade to a Sprout Pro plan to access the seller dashboard, advanced analytics, marketing tools, and more.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild size="lg">
                            <Link href="/subscription">Upgrade to Pro</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
            <footer className="py-4 px-6 text-center text-xs text-muted-foreground bg-background border-t">
                &copy; {new Date().getFullYear()} Sprout Marketplace, LLC. All Rights Reserved.
            </footer>
        </div>
    );
}

export default function SellerDashboardLayout({ children }: { children: ReactNode }) {
    const { profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen bg-muted/40 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary"/>
            </div>
        )
    }

    const tier = profile?.subscriptionTier;
    const isProOrElite = tier === 'pro' || tier === 'elite';

    if (!isProOrElite) {
        return <UpgradePrompt />;
    }
    
    return (
        <div className="flex h-screen bg-muted/40">
            <SellerSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="container mx-auto px-6 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
