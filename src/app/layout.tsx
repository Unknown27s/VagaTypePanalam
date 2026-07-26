import type { Metadata, Viewport } from "next";
import TopHeader from "@/components/ui/TopHeader";
import WelcomeModal from "@/components/ui/WelcomeModal";
import Footer from "@/components/ui/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/react";
import { auth } from "@/auth";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e0e0e",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://vangatypepanalam.qzz.io"),
  title: {
    default: "VangaTypePanalam — Learn Typing in English, Tamil & Tanglish",
    template: "%s — VangaTypePanalam",
  },
  description:
    "A free, adaptive typing practice app that works offline. Learn touch typing online with Tamil keyboard, English QWERTY, and Tanglish. Includes progressive typing lessons, WPM speed test, per-key tracking, and real-time feedback. The best Tamil typing website for practice and search keyboard.",
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
    "Tamil typing website",
    "Tamil keyboard",
    "Tamil typing online",
    "typing in Tamil",
    "Tamil99 keyboard",
    "English typing practice",
    "typing speed test",
    "online typing tutor",
    "typing lessons free",
    "TNPSC typing test",
    "TNPSC Tamil typing test",
    "Tamil typing test 30 WPM",
    "Tamil typing exam practice",
    "Tamil typing test online",
    "Tamil typing test 2026",
    "Tamil99 typing practice",
    "VAO typing test",
    "TN Police typing test",
    "தமிழ் தட்டச்சு பயிற்சி",
    "தமிழ் தட்டச்சு வேக சோதனை",
    "learn touch typing online free",
    "typing practice for beginners",
    "how to type faster",
    "adaptive typing practice",
    "offline typing practice",
    "typing practice with heatmap",
    "WPM typing test free",
    "check typing speed",
    "typing speed checker",
  ],
  authors: [{ name: "VangaTypePanalam" }],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vangatypepanalam.qzz.io",
    siteName: "VangaTypePanalam",
    title: "VangaTypePanalam — Learn Typing in English, Tamil & Tanglish",
    description:
      "A free, adaptive typing practice app that works offline. Learn touch typing online with Tamil keyboard, English QWERTY, and Tanglish. Includes progressive typing lessons, WPM speed test, per-key tracking, and real-time feedback.",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VangaTypePanalam — Learn Typing in English, Tamil & Tanglish",
    description:
      "A free, adaptive typing practice app that works offline. Learn touch typing online with Tamil keyboard, English QWERTY, and Tanglish. Includes progressive typing lessons, WPM speed test, per-key tracking, and real-time feedback.",
    images: ["/twitter-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/logo-theme/vangatypepanalam_logo_exact.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="google-adsense-account" content="ca-pub-7627314206553844" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "VangaTypePanalam",
              url: "https://vangatypepanalam.qzz.io",
              description:
                "A free, adaptive typing practice app that works offline. Learn touch typing online with Tamil keyboard, English QWERTY, and Tanglish. Includes progressive typing lessons, WPM speed test, per-key tracking, and real-time feedback.",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "VangaTypePanalam",
              },
              inLanguage: ["en", "ta"],
              browserRequirements: "Requires JavaScript",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://vangatypepanalam.qzz.io/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7627314206553844"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <AuthProvider session={session}>
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
