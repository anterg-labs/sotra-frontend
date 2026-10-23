import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  devIndicators: false,
  // Conserva las rutas compiladas al recorrer toda la aplicación en desarrollo.
  onDemandEntries: { maxInactiveAge: 10 * 60 * 1000, pagesBufferLength: 64 },
  poweredByHeader: false,
  experimental: {
    // Las subidas pasan por el proxy (sesión) camino a `/api/v1`: los documentos técnicos admiten hasta 50 MB en la API.
    proxyClientMaxBodySize: "51mb",
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
