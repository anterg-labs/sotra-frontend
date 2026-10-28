import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiObtenerDesgasteEdadUso, leerDesgasteEdadUso } from "./api-desgaste-edad-uso";

const leer = vi.hoisted(() => vi.fn());
vi.mock("./solicitudes-http", () => ({ leerDatosApi: leer }));
beforeEach(() => { leer.mockReset(); });

const datos = {
  fechaDesde: null, fechaHasta: null, totalActivos: 1, conEdad: 1, conUso: 1,
  activos: [{ activoId: 3, nombreActivo: "Máquina 3", modelo: "M-1", edadAnios: 5,
    lecturaUso: 1200, unidadUso: "horas", fechaLectura: "2026-10-27T00:00:00Z",
    correctivas: 2, ordenesObservadas: 3 }],
};

describe("análisis de edad y uso", () => {
  it("acepta activos de horas o kilómetros y datos faltantes", () => {
    expect(leerDesgasteEdadUso(datos)).toEqual(datos);
    expect(leerDesgasteEdadUso({ ...datos, conEdad: 0, conUso: 0,
      activos: [{ ...datos.activos[0], edadAnios: null, lecturaUso: null,
        fechaLectura: null, unidadUso: "kilometros" }] })).toBeTruthy();
  });
  it.each([null, { ...datos, totalActivos: 2 },
    { ...datos, activos: [{ ...datos.activos[0], lecturaUso: -1 }] },
    { ...datos, activos: [{ ...datos.activos[0], unidadUso: "litros" }] },
  ])("rechaza respuestas inválidas", valor => expect(() => leerDesgasteEdadUso(valor)).toThrow(/formato esperado/));
  it("envía solo los filtros aplicables al análisis", async () => {
    leer.mockResolvedValue(datos);
    await apiObtenerDesgasteEdadUso({ fechaDesde: "2026-01-01", fechaHasta: "2026-01-31",
      clienteId: "3", activoId: "4", estado: "cerrado", tipo: "preventivo" });
    expect(leer).toHaveBeenCalledWith(
      "/api/v1/reportes/analisis/desgaste-edad-uso?fechaDesde=2026-01-01&fechaHasta=2026-01-31&clienteId=3&activoId=4",
      { cache: "no-store" }, expect.any(String));
  });
});
