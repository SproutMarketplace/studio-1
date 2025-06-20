
"use client";

import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <main className="text-center space-y-8 max-w-2xl">
        <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Sprout Logo" width={320} height={89} priority data-ai-hint="logo plant" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Welcome to <span className="text-primary">Sprout</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto">
          The best place to discover, trade, and sell plants. Join our growing community of plant enthusiasts!
        </p>
        <p className="text-md text-muted-foreground max-w-xl mx-auto pt-4">
          Our platform is currently under development. Please check back soon!
        </p>

      </main>

      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Sprout Plant Marketplace. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
