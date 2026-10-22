import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerTokenAcceso } from "@/servicios/servidor/token-acceso";
import { GET, POST } from "./route";

const contexto = (...ruta: string[]) => ({ params: Promise.resolve({ ruta }) });
let fetchSimulado: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv("API_URL_INTERNA", "http://api.test");
  fetchSimulado = vi.fn();
  vi.stubGlobal("fetch", fetchSimulado);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("reenvío de /api/v1 a la API (BFF)", () => {
  it("agrega el token de la sesión, conserva la consulta y no reenvía las cookies del navegador", async () => {
    fetchSimulado.mockResolvedValue(Response.json({ elementos: [] }));
    const solicitud = new NextRequest("http://localhost/api/v1/usuarios?estado=activo&pagina=1", {
      headers: { cookie: "authjs.session-token=secreto", accept: "application/json" },
    });

    const respuesta = await GET(solicitud, contexto("usuarios"));

    expect(respuesta.status).toBe(200);
    const [url, opciones] = fetchSimulado.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://api.test/api/v1/usuarios?estado=activo&pagina=1");
    const enviados = new Headers(opciones.headers);
    expect(enviados.get("Authorization")).toBe("Bearer token-de-pruebas");
    expect(enviados.get("accept")).toBe("application/json");
    expect(enviados.get("cookie")).toBeNull();
  });

  it("reenvía subidas multipart con su Content-Type", async () => {
    fetchSimulado.mockResolvedValue(Response.json({ id: 3 }, { status: 201 }));
    const datos = new FormData();
    datos.append("tipo", "foto");
    datos.append("archivo", new File(["contenido"], "foto.png", { type: "image/png" }));
    const solicitud = new NextRequest("http://localhost/api/v1/ordenes-trabajo/4/evidencias", { method: "POST", body: datos });

    const respuesta = await POST(solicitud, contexto("ordenes-trabajo", "4", "evidencias"));

    expect(respuesta.status).toBe(201);
    const [, opciones] = fetchSimulado.mock.calls[0] as [string, RequestInit];
    expect(opciones.method).toBe("POST");
    expect(new Headers(opciones.headers).get("content-type")).toMatch(/^multipart\/form-data; boundary=/);
    expect((opciones.body as ArrayBuffer).byteLength).toBeGreaterThan(0);
  });

  it("las descargas devuelven el archivo con su tipo y nombre (Content-Disposition)", async () => {
    fetchSimulado.mockResolvedValue(
      new Response("%PDF-1.7", {
        headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="manual.pdf"', "set-cookie": "x=1" },
      }),
    );

    const respuesta = await GET(new NextRequest("http://localhost/api/v1/documentos-tecnicos/7/archivo"), contexto("documentos-tecnicos", "7", "archivo"));

    expect(respuesta.headers.get("content-type")).toBe("application/pdf");
    expect(respuesta.headers.get("content-disposition")).toBe('attachment; filename="manual.pdf"');
    expect(respuesta.headers.get("set-cookie")).toBeNull();
    expect(await respuesta.text()).toBe("%PDF-1.7");
  });

  it("devuelve tal cual los errores de la API (403 sin cuerpo, 409 con código)", async () => {
    fetchSimulado.mockResolvedValueOnce(new Response(null, { status: 403 }));
    expect((await GET(new NextRequest("http://localhost/api/v1/usuarios"), contexto("usuarios"))).status).toBe(403);

    fetchSimulado.mockResolvedValueOnce(Response.json({ codigo: "USUARIO_SIN_ACCESO", mensaje: "Sin acceso" }, { status: 409 }));
    const respuesta = await POST(
      new NextRequest("http://localhost/api/v1/usuarios/25/restablecer-contrasena", { method: "POST" }),
      contexto("usuarios", "25", "restablecer-contrasena"),
    );
    expect(respuesta.status).toBe(409);
    expect(await respuesta.json()).toEqual({ codigo: "USUARIO_SIN_ACCESO", mensaje: "Sin acceso" });
  });

  it("sin sesión responde 401 sin cuerpo y no llama a la API", async () => {
    vi.mocked(obtenerTokenAcceso).mockResolvedValueOnce(null);
    const respuesta = await GET(new NextRequest("http://localhost/api/v1/activos"), contexto("activos"));
    expect(respuesta.status).toBe(401);
    expect(await respuesta.text()).toBe("");
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("rechaza segmentos que saldrían de /api/v1 y responde 503 si la API no está disponible", async () => {
    expect((await GET(new NextRequest("http://localhost/api/v1/x"), contexto("..", "health"))).status).toBe(404);
    expect(fetchSimulado).not.toHaveBeenCalled();

    fetchSimulado.mockRejectedValue(new Error("ECONNREFUSED"));
    const respuesta = await GET(new NextRequest("http://localhost/api/v1/activos"), contexto("activos"));
    expect(respuesta.status).toBe(503);
    expect(await respuesta.json()).toMatchObject({ codigo: "API_NO_DISPONIBLE" });
  });
});
