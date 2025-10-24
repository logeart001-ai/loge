import {withSentryConfig} from '@sentry/nextjs';
import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseHost: string | undefined
try {
  if (supabaseUrl) supabaseHost = new URL(supabaseUrl).host
} catch {
  // ignore if env not set or invalid URL
}

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-tabs', '@radix-ui/react-dialog'],
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
  
  // Optimize webpack for OneDrive/network drives
  webpack: (config, { dev }) => {
    if (dev) {
      // Optimize file watching for OneDrive
      config.watchOptions = {
        poll: 2000, // Increased from 1000 for better OneDrive compatibility
        aggregateTimeout: 500, // Increased debounce time
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/public/video/**', // Ignore large video files
        ],
      }
      
      // Reduce bundle size in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    
    // Optimize module resolution
    config.resolve = {
      ...config.resolve,
      symlinks: false, // Speeds up module resolution
    }
    
    return config
  },
};
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "logeart",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true
});