import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import { ConvexProvider } from "convex/react";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DonorConnect-Connecting Hearts, Changing Lives.",
  description: "DonorConnect is a secure platform uniting NGOs, hospitals & donors for money, item & organ donations with transparency and real impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <ConvexClientProvider>
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Header />
          <main>
            {children}
            <Toaster 
          position="top-center" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              background: 'white',
            },
          }}
        />
          </main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  </ConvexClientProvider>
    
  );
}