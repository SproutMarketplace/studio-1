
"use client";

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
    <main className="flex-1">
        {children}
    </main>
    </div>
  );
}
