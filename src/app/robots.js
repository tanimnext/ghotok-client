const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/api/', '/verify', '/reset-password'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
