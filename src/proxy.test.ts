import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

describe("redirección de enlaces antiguos de activos", () => {
  it.each(["modelos", "tipos"])("redirige %s a su ruta propia sin conservar seccion", (seccion) => {
    const solicitud = new NextRequest(`http://localhost/activos?seccion=${seccion}&buscar=maquina`);

    const respuesta = proxy(solicitud);

    expect(respuesta.status).toBe(308);
    expect(respuesta.headers.get("location")).toBe(`http://localhost/activos/${seccion}?buscar=maquina`);
  });

  it("deja intacta la ruta de activos sin seccion antigua", () => {
    const respuesta = proxy(new NextRequest("http://localhost/activos?buscar=maquina"));

    expect(respuesta.headers.get("location")).toBeNull();
  });

  it("elimina valores desconocidos de seccion sin reflejarlos en una página HTML", () => {
    const solicitud = new NextRequest("http://localhost/activos?seccion=%3Cscript%3E&buscar=maquina");

    const respuesta = proxy(solicitud);

    expect(respuesta.status).toBe(308);
    expect(respuesta.headers.get("location")).toBe("http://localhost/activos?buscar=maquina");
  });
});
