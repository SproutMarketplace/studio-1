
"use client";

import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 flex flex-col">
      <div className="hidden bg-muted lg:block relative">
        <Image
            src="/plant-images/landing.jpeg"
            alt="A beautiful arrangement of plants for the landing page"
            fill
            className="object-cover"
            priority
            data-ai-hint="houseplants arrangement"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
            <p className="text-2xl text-white font-semibold text-center drop-shadow-md max-w-md">
                Effortlessly Buy, Sell, & Trade plants, fungi, and supplies with communities that share your interests.
            </p>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-12 bg-background flex-1 relative">
        <div className="mx-auto grid w-[350px] gap-6">
          {children}
        </div>
        <footer className="absolute bottom-4 text-center text-xs text-muted-foreground">
           &copy; {new Date().getFullYear()} Sprout Marketplace, LLC. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
