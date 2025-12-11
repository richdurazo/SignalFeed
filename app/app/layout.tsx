import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalErrorHandler } from "./components/GlobalErrorHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://app-production-075c.up.railway.app"),
  title: {
    default: "SignalFeed - AI-Powered Feed Ranking",
    template: "%s | SignalFeed",
  },
  description: "Enter a topic and let AI curate a ranked feed for you using semantic relevance, recency, and popularity. SignalFeed aggregates articles from Hacker News, Reddit, Dev.to, GitHub, Lobsters, and Product Hunt.",
  keywords: [
    "AI feed",
    "content curation",
    "article ranking",
    "semantic search",
    "news aggregation",
    "AI-powered search",
    "content discovery",
    "feed ranking",
    "Hacker News",
    "Reddit",
    "Dev.to",
    "GitHub trending",
    "Lobsters",
    "Product Hunt",
  ],
  authors: [{ name: "SignalFeed Team" }],
  creator: "SignalFeed",
  publisher: "SignalFeed",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "SignalFeed",
    title: "SignalFeed - AI-Powered Feed Ranking",
    description: "Enter a topic and let AI curate a ranked feed for you using semantic relevance, recency, and popularity. Aggregate articles from multiple sources with AI-powered ranking.",
    images: [
      {
        url: "/signalfeed-logo.svg",
        width: 1200,
        height: 630,
        alt: "SignalFeed - AI-Powered Feed Ranking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SignalFeed - AI-Powered Feed Ranking",
    description: "Enter a topic and let AI curate a ranked feed for you using semantic relevance, recency, and popularity.",
    images: ["/signalfeed-logo.svg"],
    creator: "@signalfeed",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
  classification: "Content Aggregation & AI-Powered Search",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "SignalFeed",
    "mobile-web-app-capable": "yes",
    "theme-color": "#1e293b", // slate-800
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalErrorHandler />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
