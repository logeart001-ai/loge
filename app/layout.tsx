import type { Metadata } from "next";
import "./globals.css";

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
  <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
