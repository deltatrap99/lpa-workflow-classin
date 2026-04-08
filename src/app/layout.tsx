import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClassIn Video Downloader",
  description: "Download your ClassIn recorded videos easily",
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
