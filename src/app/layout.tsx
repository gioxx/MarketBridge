import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketBridge | Prepara Annunci per Vinted e Wallapop",
  description:
    "MarketBridge ti aiuta a preparare annunci una volta sola: upload immagini, salvataggio locale e copia rapida dei contenuti verso Vinted o Wallapop.",
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
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
