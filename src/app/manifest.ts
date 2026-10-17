import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SOTRA - Seguimiento de órdenes de trabajo",
    short_name: "SOTRA",
    description: "Órdenes de trabajo, evidencias y consulta técnica de CVM para el trabajo en campo.",
    start_url: "/tecnico",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    background_color: "#ffffff",
    theme_color: "#f4f7fb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
