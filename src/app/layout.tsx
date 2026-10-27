import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { ProveedorDeAvisos } from "@/componentes/avisos";
import { ProveedorEstadosOrden } from "@/componentes/estados-orden";
import { EstructuraAplicacion } from "@/componentes/estructura-aplicacion";
import { RegistroServiceWorker } from "@/componentes/registro-service-worker";
import { ProveedorSesion } from "@/componentes/sesion/contexto-sesion";
import { PantallaSinAcceso } from "@/componentes/sesion/pantalla-sin-acceso";
import { COOKIE_VISTA, leerModoVista } from "@/seguridad/vista";
import { listarEstadosOrdenTrabajoOVacio } from "@/servicios/servidor/ordenes-trabajo";
import { obtenerEstadoSesion } from "@/servicios/servidor/sesion";
import type { OpcionEstadoOrden } from "@/tipos/orden-trabajo";
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
  /** Ranura `@modal`: altas y modificaciones abiertas como modal sobre la pantalla actual (rutas interceptadas). */
  modal: ReactNode;
};

/**
 * El proxy ya exigió la sesión (salvo en las páginas públicas, como «sin conexión»). Acá se pide el usuario a la API:
 * si no está registrado en SOTRA o no tiene roles, se muestra «sin acceso» en lugar de la aplicación.
 */
export default async function LayoutRaiz(props: PropiedadesLayoutRaiz) {
  await connection();
  const sesion = await obtenerEstadoSesion();
  const modoVista = leerModoVista((await cookies()).get(COOKIE_VISTA)?.value);

  // Si la API no lo entrega (por ejemplo, un rol sin acceso a órdenes), la aplicación sigue y los estados se muestran por su valor.
  const estadosOrden: OpcionEstadoOrden[] = sesion.estado === "con-acceso"
    ? await listarEstadosOrdenTrabajoOVacio()
    : [];

  let contenido: ReactNode;
  if (sesion.estado === "sin-sesion") {
    contenido = props.children;
  } else if (sesion.estado === "con-acceso") {
    contenido = (
      <EstructuraAplicacion modoVista={modoVista}>
        {props.children}
        {props.modal}
      </EstructuraAplicacion>
    );
  } else {
    contenido = <PantallaSinAcceso correo={sesion.estado === "sin-acceso" ? sesion.usuario.correo : undefined} motivo={sesion.estado} />;
  }

  return (
    <html lang="es">
      <body>
        <RegistroServiceWorker />
        <ProveedorSesion usuario={sesion.estado === "con-acceso" ? sesion.usuario : null}>
          <ProveedorEstadosOrden estados={estadosOrden}>
            <ProveedorDeAvisos>{contenido}</ProveedorDeAvisos>
          </ProveedorEstadosOrden>
        </ProveedorSesion>
      </body>
    </html>
  );
}
