
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AppLayout } from "@/components/app-layout";
import { AuthProvider } from "@/contexts/auth-context"; // Import AuthProvider

export const metadata: Metadata = {
  title: "Sprout - Plant Marketplace",
  description: "Buy, sell, and trade plants with Sprout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <AuthProvider> {/* Wrap AppLayout with AuthProvider */}
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
