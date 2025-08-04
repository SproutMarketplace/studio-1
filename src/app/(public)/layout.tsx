
import type { ReactNode } from 'react';

// This is a minimal layout for public-facing pages like the new landing page.
// It ensures that the main application sidebar and authenticated headers do not appear.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background">
        {children}
        <footer className="py-6 px-6 text-center text-xs text-muted-foreground bg-background border-t">
            &copy; {new Date().getFullYear()} Sprout Marketplace, LLC. All Rights Reserved.
        </footer>
    </div>
  );
}
