import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as cambiarVista } from "@/app/vista/route";
import { decidirAcceso } from "@/seguridad/acceso";
import { leerModoVista, rutaEnVista, urlCambioDeVista } from "@/seguridad/vista";

describe("vista del técnico (móvil o escritorio)", () => {
  it("por defecto es la móvil", () => {
    expect(leerModoVista(undefined)).toBe("movil");
    expect(leerModoVista("cualquiera")).toBe("movil");
    expect(leerModoVista("escritorio")).toBe("escritorio");
  });

  it("al cambiar, abre la pantalla equivalente", () => {
    expect(rutaEnVista("escritorio", "/tecnico")).toBe("/ordenes-trabajo");
    expect(rutaEnVista("escritorio", "/tecnico/15")).toBe("/ordenes-trabajo/15");
    expect(rutaEnVista("escritorio", "/activos/6")).toBe("/activos/6");
    expect(rutaEnVista("movil", "/ordenes-trabajo")).toBe("/tecnico");
    expect(rutaEnVista("movil", "/ordenes-trabajo/15")).toBe("/tecnico/15");
    expect(urlCambioDeVista("escritorio", "/tecnico/15")).toBe("/vista?modo=escritorio&destino=%2Fordenes-trabajo%2F15");
  });

  it("/vista guarda la elección en una cookie y vuelve a una ruta interna", () => {
    const respuesta = cambiarVista(new NextRequest("http://localhost/vista?modo=escritorio&destino=%2Fordenes-trabajo"));
    expect(respuesta.status).toBe(307);
    expect(respuesta.headers.get("location")).toBe("/ordenes-trabajo");
    expect(respuesta.cookies.get("sotra-vista")?.value).toBe("escritorio");

    const externa = cambiarVista(new NextRequest("http://localhost/vista?modo=movil&destino=https%3A%2F%2Fotro.sitio"));
    expect(externa.headers.get("location")).toBe("/");
    expect(externa.cookies.get("sotra-vista")?.value).toBe("movil");
  });

  it("con la vista de escritorio, el técnico no se redirige a «Mi trabajo»", () => {
    const pedido = { consulta: "", haySesion: true, roles: ["tecnico"], esServerAction: false };
    expect(decidirAcceso({ ...pedido, ruta: "/ordenes-trabajo" }).tipo).toBe("redirigir");
    expect(decidirAcceso({ ...pedido, ruta: "/ordenes-trabajo", vistaEscritorio: true }).tipo).toBe("continuar");
    expect(decidirAcceso({ ...pedido, ruta: "/ordenes-trabajo/15", vistaEscritorio: true }).tipo).toBe("continuar");
  });
});
