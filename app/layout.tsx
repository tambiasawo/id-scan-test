import type { Metadata } from "next";
import "./globals.css";
import Header from "./_components/Header/Header";

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
      <body>
        {" "}
        <Header />
        {children}
      </body>
    </html>
  );
}
