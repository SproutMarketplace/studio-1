
import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block relative">
        <Image
          src="/plant-images/landing.jpeg"
          alt="A beautiful arrangement of plants for the landing page"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
            <p className="text-2xl text-white font-semibold text-center drop-shadow-md max-w-md">
                Effortlessly Buy, Sell, &amp; Trade plants with communities that share your interests.
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
