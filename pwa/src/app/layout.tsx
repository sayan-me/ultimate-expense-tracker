import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { InstallPrompt } from "@/components/pwa/install-prompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale: 1 was removed (M8 in the bug report) — it blocked
  // pinch-zoom everywhere just to suppress iOS's auto-zoom-on-focus for
  // inputs under 16px. Inputs are now sized text-base (16px) below md
  // instead (see components/ui/input.tsx), so the zoom isn't triggered
  // in the first place and users keep the ability to pinch-zoom.
  themeColor: "#000000",
}

export const metadata: Metadata = {
  title: "Ultimate Expense Tracker",
  description: "Track your expenses with ease",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ultimate Expense Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: [{ url: "/icons/icon.svg", sizes: "180x180" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
        <InstallPrompt />
      </body>
    </html>
  )
}
