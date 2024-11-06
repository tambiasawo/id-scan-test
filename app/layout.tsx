import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ID Verification | Rented123",
  description: "Scan your ID and verify yourself ",
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
