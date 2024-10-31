import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Self Verification | Rented123",
  description: "Scan your ID and verify photo ",
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
