
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="text-center max-w-2xl w-full flex-grow flex flex-col items-center justify-center">
        <Image src="/logo.png" alt="Sprout Logo" width={350} height={98} className="mx-auto mb-8" priority data-ai-hint="logo sprout" />
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-6">
          Welcome to Sprout!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your new community for buying, selling, and trading plants is blossoming soon.
        </p>
        {/* This page is now a simple welcome. Navigation to login/signup will occur if users try to access protected parts of the app. */}
      </div>
      <footer className="w-full text-center py-4">
        <p className="text-xs text-muted-foreground">
          &copy; {year} Sprout Plant Marketplace. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
