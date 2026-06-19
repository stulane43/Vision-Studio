/** @type {import('next').NextConfig} */

// SECURITY-04: HTTP security headers on all responses.
// Note (documented justification): 'unsafe-inline' (styles/scripts) and dev-only
// 'unsafe-eval' are required by the Next.js framework's hydration/HMR. Accepted,
// documented exception. When hardening further, migrate to nonce-based CSP.
const isDev = process.env.NODE_ENV !== 'production';
// Enable HTTPS-only protections (HSTS) only when actually served over HTTPS —
// otherwise HSTS would force-upgrade plain-HTTP LAN access and break it.
const httpsEnabled = process.env.AIDLC_HTTPS === 'true';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
if (httpsEnabled) {
  securityHeaders.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
}

const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained server bundle (.next/standalone) for a small Docker image.
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
