import type { RolSotra } from "@/seguridad/permisos";
import type { UsuarioEnSesion } from "@/tipos/sesion";

/** Token que devuelve `obtenerTokenAcceso` en las pruebas (ver `vitest.setup.ts`). */
export const TOKEN_DE_PRUEBAS = "token-de-pruebas";

/** Usuario en sesión de las pruebas; por defecto, administrador (ve todo). */
export function usuarioDePruebas(roles: RolSotra[] = ["administrador"], cambios: Partial<UsuarioEnSesion> = {}): UsuarioEnSesion {
  return {
    idKeycloak: "00000000-0000-0000-0000-000000000001",
    idUsuario: 1,
    correo: "admin.prueba@sotra.test",
    nombre: "Ana Pérez",
    roles,
    ...cambios,
  };
}
