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
  // Enable file watching polling for OneDrive compatibility
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
};

export default nextConfig;
