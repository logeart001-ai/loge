import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseHost: string | undefined
try {
  if (supabaseUrl) supabaseHost = new URL(supabaseUrl).host
} catch {
  // ignore if env not set or invalid URL
}

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Disable turbo temporarily to fix vendor chunk issues
    // turbo: {
    //   rules: {
    //     '*.svg': {
    //       loaders: ['@svgr/webpack'],
    //       as: '*.js',
    //     },
    //   },
    // },
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimizations
  images: {
    // Optimize remote images from Supabase Storage and allow placeholder services
    remotePatterns: [
      // Supabase images
      ...(supabaseHost
        ? ([{ protocol: 'https' as const, hostname: supabaseHost, pathname: '/storage/v1/object/**' }])
        : []),
      // Placeholder services for development/testing (including SVGs)
      { protocol: 'https' as const, hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'via.placeholder.com', pathname: '/**' },
      { protocol: 'https' as const, hostname: 'picsum.photos', pathname: '/**' },
      // Common image CDNs
      { protocol: 'https' as const, hostname: '*.supabase.co', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Allow SVG optimization
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/video/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Allow SVGs from external sources
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: https://placehold.co https://via.placeholder.com https://picsum.photos https://*.supabase.co;",
          },
        ],
      },
    ];
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
