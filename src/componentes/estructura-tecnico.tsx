"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoActivos, IconoClientes, IconoConfiguracion, IconoDocumentacion, IconoOrdenesTrabajo, IconoRepuestos } from "@/componentes/iconos";
import { BotonTerminos } from "@/componentes/terminos/modal-terminos";
import { IndicadorNavegacion } from "@/componentes/indicador-navegacion";
import { MenuUsuario } from "@/componentes/menu-usuario";
import { useUsuarioEnSesion } from "@/componentes/sesion/contexto-sesion";
import { esSoloTecnico, tienePermiso, type Permiso } from "@/seguridad/permisos";
import { urlCambioDeVista } from "@/seguridad/vista";
import { cerrarSesion } from "@/servicios/servicio-sesion";

const enlaces: { ruta: string; etiqueta: string; permiso: Permiso; icono: React.ReactNode; esActivo: (ruta: string) => boolean }[] = [
  { ruta: "/tecnico", etiqueta: "Mi trabajo", permiso: "ot.registrar_avance", icono: <IconoOrdenesTrabajo />, esActivo: (ruta: string) => ruta === "/tecnico" || ruta.startsWith("/tecnico/") },
  { ruta: "/activos", etiqueta: "Activos", permiso: "activo.consultar", icono: <IconoActivos />, esActivo: (ruta: string) => ruta.startsWith("/activos") },
  { ruta: "/clientes", etiqueta: "Clientes", permiso: "cliente.consultar", icono: <IconoClientes />, esActivo: (ruta: string) => ruta.startsWith("/clientes") },
  { ruta: "/documentacion-tecnica", etiqueta: "Documentos", permiso: "documento.consultar", icono: <IconoDocumentacion />, esActivo: (ruta: string) => ruta.startsWith("/documentacion-tecnica") },
  { ruta: "/repuestos", etiqueta: "Repuestos", permiso: "stock.consultar", icono: <IconoRepuestos />, esActivo: (ruta: string) => ruta.startsWith("/repuestos") },
];

/**
 * Estructura pensada para el celular: cabecera compacta y barra inferior con objetivos táctiles de 48 px.
 * El técnico la usa en todas sus secciones (con «Escritorio» cambia a la vista de escritorio); administrador y jefe,
 * solo en «Mi trabajo», con un enlace al escritorio.
 */
export function EstructuraTecnico({ children }: { children: React.ReactNode }) {
  const rutaActual = usePathname();
  const usuario = useUsuarioEnSesion();
  const roles = usuario?.roles ?? [];
  const tituloSeccion = enlaces.find((enlace) => enlace.esActivo(rutaActual))?.etiqueta ?? "SOTRA";

  return (
    <div className="tecnico-estructura">
      <header className="tecnico-cabecera">
        <Image alt="CVM" className="tecnico-logo h-auto w-16" height={152} priority src="/images/logo-cvm.png" width={717} />
        <span className="tecnico-cabecera-titulo">{tituloSeccion}</span>
        {esSoloTecnico(roles) ? (
          // Cambia la vista guardada (recarga la página completa) y abre la misma pantalla en el escritorio.
          <a className="text-link tecnico-enlace-escritorio" href={urlCambioDeVista("escritorio", rutaActual)}>
            Escritorio
          </a>
        ) : (
          <Link className="text-link tecnico-enlace-escritorio" href="/ordenes-trabajo">
            Escritorio
            <IndicadorNavegacion destino="Escritorio" />
          </Link>
        )}
        <MenuUsuario alCerrarSesion={cerrarSesion} usuario={usuario} />
      </header>
      <main className="tecnico-contenido">{children}</main>
      <footer className="app-pie"><BotonTerminos /></footer>
      <nav aria-label="Navegación del técnico" className="tecnico-barra">
        {enlaces.filter((enlace) => tienePermiso(roles, enlace.permiso)).map((enlace) => (
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
        <Link
          aria-label="Configuración"
          aria-current={rutaActual.startsWith("/configuracion") ? "page" : undefined}
          className="tecnico-barra-enlace"
          href="/configuracion"
        >
          <IconoConfiguracion />
          <span>Ajustes</span>
          <IndicadorNavegacion destino="Configuración" />
        </Link>
      </nav>
    </div>
  );
}
