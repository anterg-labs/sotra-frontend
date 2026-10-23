import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { paginaDeInicio } from "@/seguridad/permisos";
import { COOKIE_VISTA, leerModoVista, rutaEnVista } from "@/seguridad/vista";
import { obtenerEstadoSesion } from "@/servicios/servidor/sesion";

/** El inicio depende del rol: tablero de reportes, «Mi trabajo» del técnico, repuestos u órdenes. */
export default async function PaginaInicio() {
  const sesion = await obtenerEstadoSesion();
  if (sesion.estado !== "con-acceso") return null;
  // El técnico que eligió la vista de escritorio empieza en el listado de órdenes en lugar de «Mi trabajo».
  const modoVista = leerModoVista((await cookies()).get(COOKIE_VISTA)?.value);
  redirect(rutaEnVista(modoVista, paginaDeInicio(sesion.usuario.roles)));
}
