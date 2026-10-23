import type { RolSotra } from "@/seguridad/permisos";

/** Usuario de la sesión, como lo devuelve `GET /api/v1/sesion`. */
export type UsuarioEnSesion = {
  idKeycloak: string;
  /** Id en SOTRA (`/api/v1/usuarios/{id}`); `null` si existe en Keycloak pero no en SOTRA. */
  idUsuario: number | null;
  correo: string;
  /** Nombre y apellido juntos. */
  nombre: string;
  /** Solo roles de SOTRA. */
  roles: RolSotra[];
};

export type EstadoSesion =
  | { estado: "sin-sesion" }
  | { estado: "error" }
  | { estado: "sin-acceso"; usuario: UsuarioEnSesion }
  | { estado: "con-acceso"; usuario: UsuarioEnSesion };
