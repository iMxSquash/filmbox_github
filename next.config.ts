import type { NextConfig } from 'next'

// En-têtes statiques, sur toutes les routes. La CSP (avec nonce) est posée par proxy.ts.
const enTetesSecurite = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [{ source: '/:path*', headers: enTetesSecurite }]
  },
}

export default config
