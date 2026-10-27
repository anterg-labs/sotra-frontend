import { beforeEach, describe, expect, it, vi } from "vitest";
import { actualizarDocumentoAccion, eliminarDocumentoTecnicoAccion } from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const eliminarDocumentoTecnicoServidor = vi.hoisted(() => vi.fn());
const actualizarDocumentoTecnicoServidor = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/documentos-tecnicos", () => ({ eliminarDocumentoTecnicoServidor, actualizarDocumentoTecnicoServidor }));

beforeEach(() => {
  revalidatePath.mockReset();
  eliminarDocumentoTecnicoServidor.mockReset();
  actualizarDocumentoTecnicoServidor.mockReset();
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

describe("acción de modificar un documento", () => {
  it("distingue opcionales explícitamente nulos de campos omitidos", async () => {
    actualizarDocumentoTecnicoServidor.mockResolvedValue({ id: 8 });
    const vaciado = { titulo: null, tipo: "manual_tecnico", descripcion: null, activoId: null, modeloMaquinaId: null } as const;
    await expect(actualizarDocumentoAccion(8, vaciado)).resolves.toMatchObject({ exito: true });
    expect(actualizarDocumentoTecnicoServidor).toHaveBeenCalledWith(8, vaciado);
    actualizarDocumentoTecnicoServidor.mockClear();
    await expect(actualizarDocumentoAccion(8, { tipo: "manual_tecnico" } as never)).resolves.toMatchObject({ exito: false });
    expect(actualizarDocumentoTecnicoServidor).not.toHaveBeenCalled();
  });

  const datos = { titulo: " Norma ", tipo: "normativa", descripcion: "", activoId: 2, modeloMaquinaId: null } as const;

  it("guarda los datos sin espacios sobrantes y revalida el listado", async () => {
    actualizarDocumentoTecnicoServidor.mockResolvedValue({ id: 8 });
    await expect(actualizarDocumentoAccion(8, datos)).resolves.toEqual({ exito: true, registro: { id: 8 } });
    expect(actualizarDocumentoTecnicoServidor).toHaveBeenCalledWith(8, { titulo: "Norma", tipo: "normativa", descripcion: null, activoId: 2, modeloMaquinaId: null });
    expect(revalidatePath).toHaveBeenCalledWith("/documentacion-tecnica", "layout");
  });

  it("rechaza entradas manipuladas sin llamar a la API", async () => {
    for (const mala of [{ ...datos, tipo: "contrato" }, { ...datos, activoId: "2" }, { ...datos, titulo: 5 }, null, { ...datos, modeloMaquinaId: -1 }]) {
      await expect(actualizarDocumentoAccion(8, mala as never)).resolves.toMatchObject({ exito: false });
    }
    await expect(actualizarDocumentoAccion(0, datos)).resolves.toMatchObject({ exito: false });
    expect(actualizarDocumentoTecnicoServidor).not.toHaveBeenCalled();
  });

  it("valida el largo del título y de la descripción", async () => {
    const resultado = await actualizarDocumentoAccion(8, { ...datos, titulo: "x".repeat(201), descripcion: "y".repeat(1001) });
    expect(resultado).toMatchObject({ exito: false, errores: { titulo: expect.any(String), descripcion: expect.any(String) } });
    expect(actualizarDocumentoTecnicoServidor).not.toHaveBeenCalled();
  });

  it("informa un fallo de la API sin detalles técnicos", async () => {
    actualizarDocumentoTecnicoServidor.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(actualizarDocumentoAccion(8, datos)).resolves.toMatchObject({ exito: false, mensaje: "No se pudo guardar el documento." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
