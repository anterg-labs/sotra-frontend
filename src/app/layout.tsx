import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ProveedorDeAvisos } from "@/componentes/avisos";
import { EstructuraAplicacion } from "@/componentes/estructura-aplicacion";
import { RegistroServiceWorker } from "@/componentes/registro-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SOTRA", template: "%s | SOTRA" },
  description: "Gestión de usuarios, clientes, activos y documentación técnica de CVM",
  applicationName: "SOTRA",
  openGraph: { title: "SOTRA", description: "Sistema de postventa de CVM", locale: "es_UY", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f4f7fb",
  width: "device-width",
  initialScale: 1,
};

type PropiedadesLayoutRaiz = {
  children: ReactNode;
};

export default function LayoutRaiz(props: PropiedadesLayoutRaiz) {
  const children = props.children;

  return (
    <html lang="es">
      <body>
        <RegistroServiceWorker />
        <ProveedorDeAvisos>
          <EstructuraAplicacion>{children}</EstructuraAplicacion>
        </ProveedorDeAvisos>
      </body>
    </html>
  );
}
