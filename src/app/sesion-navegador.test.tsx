import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { simularFetch } from "@/pruebas/ayudas";
import { usuarioDePruebas } from "@/pruebas/sesion-de-pruebas";
import { apiSolicitarSugerenciaOrdenTrabajo } from "@/servicios/api/api-ordenes-trabajo";
import { enviarPedidoApi } from "@/servicios/api/solicitudes-http";
import { obtenerEstadoSesion } from "@/servicios/servidor/sesion";
import { BotonRestablecerContrasena } from "./usuarios/boton-restablecer-contrasena";
import LayoutRaiz from "./layout";

const restablecerContrasenaAccion = vi.hoisted(() => vi.fn());
const mostrarAviso = vi.hoisted(() => vi.fn());
vi.mock("./usuarios/acciones", () => ({ restablecerContrasenaAccion }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/componentes/avisos", () => ({
  useAvisos: () => ({ mostrarAviso }),
  ProveedorDeAvisos: (p: { children: React.ReactNode }) => p.children,
}));
vi.mock("@/componentes/estructura-aplicacion", () => ({
  EstructuraAplicacion: (p: { children: React.ReactNode }) => <div data-testid="aplicacion">{p.children}</div>,
}));
vi.mock("@/componentes/registro-service-worker", () => ({ RegistroServiceWorker: () => null }));
vi.mock("next/image", () => ({ default: (p: { alt: string }) => <span aria-label={p.alt} role="img" /> }));

const ubicacion = { pathname: "/ordenes-trabajo/4", search: "?x=1", assign: vi.fn() };

beforeEach(() => {
  ubicacion.assign.mockReset();
  vi.stubGlobal("location", ubicacion);
  restablecerContrasenaAccion.mockReset();
  mostrarAviso.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("401 y 403 en los pedidos del navegador", () => {
  it("un 401 manda a iniciar sesión de nuevo y vuelve a la misma página", async () => {
    simularFetch(() => ({ estado: 401 }));
    await expect(enviarPedidoApi("/api/v1/activos", {}, "x")).rejects.toMatchObject({ estadoHttp: 401 });
    expect(ubicacion.assign).toHaveBeenCalledWith("/login?destino=%2Fordenes-trabajo%2F4%3Fx%3D1");
  });

  it("un 403 con código propio de la API (el jefe y los administradores) muestra su mensaje", async () => {
    simularFetch(() => ({ estado: 403, cuerpo: { codigo: "SOLO_ADMINISTRADOR", mensaje: "Solo un administrador puede asignar el rol Administrador." } }));
    await expect(enviarPedidoApi("/api/v1/usuarios", { method: "POST" }, "x")).rejects.toMatchObject({
      message: "Solo un administrador puede asignar el rol Administrador.",
      codigo: "SOLO_ADMINISTRADOR",
      estadoHttp: 403,
    });
  });

  it("un 403 muestra el mensaje de permiso y no redirige", async () => {
    simularFetch(() => ({ estado: 403 }));
    await expect(enviarPedidoApi("/api/v1/usuarios", {}, "x")).rejects.toMatchObject({ message: "No tenés permiso para realizar esta acción." });
    expect(ubicacion.assign).not.toHaveBeenCalled();
  });

  it("la sugerencia de IA va por el mismo origen y trata 401 y 403 igual", async () => {
    const { llamadas } = simularFetch(() => ({ estado: 403 }));
    await expect(apiSolicitarSugerenciaOrdenTrabajo({ descripcion: "x", numero: 1, sesion: "s" })).rejects.toThrow("No tenés permiso para realizar esta acción.");
    expect(llamadas[0].url).toBe("/api/v1/ordenes-trabajo/sugerencia");

    simularFetch(() => ({ estado: 401 }));
    await expect(apiSolicitarSugerenciaOrdenTrabajo({ descripcion: "x", numero: 1, sesion: "s" })).rejects.toThrow("Tu sesión venció");
    expect(ubicacion.assign).toHaveBeenCalledOnce();
  });
});

describe("layout raíz según la sesión", () => {
  it("con acceso muestra la aplicación", async () => {
    render(await LayoutRaiz({ children: <p>Contenido</p> }), { container: document.documentElement });
    expect(screen.getByTestId("aplicacion")).toHaveTextContent("Contenido");
  });

  it("sin acceso a SOTRA reemplaza la aplicación por la pantalla «sin acceso»", async () => {
    vi.mocked(obtenerEstadoSesion).mockResolvedValueOnce({ estado: "sin-acceso", usuario: usuarioDePruebas([], { idUsuario: null, correo: "otra@sotra.test" }) });
    render(await LayoutRaiz({ children: <p>Contenido</p> }), { container: document.documentElement });
    expect(screen.getByRole("heading", { name: "Tu usuario no tiene acceso a SOTRA. Contactá al administrador." })).toBeInTheDocument();
    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
    expect(screen.queryByTestId("aplicacion")).not.toBeInTheDocument();
  });

  it("sin sesión (páginas públicas como «sin conexión») muestra solo el contenido", async () => {
    vi.mocked(obtenerEstadoSesion).mockResolvedValueOnce({ estado: "sin-sesion" });
    render(await LayoutRaiz({ children: <p>Contenido</p> }), { container: document.documentElement });
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.queryByTestId("aplicacion")).not.toBeInTheDocument();
  });
});

describe("restablecer contraseña", () => {
  it("pide confirmación, envía el correo y avisa", async () => {
    restablecerContrasenaAccion.mockResolvedValue({ exito: true });
    render(<BotonRestablecerContrasena correo="ana@sotra.test" usuarioId={5} />);
    fireEvent.click(screen.getByRole("button", { name: "Restablecer contraseña" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar correo" }));
    await waitFor(() => expect(mostrarAviso).toHaveBeenCalledWith("exito", "Se envió un correo a ana@sotra.test para que elija una contraseña nueva."));
    expect(restablecerContrasenaAccion).toHaveBeenCalledWith(5);
  });

  it("muestra el mensaje del 409 (sin acceso o inactivo) o del 502 de Keycloak", async () => {
    restablecerContrasenaAccion.mockResolvedValue({ exito: false, mensaje: "El usuario no tiene acceso al sistema: no está registrado en Keycloak." });
    render(<BotonRestablecerContrasena correo="juan@sotra.test" usuarioId={25} />);
    fireEvent.click(screen.getByRole("button", { name: "Restablecer contraseña" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar correo" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no está registrado en Keycloak");
    expect(mostrarAviso).not.toHaveBeenCalled();
  });
});
