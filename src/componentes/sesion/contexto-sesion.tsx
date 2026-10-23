"use client";

import { createContext, useContext, type ReactNode } from "react";
import { tienePermiso, type Permiso } from "@/seguridad/permisos";
import type { UsuarioEnSesion } from "@/tipos/sesion";

const ContextoSesion = createContext<UsuarioEnSesion | null>(null);

/** El layout raíz lo carga en el servidor (`/api/v1/sesion`) y lo comparte con los componentes de cliente. */
export function ProveedorSesion(props: { usuario: UsuarioEnSesion | null; children: ReactNode }) {
  return <ContextoSesion.Provider value={props.usuario}>{props.children}</ContextoSesion.Provider>;
}

export function useUsuarioEnSesion() {
  return useContext(ContextoSesion);
}

/** Sin sesión, ningún permiso. Solo decide qué se muestra: la API vuelve a controlar cada pedido. */
export function useTienePermiso(permiso: Permiso) {
  const usuario = useUsuarioEnSesion();
  return usuario !== null && tienePermiso(usuario.roles, permiso);
}

/** Muestra `children` solo si el usuario tiene el permiso; si no, `alternativa` (nada por defecto). */
export function SiTienePermiso(props: { permiso: Permiso; children: ReactNode; alternativa?: ReactNode }) {
  return useTienePermiso(props.permiso) ? props.children : (props.alternativa ?? null);
}
