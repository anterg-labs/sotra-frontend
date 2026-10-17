import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { actualizarActivoAccion, cambiarEstadoActivoAccion, crearActivoAccion } from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  crearActivoServidor: vi.fn(),
  actualizarActivoServidor: vi.fn(),
  cambiarEstadoActivoServidor: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/activos", () => s);

const datos = {
  clienteId: 1, numSerie: "SN-1", descripcion: null, modeloMaquinaId: 2, anioFabricacion: 2020, nombre: "Retro", ubicacion: null,
  estado: "activo" as const,
};
const sinEstado = { clienteId: 1, numSerie: "SN-1", descripcion: null, modeloMaquinaId: 2, anioFabricacion: 2020, nombre: "Retro", ubicacion: null };
const guardado = { id: 9, ...sinEstado, estado: "activo" };

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  revalidatePath.mockReset();
});

describe("acciones de activos", () => {
  it("crea sin el estado, normaliza los opcionales en blanco y revalida", async () => {
    s.crearActivoServidor.mockResolvedValue(guardado);
    await expect(crearActivoAccion({ ...datos, nombre: "  ", ubicacion: "" })).resolves.toEqual({ exito: true, registro: guardado });
    expect(s.crearActivoServidor).toHaveBeenCalledWith({ ...sinEstado, nombre: null });
    expect(revalidatePath).toHaveBeenCalledWith("/activos", "layout");
  });

  it("valida con las mismas reglas del formulario sin llamar a la API", async () => {
    const resultado = await crearActivoAccion({ ...datos, numSerie: " ", clienteId: 0, modeloMaquinaId: 0, anioFabricacion: 1800 });
    expect(resultado).toMatchObject({
      exito: false,
      errores: {
        numSerie: "El campo Número de serie es obligatorio.",
        clienteId: "Debe seleccionar un cliente.",
        modeloMaquinaId: "Debe seleccionar un modelo de máquina.",
        anioFabricacion: expect.stringContaining("entre"),
      },
    });
    expect(s.crearActivoServidor).not.toHaveBeenCalled();
  });

  it("rechaza entradas con forma inválida", async () => {
    await expect(crearActivoAccion({ ...datos, clienteId: "1" } as never)).resolves.toMatchObject({ exito: false });
    await expect(crearActivoAccion({ ...datos, anioFabricacion: "2020" } as never)).resolves.toMatchObject({ exito: false });
    await expect(crearActivoAccion({ ...datos, ubicacion: 5 } as never)).resolves.toMatchObject({ exito: false });
    await expect(actualizarActivoAccion(9, { ...datos, estado: "x" } as never)).resolves.toMatchObject({ exito: false });
    expect(s.crearActivoServidor).not.toHaveBeenCalled();
  });

  it("mapea NUMERO_SERIE_DUPLICADO al número de serie y devuelve el mensaje de otros errores", async () => {
    s.crearActivoServidor.mockRejectedValueOnce(new ErrorDeApi("El número de serie ya está registrado.", "NUMERO_SERIE_DUPLICADO", 409));
    await expect(crearActivoAccion(datos)).resolves.toEqual({
      exito: false, errores: { numSerie: "El número de serie ya está registrado." }, mensaje: "",
    });
    s.crearActivoServidor.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(crearActivoAccion(datos)).resolves.toMatchObject({ mensaje: "No se pudo guardar la información del activo." });
  });

  it("modifica con el estado indicado", async () => {
    s.actualizarActivoServidor.mockResolvedValue(guardado);
    await actualizarActivoAccion(9, { ...datos, estado: "inactivo" });
    expect(s.actualizarActivoServidor).toHaveBeenCalledWith(9, { ...sinEstado, estado: "inactivo" });
  });

  it("da de baja, informa el error y rechaza argumentos inválidos", async () => {
    s.cambiarEstadoActivoServidor.mockResolvedValueOnce(guardado).mockRejectedValueOnce(new Error("x"));
    await expect(cambiarEstadoActivoAccion(9, "inactivo")).resolves.toEqual({ exito: true });
    await expect(cambiarEstadoActivoAccion(9, "inactivo")).resolves.toEqual({
      exito: false, mensaje: "No se pudo dar de baja al activo seleccionado.",
    });
    await expect(cambiarEstadoActivoAccion(0, "inactivo")).resolves.toMatchObject({ exito: false });
    expect(s.cambiarEstadoActivoServidor).toHaveBeenCalledTimes(2);
  });
});
