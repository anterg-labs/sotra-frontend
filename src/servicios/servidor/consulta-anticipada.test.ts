import { describe, expect, it } from "vitest";
import { anticiparConsulta, resolverConsulta } from "./consulta-anticipada";

describe("consulta anticipada", () => {
  it("conserva el resultado mientras se preparan las otras partes de la pantalla", async () => {
    const datos = { elementos: [{ id: 3 }], totalElementos: 1 };
    const consulta = anticiparConsulta(Promise.resolve(datos));
    await expect(resolverConsulta(consulta)).resolves.toBe(datos);
  });

  it("maneja el rechazo temprano y conserva el error para la interfaz del módulo", async () => {
    const error = new Error("No se pudo obtener el listado.");
    const consulta = anticiparConsulta(Promise.reject(error));
    await expect(consulta).resolves.toEqual({ estado: "error", error });
    await expect(resolverConsulta(consulta)).rejects.toBe(error);
  });
});
