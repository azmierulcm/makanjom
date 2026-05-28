import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://makanjom.com';

export const metadata: Metadata = {
  title: {
    default: "Makanjom — Malaysia's Ultimate Dining Guide",
    template: "%s | Makanjom",
  },
  description: "Discover restaurants, spin for recommendations, earn rewards, and follow Local Expert creators across Malaysia.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: 'Makanjom',
    type: 'website',
    locale: 'en_MY',
    url: BASE_URL,
    title: "Makanjom — Malaysia's Ultimate Dining Guide",
    description: "Discover restaurants, spin for recommendations, earn rewards, and follow Local Expert creators across Malaysia.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Makanjom — Malaysia\'s Ultimate Dining Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@makanjom',
    title: "Makanjom — Malaysia's Ultimate Dining Guide",
    description: "Discover restaurants, spin for recommendations, earn rewards, and follow Local Expert creators across Malaysia.",
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Makanjom",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf9f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pt-safe`}
      >
        {children}
      </body>
    </html>
  );
}
