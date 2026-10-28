import { describe, expect, it, vi } from "vitest";
import { apiActualizarVisibilidadReporte, validarVisibilidadReportes } from "./api-visibilidad-reportes";

const leer = vi.hoisted(() => vi.fn());
vi.mock("./solicitudes-http", () => ({ leerDatosApi: leer, crearOpcionesJson: (metodo: string, datos: unknown) => ({ method: metodo, body: JSON.stringify(datos) }) }));

describe("contrato de visibilidad de Reportes", () => {
  it("acepta lista vacía y códigos únicos", () => {
    expect(validarVisibilidadReportes([])).toEqual([]);
    expect(validarVisibilidadReportes([{ codigo: "resumen_estado", visible: false }])).toHaveLength(1);
  });
  it.each([null, [{ codigo: "MAL", visible: false }], [{ codigo: "x", visible: "no" }],
    [{ codigo: "resumen_estado", visible: true }, { codigo: "resumen_estado", visible: false }]])(
    "rechaza respuestas inválidas", valor => expect(() => validarVisibilidadReportes(valor)).toThrow(/formato esperado/));
  it("guarda únicamente el control elegido", async () => {
    await apiActualizarVisibilidadReporte("resumen_estado", false);
    expect(leer).toHaveBeenCalledWith("/api/v1/reportes/visibilidad/resumen_estado",
      { method: "PUT", body: '{"visible":false}' }, expect.any(String));
  });
});
