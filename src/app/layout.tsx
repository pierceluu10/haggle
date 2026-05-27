import "./globals.css";

export const metadata = {
  title: "Haggle",
  description: "AI-assisted service quote calls and negotiation."
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
