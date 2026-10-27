import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type { Permiso } from "@/seguridad/permisos";
vi.mock("next/server", async (importarReal) => ({ ...(await importarReal<typeof import("next/server")>()), connection: vi.fn(async () => undefined) }));
// jsdom no implementa <dialog>.showModal/close; las pruebas de modales dependen de esto.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
}

// Sesión en las pruebas: sin `ProveedorSesion`, los componentes ven a un administrador (todos los permisos) y el servidor
// usa un token fijo. Las pruebas de sesión y de roles anulan estos mocks con `vi.unmock(...)` y usan lo real.
vi.mock("@/componentes/sesion/contexto-sesion", async (importarReal) => {
  const real = await importarReal<typeof import("@/componentes/sesion/contexto-sesion")>();
  const { tienePermiso } = await import("@/seguridad/permisos");
  const { usuarioDePruebas } = await import("@/pruebas/sesion-de-pruebas");
  const useUsuarioEnSesion = () => real.useUsuarioEnSesion() ?? usuarioDePruebas();
  const useTienePermiso = (permiso: Permiso) => tienePermiso(useUsuarioEnSesion().roles, permiso);
  const SiTienePermiso = (props: { permiso: Permiso; children: ReactNode; alternativa?: ReactNode }) =>
    useTienePermiso(props.permiso) ? props.children : (props.alternativa ?? null);
  return { ...real, useUsuarioEnSesion, useTienePermiso, SiTienePermiso };
});

vi.mock("@/servicios/servidor/token-acceso", async () => {
  const { TOKEN_DE_PRUEBAS } = await import("@/pruebas/sesion-de-pruebas");
  return { obtenerTokenAcceso: vi.fn(async () => TOKEN_DE_PRUEBAS), leerTokensSesion: vi.fn(async () => null) };
});

vi.mock("@/servicios/servidor/sesion", async () => {
  const { usuarioDePruebas } = await import("@/pruebas/sesion-de-pruebas");
  return {
    obtenerEstadoSesion: vi.fn(async () => ({ estado: "con-acceso", usuario: usuarioDePruebas() })),
    tienePermisoServidor: vi.fn(async () => true),
  };
});
