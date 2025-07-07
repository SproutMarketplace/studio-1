
import type { ReactNode } from 'react';
import Image from 'next/image';
import { Sprout as SproutIcon } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 bg-card text-card-foreground shadow-2xl rounded-xl overflow-hidden">
          {/* Left side: Image and Text */}
          <div className="hidden lg:flex flex-col justify-between p-8 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
                <SproutIcon className="h-8 w-8" />
                <span className="text-2xl font-bold">Sprout</span>
            </div>
            <div>
              <h2 className="mt-8 text-3xl font-bold tracking-tight">
                Join a Thriving Plant Community.
              </h2>
              <p className="mt-4 text-primary-foreground/80">
                Discover, trade, and sell unique plants. Connect with fellow enthusiasts and grow your collection from the ground up.
              </p>
            </div>
            <div className="relative w-full aspect-square mt-8">
              <Image
                src="https://placehold.co/600x600.png"
                alt="A collection of beautiful houseplants"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
                data-ai-hint="houseplants arrangement"
              />
            </div>
          </div>
          {/* Right side: Form */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-12">
            {children}
          </div>
        </div>
        <footer className="w-full text-center py-4 mt-2">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Sprout Plant Marketplace. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
