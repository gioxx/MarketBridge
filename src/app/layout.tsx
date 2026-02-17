import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarketBridge Demo",
  description: "Simulatore caricamento prodotto in stile Vinted",
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
