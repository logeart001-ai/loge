import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseHost: string | undefined
try {
  if (supabaseUrl) supabaseHost = new URL(supabaseUrl).host
} catch {
  // ignore if env not set or invalid URL
}

const nextConfig: NextConfig = {
  images: {
    // Optimize remote images from Supabase Storage
    remotePatterns: supabaseHost
      ? ([{ protocol: 'https' as const, hostname: supabaseHost, pathname: '/storage/v1/object/**' }])
      : [],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
