import "./globals.css";

export const metadata = {
  title: "Haggle — Concierge",
  description: "Voice concierge demo for AI outbound calls."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
