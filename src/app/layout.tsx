import "./globals.css";
import type { Metadata, Viewport } from "next";
import { EB_Garamond, Inter } from "next/font/google";

const display = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap"
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Haggle — your negotiation concierge",
  description:
    "Tell Haggle what you're shopping for. It calls around, pushes on price, and brings back the deal."
};

export const viewport: Viewport = {
  themeColor: "#f4f2ec"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
