
import type { ReactNode } from "react";
import { Sprout as SproutIcon } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="mb-8 flex items-center text-primary">
        <SproutIcon className="w-12 h-12 mr-3" />
        <h1 className="text-5xl font-bold">Sprout</h1>
      </div>
      {children}
      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Sprout Plant Marketplace. All rights reserved.
      </p>
    </div>
  );
}
