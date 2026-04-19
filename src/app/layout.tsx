import type { Metadata, Viewport } from "next";
import TopHeader from "@/components/ui/TopHeader";
import Footer from "@/components/ui/Footer";
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <div id="app-root">
          <TopHeader />
          <div className="main-content">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
