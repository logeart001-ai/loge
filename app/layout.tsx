import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "L'oge Arts",
  description: "Celebrating contemporary African artistry across mediums.",
  icons: {
    icon: [
      { url: "/image/logelogo.png?v=1", type: "image/png", sizes: "32x32" },
    ],
    shortcut: [
      { url: "/image/logelogo.png?v=1", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/image/logelogo.png?v=1" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
