import type { NextConfig } from "next";

const origenApi = process.env.API_URL ? new URL(process.env.API_URL).origin : null;
const politicaContenido = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${origenApi ? ` ${origenApi}` : ""}`,
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  devIndicators: false,
  // Conserva las rutas compiladas al recorrer toda la aplicación en desarrollo.
  onDemandEntries: { maxInactiveAge: 10 * 60 * 1000, pagesBufferLength: 64 },
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/", destination: "/reportes", permanent: false }];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy-Report-Only", value: politicaContenido },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  env: {
    API_URL: process.env.API_URL,
  },
};

export default nextConfig;
