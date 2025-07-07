
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sprout as SproutIcon } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">

      {/* Left side: Image Panel */}
      <div className="hidden lg:block relative bg-muted">
        <Image
          src="https://placehold.co/1200x1800.png"
          alt="A vibrant collection of houseplants in a well-lit room"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 0vw"
          className="object-cover"
          data-ai-hint="houseplants arrangement"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-8 flex flex-col justify-between text-white">
          <Link href="/" className="flex items-center gap-2 z-10" aria-label="Sprout Home">
            <SproutIcon className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">Sprout</span>
          </Link>
          <div className="text-left z-10">
            <h2 className="text-4xl font-bold tracking-tight">
              Join a Thriving Plant Community.
            </h2>
            <p className="mt-4 text-white/80 max-w-lg">
              Discover, trade, and sell unique plants. Connect with fellow enthusiasts and grow your collection from the ground up.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Form Panel */}
      <main className="bg-background flex flex-col items-center justify-center p-6 sm:p-12 relative">
         <div className="lg:hidden absolute top-8 left-8">
             <Link href="/" className="flex items-center gap-2" aria-label="Sprout Home">
                <SproutIcon className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-primary">Sprout</span>
            </Link>
        </div>
        
        <div className="w-full max-w-sm">
            {children}
        </div>

        <footer className="w-full text-center py-4 mt-auto pt-8">
            <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Sprout Plant Marketplace. All rights reserved.
            </p>
        </footer>
      </main>

    </div>
  );
}
