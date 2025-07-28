
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { AppLayout } from "@/components/app-layout";
import { CartProvider } from "@/contexts/cart-context";

export const metadata: Metadata = {
  title: "Sprout - Plant, Fungi, and Mycology Marketplace",
  description: "Buy, sell, and trade plants, fungi, and mycology tools with Sprout. Discover your next green or fungal companion.",
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
        <AuthProvider>
          <CartProvider>
            <AppLayout>{children}</AppLayout>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
