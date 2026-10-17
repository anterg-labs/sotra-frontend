import {
  apiListarRoles,
  apiListarUsuarios,
  apiListarUsuariosPaginados,
  apiObtenerUsuario,
} from "@/servicios/api/api-usuarios";
import type { FiltrosUsuarios } from "@/tipos/usuario";

/** Lecturas desde el navegador (selectores de otros módulos). El alta, la modificación y la baja viven en las Server Actions de /usuarios. */
export async function listarUsuarios() {
  return apiListarUsuarios();
}

export async function listarUsuariosPaginados(filtros: FiltrosUsuarios) {
  return apiListarUsuariosPaginados(filtros);
}

export async function listarRoles() {
  return apiListarRoles();
}

export async function obtenerDetalleUsuario(usuarioId: number) {
  return apiObtenerUsuario(usuarioId);
}
