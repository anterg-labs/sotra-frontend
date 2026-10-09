import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EstructuraAplicacion } from "@/componentes/estructura-aplicacion";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOTRA",
  description: "Gestión de usuarios, clientes, activos y documentación técnica de CVM",
};

type PropiedadesLayoutRaiz = {
  children: ReactNode;
};

export default function LayoutRaiz(props: PropiedadesLayoutRaiz) {
  const children = props.children;

  return (
    <html lang="es">
      <body>
        <EstructuraAplicacion>{children}</EstructuraAplicacion>
      </body>
    </html>
  );
}
