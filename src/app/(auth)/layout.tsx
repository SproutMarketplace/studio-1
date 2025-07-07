
import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block relative">
        <Image
          src="https://placehold.co/1200x1800.png"
          alt="A vibrant collection of diverse houseplants"
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint="houseplants diversity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-8 flex flex-col justify-end">
            <h1 className="text-4xl font-bold text-white">Welcome to Sprout</h1>
            <p className="text-lg text-white/90 mt-2">
                Discover, trade, and grow your plant collection with a thriving community.
            </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 bg-background">
        <div className="mx-auto grid w-[350px] gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
