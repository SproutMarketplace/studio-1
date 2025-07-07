
import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://placehold.co/1200x1800.png"
          alt="Abstract image of blue mountains"
          width={1200}
          height={1800}
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint="mountains abstract"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
