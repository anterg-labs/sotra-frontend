import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listarDocumentosTecnicosServidor, eliminarDocumentoTecnicoServidor, obtenerDocumentoTecnicoServidor } from "./documentos-tecnicos";
import {
  listarMovimientosStockServidor,
  obtenerMovimientoStockServidor,
  registrarAjusteStockServidor,
  registrarEgresoStockServidor,
  registrarIngresoStockServidor,
} from "./movimientos-stock";
import { listarOrdenesTrabajoServidor, listarTecnicosServidor, obtenerOrdenTrabajoServidor } from "./ordenes-trabajo";
import { listarRepuestosServidor, actualizarStockMinimoServidor, cambiarEstadoRepuestoServidor, obtenerAlertasStockServidor } from "./repuestos";
import {
  obtenerAlertasMaquinariaServidor,
  obtenerIndicadoresServidor,
  obtenerReincidenciasServidor,
  obtenerRepuestosUsadosServidor,
  obtenerTendenciasServidor,
  obtenerTiemposServidor,
} from "./reportes";
import { listarActivosServidor, listarDocumentosDeActivoServidor } from "./activos";
import { conSeleccionado } from "./opciones";
import {
  aceptarTerminosServidor,
  obtenerEstadoTerminosServidor,
  obtenerTerminosVigentesServidor,
  publicarTerminosServidor,
} from "./terminos";

const fetchSimulado = vi.fn();
const base = "http://interna:8080";
const rutas = () => fetchSimulado.mock.calls.map(([url, opciones]) => [opciones.method ?? "GET", String(url).replace(base, "")]);

beforeEach(() => {
  fetchSimulado.mockReset();
  fetchSimulado.mockImplementation(async () => Response.json({}));
  vi.stubEnv("API_URL_INTERNA", base);
  vi.stubGlobal("fetch", fetchSimulado);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("servicios de servidor de repuestos y movimientos de stock", () => {
  it("arma el listado de repuestos con todos los parámetros informados", async () => {
    await listarRepuestosServidor({ buscar: " filtro ", estado: "activo", ubicacion: " Pañol ", bajoStock: true, estadoStock: "bajo", orden: "criticidad", pagina: 2 });
    const parametros = new URL(String(fetchSimulado.mock.calls[0][0])).searchParams;
    expect(Object.fromEntries(parametros)).toEqual({
      buscar: "filtro", estado: "activo", ubicacion: "Pañol", bajoStock: "true", estadoStock: "bajo", orden: "criticidad", pagina: "2",
    });
    await listarRepuestosServidor({ buscar: "", estado: "", ubicacion: "", bajoStock: false, pagina: 1 });
    expect(String(fetchSimulado.mock.calls[1][0])).toBe(base + "/api/v1/repuestos?pagina=1");
  });

  it("usa los endpoints de alertas, estado y stock mínimo", async () => {
    await obtenerAlertasStockServidor();
    await cambiarEstadoRepuestoServidor(3, "activo");
    await actualizarStockMinimoServidor(3, 4);
    expect(rutas()).toEqual([
      ["GET", "/api/v1/repuestos/alertas-stock"],
      ["PATCH", "/api/v1/repuestos/3"],
      ["PATCH", "/api/v1/repuestos/3/stock-minimo"],
    ]);
    expect(fetchSimulado.mock.calls[1][1].body).toBe(JSON.stringify({ estado: "activo" }));
    expect(fetchSimulado.mock.calls[2][1].body).toBe(JSON.stringify({ cantidadMinima: 4 }));
  });

  it("lista movimientos con todos los filtros y registra ingresos, egresos y ajustes", async () => {
    await listarMovimientosStockServidor({
      buscar: " x ", repuestoId: "3", tipo: "egreso", fechaDesde: "2026-01-01", fechaHasta: "2026-02-01", ubicacion: " Pañol ", usuarioId: "9", pagina: 2,
    });
    expect(Object.fromEntries(new URL(String(fetchSimulado.mock.calls[0][0])).searchParams)).toEqual({
      buscar: "x", repuestoId: "3", tipo: "egreso", fechaDesde: "2026-01-01", fechaHasta: "2026-02-01", ubicacion: "Pañol", usuarioId: "9", pagina: "2",
    });
    await obtenerMovimientoStockServidor(5);
    await registrarIngresoStockServidor(1, { cantidad: 1, observaciones: "" });
    await registrarEgresoStockServidor(1, { cantidad: 1, motivo: "x" });
    await registrarAjusteStockServidor(1, { cantidadReal: 1, motivo: "x" });
    expect(rutas().slice(1)).toEqual([
      ["GET", "/api/v1/movimientos-stock/5"],
      ["POST", "/api/v1/repuestos/1/ingresos"],
      ["POST", "/api/v1/repuestos/1/egresos"],
      ["POST", "/api/v1/repuestos/1/ajustes"],
    ]);
  });
});

describe("servicios de servidor de documentos, activos y órdenes", () => {
  it("lista y consulta documentos técnicos y elimina con DELETE aunque la respuesta venga vacía", async () => {
    await listarDocumentosTecnicosServidor({ buscar: " manual ", activoId: "3", modeloMaquinaId: "", tipo: "", vigente: "", pagina: 2 });
    await obtenerDocumentoTecnicoServidor(8);
    fetchSimulado.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(eliminarDocumentoTecnicoServidor(8)).resolves.toBeUndefined();
    expect(rutas()).toEqual([
      ["GET", "/api/v1/documentos-tecnicos?buscar=manual&activoId=3&pagina=2"],
      ["GET", "/api/v1/documentos-tecnicos/8"],
      ["DELETE", "/api/v1/documentos-tecnicos/8"],
    ]);
  });

  it("trae los documentos de un activo y filtra activos por todos los criterios", async () => {
    await listarDocumentosDeActivoServidor(4);
    await listarActivosServidor({ buscar: "a", clienteId: "1", modeloMaquinaId: "2", estado: "activo", pagina: 3 });
    expect(rutas()).toEqual([
      ["GET", "/api/v1/documentos-tecnicos?activoId=4&pagina=1"],
      ["GET", "/api/v1/activos?buscar=a&clienteId=1&modeloMaquinaId=2&estado=activo&pagina=3"],
    ]);
  });

  it("lista órdenes con los filtros no vacíos, consulta el detalle y resuelve los técnicos por el rol", async () => {
    await listarOrdenesTrabajoServidor({
      buscar: " fuga ", clienteId: "1", activoId: "", tecnicoId: "7", estado: "pausada", prioridad: "", tipo: "",
      fechaDesde: "2026-01-01", fechaHasta: "", conSugerencias: true, pagina: 2,
    });
    await obtenerOrdenTrabajoServidor(11);
    expect(Object.fromEntries(new URL(String(fetchSimulado.mock.calls[0][0])).searchParams)).toEqual({
      buscar: "fuga", clienteId: "1", tecnicoId: "7", estado: "pausada", fechaDesde: "2026-01-01", conSugerencias: "true", pagina: "2",
    });
    expect(rutas()[1]).toEqual(["GET", "/api/v1/ordenes-trabajo/11"]);

    fetchSimulado.mockReset();
    const usuario = (id: number, rol: string, estado = "activo") => ({ id, estado, roles: [{ id: 9, nombre: rol, activo: true }] });
    fetchSimulado.mockImplementation(async () =>
      Response.json({ elementos: [usuario(7, "Técnico"), usuario(8, "Administrador"), usuario(9, "Técnico", "inactivo")] }),
    );
    expect((await listarTecnicosServidor("tom")).map((tecnico) => tecnico.id)).toEqual([7]);
    // Sin /api/v1/roles (solo del administrador): el jefe también asigna técnicos.
    expect(rutas()).toEqual([["GET", "/api/v1/usuarios?buscar=tom&estado=activo&pagina=1&tamanoPagina=100"]]);
  });
});

describe("servicios de servidor de reportes", () => {
  const filtros = { fechaDesde: "2026-01-01", fechaHasta: "2026-01-31", tecnicoId: "1", clienteId: "2", activoId: "3", estado: "cerrada", tipo: "correctivo" };
  const vacios = { fechaDesde: "", fechaHasta: "", tecnicoId: "", clienteId: "", activoId: "", estado: "", tipo: "" };

  it("los indicadores envían todos los filtros y los analíticos solo los que aplican", async () => {
    await obtenerIndicadoresServidor(vacios);
    await obtenerIndicadoresServidor(filtros);
    await obtenerTendenciasServidor(filtros, "mes");
    await obtenerTiemposServidor(vacios);
    await obtenerReincidenciasServidor(filtros);
    await obtenerAlertasMaquinariaServidor(vacios);
    await obtenerRepuestosUsadosServidor(vacios);
    const llamadas = fetchSimulado.mock.calls.map(([url]) => new URL(String(url)));
    expect(llamadas[0].pathname + llamadas[0].search).toBe("/api/v1/reportes/indicadores");
    expect(Object.fromEntries(llamadas[1].searchParams)).toEqual(filtros);
    expect(llamadas[2].searchParams.get("agrupacion")).toBe("mes");
    expect(llamadas[2].searchParams.has("estado")).toBe(false);
    expect(llamadas.map((url) => url.pathname)).toEqual([
      "/api/v1/reportes/indicadores",
      "/api/v1/reportes/indicadores",
      "/api/v1/reportes/tendencias",
      "/api/v1/reportes/tiempos",
      "/api/v1/reportes/reincidencias",
      "/api/v1/reportes/alertas-maquinaria",
      "/api/v1/reportes/repuestos-usados",
    ]);
  });
});

describe("opciones de filtros buscables", () => {
  it("agrega el elegido al principio solo si falta en la primera página y tolera que no exista", async () => {
    const obtener = vi.fn().mockResolvedValue({ id: 9 });
    expect(await conSeleccionado([{ id: 1 }], "", obtener)).toEqual([{ id: 1 }]);
    expect(await conSeleccionado([{ id: 1 }], "1", obtener)).toEqual([{ id: 1 }]);
    expect(obtener).not.toHaveBeenCalled();
    expect(await conSeleccionado([{ id: 1 }], "9", obtener)).toEqual([{ id: 9 }, { id: 1 }]);
    obtener.mockRejectedValue(new Error("404"));
    expect(await conSeleccionado([{ id: 1 }], "9", obtener)).toEqual([{ id: 1 }]);
  });
});

describe("servicios de servidor de términos y condiciones", () => {
  it("arma las rutas, los métodos y los cuerpos de la API", async () => {
    await obtenerTerminosVigentesServidor();
    await obtenerEstadoTerminosServidor(12);
    await aceptarTerminosServidor({ usuarioId: 12, terminosId: 4, version: 2, acepta: true });
    await publicarTerminosServidor({ texto: "x".repeat(20) });
    expect(rutas()).toEqual([
      ["GET", "/api/v1/terminos/vigente"],
      ["GET", "/api/v1/terminos/estado?usuarioId=12"],
      ["POST", "/api/v1/terminos/aceptaciones"],
      ["POST", "/api/v1/terminos"],
    ]);
    expect(JSON.parse(fetchSimulado.mock.calls[2][1].body)).toEqual({ usuarioId: 12, terminosId: 4, version: 2, acepta: true });
    expect(JSON.parse(fetchSimulado.mock.calls[3][1].body)).toEqual({ texto: "x".repeat(20) });
  });
});
