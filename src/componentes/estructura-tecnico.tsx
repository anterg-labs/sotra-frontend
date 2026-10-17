"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoActivos, IconoOrdenesTrabajo, IconoRepuestos } from "@/componentes/iconos";
import { BotonTerminos } from "@/componentes/terminos/modal-terminos";
import { IndicadorNavegacion } from "@/componentes/indicador-navegacion";

const enlaces = [
  { ruta: "/tecnico", etiqueta: "Mi trabajo", icono: <IconoOrdenesTrabajo />, esActivo: (ruta: string) => ruta === "/tecnico" || ruta.startsWith("/tecnico/") },
  { ruta: "/activos", etiqueta: "Activos", icono: <IconoActivos />, esActivo: (ruta: string) => ruta.startsWith("/activos") },
  { ruta: "/repuestos", etiqueta: "Repuestos", icono: <IconoRepuestos />, esActivo: (ruta: string) => ruta.startsWith("/repuestos") },
];

/** Estructura pensada para el celular: cabecera compacta y barra inferior con objetivos táctiles de 48 px. */
export function EstructuraTecnico({ children }: { children: React.ReactNode }) {
  const rutaActual = usePathname();

  return (
    <div className="tecnico-estructura">
      <header className="tecnico-cabecera">
        <Image alt="CVM" className="h-auto w-16" height={152} priority src="/images/logo-cvm.png" width={717} />
        <span className="tecnico-cabecera-titulo">Mi trabajo</span>
        <Link className="text-link" href="/reportes">
          Escritorio
          <IndicadorNavegacion destino="Escritorio" />
        </Link>
      </header>
      <div className="tecnico-contenido">{children}</div>
      <footer className="app-pie"><BotonTerminos /></footer>
      <nav aria-label="Navegación del técnico" className="tecnico-barra">
        {enlaces.map((enlace) => (
          <Link
            aria-current={enlace.esActivo(rutaActual) ? "page" : undefined}
            className="tecnico-barra-enlace"
            href={enlace.ruta}
            key={enlace.ruta}
          >
            {enlace.icono}
            <span>{enlace.etiqueta}</span>
            <IndicadorNavegacion destino={enlace.etiqueta} />
          </Link>
        ))}
      </nav>
    </div>
  );
}
