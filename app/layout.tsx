import type { Metadata } from "next";
import { Playfair_Display, Inter, Dancing_Script } from 'next/font/google';
import "./globals.css";

// Configure Google Fonts
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dancing',
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
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable} ${dancingScript.variable}`}>
      <body className="antialiased font-body">
        {children}
      </body>
    </html>
  );
}
