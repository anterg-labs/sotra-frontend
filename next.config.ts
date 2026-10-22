import type { NextConfig } from "next";

// El navegador ya no llama a la API (pasa por `/api/v1` del mismo origen); sí navega a Keycloak al iniciar y cerrar sesión.
const origenKeycloak = process.env.KEYCLOAK_EMISOR ? new URL(process.env.KEYCLOAK_EMISOR).origin : null;
const politicaContenido = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `form-action 'self'${origenKeycloak ? ` ${origenKeycloak}` : ""}`,
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
].join("; ");

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
