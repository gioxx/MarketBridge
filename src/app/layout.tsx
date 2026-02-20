import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketBridge | Prepare Listings for Vinted and Wallapop",
  description:
    "MarketBridge helps you prepare listings once: upload images, save drafts locally, and quickly copy content to Vinted or Wallapop.",
  applicationName: "MarketBridge",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/marketbridge-logo.svg",
    shortcut: "/marketbridge-logo.svg",
    apple: "/marketbridge-logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MarketBridge",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
