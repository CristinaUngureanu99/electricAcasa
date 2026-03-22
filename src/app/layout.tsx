import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/ui/CookieConsent";
import AuthCookieGuard from "@/components/ui/AuthCookieGuard";
import { site } from "@/config/site";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: site.nameFull,
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  metadataBase: new URL(site.url),
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: site.name,
    title: site.nameFull,
    description: site.tagline,
    images: [],
  },
  twitter: {
    card: "summary",
    title: site.nameFull,
    description: site.tagline,
    images: [],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: site.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
      </head>
      <body className={`${inter.className} antialiased bg-surface`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold"
        >
          Sari la continut
        </a>
        <AuthCookieGuard />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
