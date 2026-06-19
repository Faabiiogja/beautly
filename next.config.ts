import type { NextConfig } from "next";

// Content-Security-Policy:
// - 'unsafe-inline' em script-src/style-src é necessário porque o App Router
//   injeta scripts/estilos inline para hidratação sem nonce (configuração
//   estática de headers não permite nonce por requisição). Para收紧, migrar
//   para nonce gerado em runtime via proxy/headers.
// - font-src cobre Google Fonts (fonts.gstatic.com) e Nunito via jsdelivr
//   (@font-face em globals.css).
// - Sem connect-src externo: a app não faz fetch cross-origin.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Logos são servidas por /api/files/<key> (mesma origem). Como não há
    // otimização necessária para esses PNGs/JPEGs/WebPs, desligamos o loader
    // externo — qualquer <Image src="/api/files/..."> continua funcionando
    // como same-origin (unoptimized).
    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
