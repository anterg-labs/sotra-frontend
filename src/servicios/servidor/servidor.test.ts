import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi, obtenerUrlBaseApiServidor } from "@/servicios/api/solicitudes-http";
import { listarActivosServidor } from "./activos";
import { leerJsonServidor, solicitarApiServidor } from "./cliente-http-servidor";
import {
  actualizarClienteServidor,
  cambiarEstadoClienteServidor,
  crearClienteServidor,
  listarClientesServidor,
  obtenerClienteServidor,
} from "./clientes";

const fetchSimulado = vi.fn();
const cliente = { razonSocial: "ACME", nombreContacto: "Luis", correo: null, telefono: null, direccion: null, observaciones: null };

describe("URL de la API en el servidor", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("prefiere API_URL_INTERNA y cae a API_URL sin barra final", () => {
    vi.stubEnv("API_URL", "http://publica:8081/");
    vi.stubEnv("API_URL_INTERNA", "");
    expect(obtenerUrlBaseApiServidor()).toBe("http://publica:8081");
    vi.stubEnv("API_URL_INTERNA", "http://sotra-backend:8080/");
    expect(obtenerUrlBaseApiServidor()).toBe("http://sotra-backend:8080");
  });

  it("falla si no hay ninguna URL configurada", () => {
    vi.stubEnv("API_URL", "");
    vi.stubEnv("API_URL_INTERNA", "");
    expect(() => obtenerUrlBaseApiServidor()).toThrow("La URL de la API no está configurada.");
  });
});

describe("cliente HTTP de servidor", () => {
  beforeEach(() => {
    fetchSimulado.mockReset();
    vi.stubEnv("API_URL", "http://publica:8081");
    vi.stubEnv("API_URL_INTERNA", "http://interna:8080");
    vi.stubGlobal("fetch", fetchSimulado);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("usa la URL interna, no cachea y define un tiempo de espera", async () => {
    fetchSimulado.mockResolvedValue(Response.json({ ok: true }));
    await expect(leerJsonServidor("/api/v1/algo", "x")).resolves.toEqual({ ok: true });
    const [url, opciones] = fetchSimulado.mock.calls[0];
    expect(url).toBe("http://interna:8080/api/v1/algo");
    expect(opciones.cache).toBe("no-store");
    expect(opciones.signal).toBeInstanceOf(AbortSignal);
  });

  it("convierte un error HTTP en ErrorDeApi con código y mensaje del servidor", async () => {
    fetchSimulado.mockResolvedValue(Response.json({ codigo: "CORREO_DUPLICADO", mensaje: "El correo ya existe." }, { status: 409 }));
    await expect(solicitarApiServidor("/x", {}, "Error genérico")).rejects.toEqual(
      new ErrorDeApi("El correo ya existe.", "CORREO_DUPLICADO", 409),
    );
  });

  it("usa el mensaje predeterminado si el cuerpo del error no es útil", async () => {
    fetchSimulado.mockResolvedValue(new Response("<html>", { status: 500 }));
    await expect(solicitarApiServidor("/x", {}, "Error genérico")).rejects.toEqual(new ErrorDeApi("Error genérico", null, 500));
  });

  it("convierte una caída de red o un tiempo agotado en API_NO_DISPONIBLE sin detalles técnicos", async () => {
    fetchSimulado.mockRejectedValue(new TypeError("fetch failed ECONNREFUSED 10.0.0.1"));
    const error = await solicitarApiServidor("/x", {}, "No se pudo.").catch((e: unknown) => e);
    expect(error).toEqual(new ErrorDeApi("No se pudo.", "API_NO_DISPONIBLE", 503));
  });
});

describe("servicios de servidor de clientes y activos", () => {
  beforeEach(() => {
    fetchSimulado.mockReset();
    fetchSimulado.mockImplementation(async () => Response.json({}));
    vi.stubEnv("API_URL_INTERNA", "http://interna:8080");
    vi.stubGlobal("fetch", fetchSimulado);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("arma el listado con filtros recortados, orden descendente y página", async () => {
    await listarClientesServidor({ buscar: " acme ", estado: "inactivo", pagina: 3 });
    await listarClientesServidor({ buscar: "", estado: "", pagina: 1 });
    expect(fetchSimulado.mock.calls[0][0]).toBe("http://interna:8080/api/v1/clientes?buscar=acme&estado=inactivo&direccionOrden=desc&pagina=3");
    expect(fetchSimulado.mock.calls[1][0]).toBe("http://interna:8080/api/v1/clientes?direccionOrden=desc&pagina=1");
  });

  it("usa el método y el cuerpo correctos en detalle, alta, modificación y cambio de estado", async () => {
    await obtenerClienteServidor(4);
    await crearClienteServidor(cliente);
    await actualizarClienteServidor(4, cliente);
    await cambiarEstadoClienteServidor(4, "inactivo");
    await cambiarEstadoClienteServidor(4, "activo");
    const llamadas = fetchSimulado.mock.calls.map(([url, opciones]) => [opciones.method ?? "GET", url, opciones.body]);
    expect(llamadas).toEqual([
      ["GET", "http://interna:8080/api/v1/clientes/4", undefined],
      ["POST", "http://interna:8080/api/v1/clientes", JSON.stringify(cliente)],
      ["PUT", "http://interna:8080/api/v1/clientes/4", JSON.stringify(cliente)],
      ["PATCH", "http://interna:8080/api/v1/clientes/4", JSON.stringify({ estado: "inactivo" })],
      ["PATCH", "http://interna:8080/api/v1/clientes/4", JSON.stringify({ estado: "activo" })],
    ]);
  });

  it("filtra los activos por cliente", async () => {
    await listarActivosServidor({ buscar: "", clienteId: "4", modeloMaquinaId: "", estado: "", pagina: 1 });
    expect(fetchSimulado.mock.calls[0][0]).toBe("http://interna:8080/api/v1/activos?clienteId=4&pagina=1");
  });
});
