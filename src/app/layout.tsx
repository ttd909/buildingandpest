import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/ui/ClientProviders";

export const metadata: Metadata = {
  title: "InspectFlow AI — Building & Pest Inspection Reports",
  description: "Fast, AI-powered inspection reporting for building and pest inspectors in Australia.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InspectFlow AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Do not set maximumScale/userScalable — iOS can suppress touch events
  // on elements with active:scale transforms when user-scalable=no is set
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-slate-50">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
