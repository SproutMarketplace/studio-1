
import type { ReactNode } from "react";
import Image from "next/image"; // Import next/image

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="mb-8">
        <Image src="/logo.png" alt="Sprout Logo" width={200} height={56} priority />
      </div>
      {children}
      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Sprout Plant Marketplace. All rights reserved.
      </p>
    </div>
  );
}
