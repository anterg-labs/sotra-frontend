import { NextRequest, type NextFetchEvent } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

/** Sesión que «lee» Auth.js en cada prueba. */
const sesion = vi.hoisted(() => ({ valor: null as null | { roles: string[]; error?: string } }));

// `auth(fn)` de Auth.js: con la configuración diferida devuelve una promesa del middleware, que agrega `auth` al pedido.
vi.mock("@/auth", () => ({
  auth: (alPedir: (solicitud: NextRequest & { auth: unknown }) => Response) =>
    Promise.resolve((solicitud: NextRequest) => alPedir(Object.assign(solicitud, { auth: sesion.valor }))),
}));

const evento = {} as NextFetchEvent;

function pedir(url: string, encabezados: Record<string, string> = {}) {
  return proxy(new NextRequest(url, { headers: encabezados }), evento) as Promise<Response>;
}

beforeEach(() => {
  sesion.valor = { roles: ["administrador"] };
});

describe("proxy: sesión obligatoria", () => {
  it("sin sesión manda al login de Keycloak y vuelve a la página pedida", async () => {
    sesion.valor = null;
    const respuesta = await pedir("http://localhost/ordenes-trabajo?estado=creada");
    expect(respuesta.status).toBe(307);
    expect(respuesta.headers.get("location")).toBe("http://localhost/login?destino=%2Fordenes-trabajo%3Festado%3Dcreada");
  });

  it("con la renovación fallida también pide el login", async () => {
    sesion.valor = { roles: ["tecnico"], error: "RenovacionFallida" };
    expect((await pedir("http://localhost/clientes")).headers.get("location")).toBe("http://localhost/login?destino=%2Fclientes");
  });

  it("sin sesión, /api/v1 responde 401 sin cuerpo (el navegador vuelve a iniciar sesión)", async () => {
    sesion.valor = null;
    const respuesta = await pedir("http://localhost/api/v1/activos");
    expect(respuesta.status).toBe(401);
    expect(await respuesta.text()).toBe("");
  });

  it("sin el rol de la página muestra «sin permiso» con estado 403", async () => {
    sesion.valor = { roles: ["tecnico"] };
    const respuesta = await pedir("http://localhost/usuarios");
    expect(respuesta.status).toBe(403);
    expect(respuesta.headers.get("x-middleware-rewrite")).toBe("http://localhost/sin-permiso");
  });

  it("con permiso sigue y agrega la página pedida para volver después del login", async () => {
    const respuesta = await pedir("http://localhost/clientes?buscar=x");
    expect(respuesta.headers.get("x-middleware-next")).toBe("1");
    expect(respuesta.headers.get("x-middleware-request-x-sotra-ruta")).toBe("/clientes?buscar=x");
  });
});

describe("redirección de enlaces antiguos de activos", () => {
  it.each(["modelos", "tipos"])("redirige %s a su ruta propia sin conservar seccion", async (seccion) => {
    const respuesta = await pedir(`http://localhost/activos?seccion=${seccion}&buscar=maquina`);

    expect(respuesta.status).toBe(308);
    expect(respuesta.headers.get("location")).toBe(`http://localhost/activos/${seccion}?buscar=maquina`);
  });

  it("deja intacta la ruta de activos sin seccion antigua", async () => {
    const respuesta = await pedir("http://localhost/activos?buscar=maquina");

    expect(respuesta.headers.get("location")).toBeNull();
  });

  it("elimina valores desconocidos de seccion sin reflejarlos en una página HTML", async () => {
    const respuesta = await pedir("http://localhost/activos?seccion=%3Cscript%3E&buscar=maquina");

    expect(respuesta.status).toBe(308);
    expect(respuesta.headers.get("location")).toBe("http://localhost/activos?buscar=maquina");
  });
});
