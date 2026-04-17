/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // Security & performance headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Allow devtunnel and localhost origins
          { key: 'Access-Control-Allow-Origin', value: '*' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Disable browser MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Performance: tell CDN/proxy to cache static assets
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },

  // Reduce build output noise
  logging: {
    fetches: { fullUrl: false },
  },
}

export default nextConfig
