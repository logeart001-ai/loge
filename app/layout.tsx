import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Dancing_Script } from 'next/font/google';
import "./globals.css";
import { CartProvider } from '@/components/cart-provider'
import { WhatsAppChatWidget } from '@/components/whatsapp-chat-widget'
// import { PerformanceMonitor } from '@/components/performance/performance-monitor'
// import { CriticalCSS } from '@/components/performance/critical-css'
// import { ServiceWorkerRegistration } from '@/components/performance/service-worker-registration'

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f97316',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "L'oge Arts",
  description: "Celebrating contemporary African artistry across mediums.",
  manifest: "/manifest.json",
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
  openGraph: {
    title: "L'oge Arts - African Creativity Marketplace",
    description: "Discover authentic art, fashion, and literature from Africa's most talented creators",
    url: "https://logeart.vercel.app",
    siteName: "L'oge Arts",
    images: [
      {
        url: "/image/og-image.png",
        width: 1200,
        height: 630,
        alt: "L'oge Arts - African Creativity Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "L'oge Arts - African Creativity Marketplace",
    description: "Discover authentic art, fashion, and literature from Africa's most talented creators",
    images: ["/image/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${inter.variable} ${dancingScript.variable}`}>
      <head>
        {/* <CriticalCSS /> */}
      </head>
      <body className="antialiased font-body">
        <CartProvider>
          {children}
          <WhatsAppChatWidget />
        </CartProvider>
      </body>
    </html>
  );
}
