import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { BrandProvider } from "@/components/BrandProvider";

// Cove Loyalty Platform - Production Release FINAL

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f7f2e4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "xian — Loyalty & Rewards",
  description: "Private digital loyalty pass and rewards for xian Restaurante Oriental",
  applicationName: "xian",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "xian",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={ibmPlexArabic.variable}>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow" />

        {/* Icons shared across all routes */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#f7f2e4" />
        {/* manifest and apple-mobile-web-app-title are set per-route via child layouts */}
      </head>
      <body className={`${ibmPlexArabic.className} min-h-screen bg-[#FAF5F2] text-[#2B0B0D] antialiased selection:bg-[#cb202d] selection:text-[#ffffff]`}>
        <BrandProvider>{children}</BrandProvider>
      </body>
    </html>
  );
}
