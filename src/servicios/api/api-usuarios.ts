import { leerDatosApi, leerPagina, leerTodasLasPaginas } from "@/servicios/api/solicitudes-http";
import type { Pagina } from "@/tipos/pagina";
import type { FiltrosUsuarios, Rol, Usuario } from "@/tipos/usuario";

export async function apiListarUsuarios() {
  const usuarios = await leerTodasLasPaginas("/api/v1/usuarios", "No se pudo obtener el listado de usuarios.");
  return usuarios as Usuario[];
}

export async function apiListarUsuariosPaginados(filtros: FiltrosUsuarios) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.rolId !== "") {
    parametros.append("rolId", filtros.rolId);
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  parametros.append("direccionOrden", "desc");
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/usuarios", parametros, "No se pudo obtener el listado de usuarios.");
  return pagina as Pagina<Usuario>;
}

export async function apiListarRoles() {
  const roles = await leerDatosApi("/api/v1/roles", { cache: "no-store" }, "No se pudo obtener el listado de roles.");
  return roles as Rol[];
}

export async function apiObtenerUsuario(usuarioId: number) {
  const usuario = await leerDatosApi("/api/v1/usuarios/" + usuarioId, { cache: "no-store" }, "No se pudo obtener el usuario solicitado.");
  return usuario as Usuario;
}
