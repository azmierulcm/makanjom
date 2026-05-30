import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-inline for its runtime hydration scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Tailwind and Next.js inject inline styles
              "style-src 'self' 'unsafe-inline'",
              // Allow images from Supabase storage and Unsplash
              "img-src 'self' blob: data: https://images.unsplash.com https://*.supabase.co https://*.supabase.in",
              // Allow API calls to Supabase (REST + realtime WebSocket)
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in",
              // Allow external audio files (spinner + game sound effects)
              "media-src 'self' https://assets.mixkit.co",
              "font-src 'self' data:",
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
