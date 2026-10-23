import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaginaError from "./error";
import manifest from "./manifest";
import PaginaNoEncontrada from "./not-found";
import PaginaInicio from "./page";
import PaginaSinConexion from "./sin-conexion/page";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));
const cookiesDePrueba = vi.hoisted(() => ({ valor: undefined as string | undefined }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => (cookiesDePrueba.valor ? { value: cookiesDePrueba.valor } : undefined) }) }));


describe("páginas de estado", () => {
  it("la raíz redirige al inicio del administrador", async () => {
    const { obtenerEstadoSesion } = await import("@/servicios/servidor/sesion");
    const { usuarioDePruebas } = await import("@/pruebas/sesion-de-pruebas");
    vi.mocked(obtenerEstadoSesion).mockResolvedValue({ estado: "con-acceso", usuario: usuarioDePruebas() });
    await PaginaInicio();
    expect(redirect).toHaveBeenCalledWith("/inicio");
  });

  it("el técnico empieza en «Mi trabajo», o en el listado de órdenes si eligió la vista de escritorio", async () => {
    const { obtenerEstadoSesion } = await import("@/servicios/servidor/sesion");
    const { usuarioDePruebas } = await import("@/pruebas/sesion-de-pruebas");
    vi.mocked(obtenerEstadoSesion).mockResolvedValue({ estado: "con-acceso", usuario: usuarioDePruebas(["tecnico"]) });
    await PaginaInicio();
    expect(redirect).toHaveBeenLastCalledWith("/tecnico");
    cookiesDePrueba.valor = "escritorio";
    await PaginaInicio();
    expect(redirect).toHaveBeenLastCalledWith("/ordenes-trabajo");
    cookiesDePrueba.valor = undefined;
  });

  it("404 explica el problema y ofrece volver al inicio", () => {
    render(<PaginaNoEncontrada />);
    expect(screen.getByRole("heading", { name: "No encontramos esta página" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
  });

  it("el error inesperado es una alerta sin detalles técnicos y permite reintentar", () => {
    const reset = vi.fn();
    render(<PaginaError reset={reset} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos mostrar esta pantalla");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
  });

  it("sin conexión informa el estado y ofrece reintentar hacia /tecnico", () => {
    render(<PaginaSinConexion />);
    expect(screen.getByRole("status")).toHaveTextContent("No hay conexión a internet");
    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute("href", "/tecnico");
  });

  it("el manifiesto declara una PWA instalable con íconos", () => {
    const datos = manifest();
    expect(datos).toMatchObject({ short_name: "SOTRA", display: "standalone", start_url: "/tecnico", lang: "es" });
    expect(datos.icons?.some((icono) => icono.purpose === "maskable")).toBe(true);
  });
});
