const API_URL = process.env.API_URL || 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  output: 'standalone',
  // The browser always talks to /api on this origin. This app's own route handlers answer
  // first (Better Auth at /api/auth, SSLCommerz checkout at /api/checkout); everything else
  // is forwarded to ghotok-server. A `fallback` rewrite runs only when no route matched,
  // dynamic routes such as /api/auth/[...all] included.
  async rewrites() {
    return { fallback: [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }] };
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
