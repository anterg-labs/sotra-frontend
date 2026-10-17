import { beforeEach, describe, expect, it, vi } from "vitest";
import { eliminarDocumentoTecnicoAccion } from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const eliminarDocumentoTecnicoServidor = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/documentos-tecnicos", () => ({ eliminarDocumentoTecnicoServidor }));

beforeEach(() => {
  revalidatePath.mockReset();
  eliminarDocumentoTecnicoServidor.mockReset();
});

describe("acción de eliminar documentos técnicos", () => {
  it("elimina y revalida el listado", async () => {
    eliminarDocumentoTecnicoServidor.mockResolvedValue(undefined);
    await expect(eliminarDocumentoTecnicoAccion(8)).resolves.toEqual({ exito: true });
    expect(eliminarDocumentoTecnicoServidor).toHaveBeenCalledWith(8);
    expect(revalidatePath).toHaveBeenCalledWith("/documentacion-tecnica", "layout");
  });

  it("informa el error sin detalles técnicos y rechaza ids inválidos", async () => {
    eliminarDocumentoTecnicoServidor.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(eliminarDocumentoTecnicoAccion(8)).resolves.toEqual({ exito: false, mensaje: "No se pudo eliminar el documento seleccionado." });
    await expect(eliminarDocumentoTecnicoAccion(0)).resolves.toMatchObject({ exito: false });
    await expect(eliminarDocumentoTecnicoAccion("8" as never)).resolves.toMatchObject({ exito: false });
    expect(eliminarDocumentoTecnicoServidor).toHaveBeenCalledTimes(1);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
