import type { Metadata, Viewport } from "next";
import TopHeader from "@/components/ui/TopHeader";
import WelcomeModal from "@/components/ui/WelcomeModal";
import Footer from "@/components/ui/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0e0e0e",
};

export const metadata: Metadata = {
  title: "VangaTypePanalam — Learn Typing in English, Tamil & Tanglish",
  description:
    "A free, adaptive typing practice app that works offline. Learn touch typing from scratch with progressive lessons, per-key tracking, and real-time feedback. Supports English, Tamil (Tamil99), and Tanglish.",
  keywords: [
    "typing practice",
    "learn typing",
    "touch typing",
    "Tamil typing",
    "Tanglish typing",
    "keyboard practice",
    "WPM test",
    "typing tutor",
    "free typing app",
  ],
  authors: [{ name: "VangaTypePanalam" }],
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="google-adsense-account" content="ca-pub-7627314206553844" />
      </head>
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7627314206553844"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <AuthProvider>
          <div id="app-root">
            <TopHeader />
            <WelcomeModal />
            <div className="main-content">
              {children}
            </div>
            <Footer />
          </div>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
