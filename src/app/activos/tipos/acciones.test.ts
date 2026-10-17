import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { actualizarTipoMaquinaAccion, cambiarEstadoTipoMaquinaAccion, crearTipoMaquinaAccion } from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  crearTipoMaquinaServidor: vi.fn(),
  actualizarTipoMaquinaServidor: vi.fn(),
  cambiarEstadoTipoMaquinaServidor: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/tipos-maquina", () => s);

const guardado = { id: 4, nombre: "Grúa", estado: "activo" };

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  revalidatePath.mockReset();
});

describe("acciones de tipos de máquina", () => {
  it("crea solo con el nombre, revalida y devuelve el registro", async () => {
    s.crearTipoMaquinaServidor.mockResolvedValue(guardado);
    await expect(crearTipoMaquinaAccion({ nombre: "Grúa", estado: "activo" })).resolves.toEqual({ exito: true, registro: guardado });
    expect(s.crearTipoMaquinaServidor).toHaveBeenCalledWith({ nombre: "Grúa" });
    expect(revalidatePath).toHaveBeenCalledWith("/activos", "layout");
  });

  it("valida nombre vacío o demasiado largo sin llamar a la API", async () => {
    const vacio = await crearTipoMaquinaAccion({ nombre: "  ", estado: "activo" });
    expect(vacio).toMatchObject({ exito: false, errores: { nombre: "El campo Nombre es obligatorio." } });
    const largo = await crearTipoMaquinaAccion({ nombre: "x".repeat(61), estado: "activo" });
    expect(largo).toMatchObject({ exito: false, errores: { nombre: expect.stringContaining("60") } });
    expect(s.crearTipoMaquinaServidor).not.toHaveBeenCalled();
  });

  it("rechaza entradas con forma inválida", async () => {
    await expect(crearTipoMaquinaAccion({ nombre: 5 } as never)).resolves.toMatchObject({ exito: false });
    await expect(crearTipoMaquinaAccion(null as never)).resolves.toMatchObject({ exito: false });
    await expect(actualizarTipoMaquinaAccion(4, { nombre: "Grúa", estado: "borrado" } as never)).resolves.toMatchObject({ exito: false });
    expect(s.crearTipoMaquinaServidor).not.toHaveBeenCalled();
  });

  it("mapea TIPO_MAQUINA_DUPLICADO al nombre y devuelve mensajes generales ante otros errores", async () => {
    s.crearTipoMaquinaServidor.mockRejectedValueOnce(new ErrorDeApi("Ya existe un tipo de máquina con ese nombre.", "TIPO_MAQUINA_DUPLICADO", 409));
    await expect(crearTipoMaquinaAccion({ nombre: "Grúa", estado: "activo" })).resolves.toEqual({
      exito: false, errores: { nombre: "Ya existe un tipo de máquina con ese nombre." }, mensaje: "",
    });
    s.crearTipoMaquinaServidor.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(crearTipoMaquinaAccion({ nombre: "Grúa", estado: "activo" })).resolves.toMatchObject({
      mensaje: "No se pudo guardar el tipo de máquina.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("modifica con el nombre y el estado indicados", async () => {
    s.actualizarTipoMaquinaServidor.mockResolvedValue(guardado);
    await actualizarTipoMaquinaAccion(4, { nombre: "Grúa XL", estado: "inactivo" });
    expect(s.actualizarTipoMaquinaServidor).toHaveBeenCalledWith(4, { nombre: "Grúa XL", estado: "inactivo" });
  });

  it("da de baja, informa el error y rechaza argumentos inválidos", async () => {
    s.cambiarEstadoTipoMaquinaServidor.mockResolvedValueOnce(guardado).mockRejectedValueOnce(new Error("x"));
    await expect(cambiarEstadoTipoMaquinaAccion(4, "inactivo")).resolves.toEqual({ exito: true });
    await expect(cambiarEstadoTipoMaquinaAccion(4, "inactivo")).resolves.toEqual({
      exito: false, mensaje: "No se pudo dar de baja el tipo de máquina seleccionado.",
    });
    await expect(cambiarEstadoTipoMaquinaAccion(-4, "inactivo")).resolves.toMatchObject({ exito: false });
    expect(s.cambiarEstadoTipoMaquinaServidor).toHaveBeenCalledTimes(2);
  });
});
