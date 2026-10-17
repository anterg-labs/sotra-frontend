import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { actualizarModeloMaquinaAccion, cambiarEstadoModeloMaquinaAccion, crearModeloMaquinaAccion } from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  crearModeloMaquinaServidor: vi.fn(),
  actualizarModeloMaquinaServidor: vi.fn(),
  cambiarEstadoModeloMaquinaServidor: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/modelos-maquina", () => s);

const datos = { nombre: "CAT 320", tipoMaquinaId: 3, descripcion: null, estado: "activo" as const };
const guardado = { id: 8, nombre: "CAT 320", tipoMaquinaId: 3, descripcion: null, estado: "activo" };

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  revalidatePath.mockReset();
});

describe("acciones de modelos de máquina", () => {
  it("crea sin el estado, normaliza la descripción en blanco y revalida", async () => {
    s.crearModeloMaquinaServidor.mockResolvedValue(guardado);
    await expect(crearModeloMaquinaAccion({ ...datos, descripcion: "   " })).resolves.toEqual({ exito: true, registro: guardado });
    expect(s.crearModeloMaquinaServidor).toHaveBeenCalledWith({ nombre: "CAT 320", tipoMaquinaId: 3, descripcion: null });
    expect(revalidatePath).toHaveBeenCalledWith("/activos", "layout");
  });

  it("valida nombre y tipo sin llamar a la API", async () => {
    const resultado = await crearModeloMaquinaAccion({ ...datos, nombre: "", tipoMaquinaId: 0 });
    expect(resultado).toMatchObject({
      exito: false,
      errores: { nombre: "El campo Nombre es obligatorio.", tipoMaquinaId: "Debe seleccionar un tipo de máquina." },
    });
    expect(s.crearModeloMaquinaServidor).not.toHaveBeenCalled();
  });

  it("rechaza entradas con forma inválida", async () => {
    await expect(crearModeloMaquinaAccion({ ...datos, tipoMaquinaId: "3" } as never)).resolves.toMatchObject({ exito: false });
    await expect(crearModeloMaquinaAccion({ ...datos, descripcion: 5 } as never)).resolves.toMatchObject({ exito: false });
    await expect(actualizarModeloMaquinaAccion(8, { ...datos, estado: "x" } as never)).resolves.toMatchObject({ exito: false });
    expect(s.crearModeloMaquinaServidor).not.toHaveBeenCalled();
  });

  it("mapea MODELO_DUPLICADO al nombre y devuelve el mensaje de otros errores", async () => {
    s.crearModeloMaquinaServidor.mockRejectedValueOnce(new ErrorDeApi("Ya existe un modelo con ese nombre.", "MODELO_DUPLICADO", 409));
    await expect(crearModeloMaquinaAccion(datos)).resolves.toEqual({
      exito: false, errores: { nombre: "Ya existe un modelo con ese nombre." }, mensaje: "",
    });
    s.crearModeloMaquinaServidor.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(crearModeloMaquinaAccion(datos)).resolves.toMatchObject({ mensaje: "No se pudo guardar el modelo de máquina." });
  });

  it("modifica con el estado indicado", async () => {
    s.actualizarModeloMaquinaServidor.mockResolvedValue(guardado);
    await actualizarModeloMaquinaAccion(8, { ...datos, estado: "inactivo" });
    expect(s.actualizarModeloMaquinaServidor).toHaveBeenCalledWith(8, {
      nombre: "CAT 320", tipoMaquinaId: 3, descripcion: null, estado: "inactivo",
    });
  });

  it("da de baja, informa el error y rechaza argumentos inválidos", async () => {
    s.cambiarEstadoModeloMaquinaServidor.mockResolvedValueOnce(guardado).mockRejectedValueOnce(new Error("x"));
    await expect(cambiarEstadoModeloMaquinaAccion(8, "inactivo")).resolves.toEqual({ exito: true });
    await expect(cambiarEstadoModeloMaquinaAccion(8, "inactivo")).resolves.toEqual({
      exito: false, mensaje: "No se pudo dar de baja el modelo de máquina seleccionado.",
    });
    await expect(cambiarEstadoModeloMaquinaAccion(0, "inactivo")).resolves.toMatchObject({ exito: false });
    expect(s.cambiarEstadoModeloMaquinaServidor).toHaveBeenCalledTimes(2);
  });
});
