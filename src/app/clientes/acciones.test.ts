import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { actualizarClienteAccion, cambiarEstadoClienteAccion, crearClienteAccion } from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const s = vi.hoisted(() => ({
  crearClienteServidor: vi.fn(),
  actualizarClienteServidor: vi.fn(),
  cambiarEstadoClienteServidor: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/clientes", () => s);

const datos = { razonSocial: "ACME", nombreContacto: "Luis", correo: null, telefono: null, direccion: null, observaciones: null };
const guardado = { id: 7, ...datos, cantidadActivosAsociados: 0, estado: "activo", creadoEn: "2026-01-01T00:00:00Z" };

beforeEach(() => {
  Object.values(s).forEach((f) => f.mockReset());
  revalidatePath.mockReset();
});

describe("acciones de alta y modificación de clientes", () => {
  it("rechaza una edición incompleta sin convertir un opcional omitido en null", async () => {
    const { direccion: omitida, ...incompleto } = datos;
    void omitida;
    await expect(actualizarClienteAccion(7, incompleto as never)).resolves.toMatchObject({ exito: false });
    expect(s.actualizarClienteServidor).not.toHaveBeenCalled();
  });

  it("crea el cliente, revalida el listado y devuelve el cliente guardado", async () => {
    s.crearClienteServidor.mockResolvedValue(guardado);
    await expect(crearClienteAccion(datos)).resolves.toEqual({ exito: true, registro: guardado });
    expect(s.crearClienteServidor).toHaveBeenCalledWith(datos);
    expect(revalidatePath).toHaveBeenCalledWith("/clientes", "layout");
  });

  it("normaliza los opcionales en blanco a null antes de llamar a la API", async () => {
    s.crearClienteServidor.mockResolvedValue(guardado);
    await crearClienteAccion({ ...datos, correo: "  ", telefono: "", direccion: " ", observaciones: "" });
    expect(s.crearClienteServidor).toHaveBeenCalledWith(datos);
  });

  it("modifica el cliente indicado", async () => {
    s.actualizarClienteServidor.mockResolvedValue(guardado);
    await expect(actualizarClienteAccion(7, datos)).resolves.toMatchObject({ exito: true });
    expect(s.actualizarClienteServidor).toHaveBeenCalledWith(7, datos);
  });

  it("valida en el servidor con las mismas reglas y no llama a la API", async () => {
    const resultado = await crearClienteAccion({ ...datos, razonSocial: " ", correo: "mal" });
    expect(resultado).toMatchObject({ exito: false, errores: { razonSocial: expect.any(String), correo: expect.any(String) } });
    expect(s.crearClienteServidor).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rechaza entradas con forma inválida (la acción es un endpoint público)", async () => {
    const resultado = await crearClienteAccion({ ...datos, razonSocial: 5 } as never);
    expect(resultado).toEqual({ exito: false, errores: {}, mensaje: "No se pudo guardar la información del cliente." });
    await expect(crearClienteAccion(null as never)).resolves.toMatchObject({ exito: false });
    expect(s.crearClienteServidor).not.toHaveBeenCalled();
  });

  it.each([
    ["RAZON_SOCIAL_DUPLICADA", "razonSocial"],
    ["NOMBRE_CONTACTO_DUPLICADO", "nombreContacto"],
    ["CORREO_DUPLICADO", "correo"],
    ["TELEFONO_DUPLICADO", "telefono"],
  ])("mapea %s al campo %s", async (codigo, campo) => {
    s.crearClienteServidor.mockRejectedValue(new ErrorDeApi("Ya está registrado.", codigo, 409));
    await expect(crearClienteAccion(datos)).resolves.toEqual({ exito: false, errores: { [campo]: "Ya está registrado." }, mensaje: "" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("devuelve el mensaje de otros errores de la API y uno genérico ante fallos inesperados", async () => {
    s.crearClienteServidor.mockRejectedValueOnce(new ErrorDeApi("No se pudo crear el cliente.", null, 500));
    await expect(crearClienteAccion(datos)).resolves.toEqual({ exito: false, errores: {}, mensaje: "No se pudo crear el cliente." });
    s.crearClienteServidor.mockRejectedValueOnce(new Error("ECONNREFUSED 10.0.0.1"));
    await expect(crearClienteAccion(datos)).resolves.toEqual({
      exito: false, errores: {}, mensaje: "No se pudo guardar la información del cliente.",
    });
  });
});

describe("acción de baja y reactivación", () => {
  it("cambia el estado y revalida", async () => {
    s.cambiarEstadoClienteServidor.mockResolvedValue(guardado);
    await expect(cambiarEstadoClienteAccion(7, "inactivo")).resolves.toEqual({ exito: true });
    expect(s.cambiarEstadoClienteServidor).toHaveBeenCalledWith(7, "inactivo");
    expect(revalidatePath).toHaveBeenCalledWith("/clientes", "layout");
  });

  it("informa el error con el mensaje de cada operación", async () => {
    s.cambiarEstadoClienteServidor.mockRejectedValue(new Error("boom"));
    await expect(cambiarEstadoClienteAccion(7, "inactivo")).resolves.toEqual({
      exito: false, mensaje: "No se pudo dar de baja al cliente seleccionado.",
    });
    await expect(cambiarEstadoClienteAccion(7, "activo")).resolves.toEqual({
      exito: false, mensaje: "No se pudo reactivar al cliente seleccionado.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rechaza ids y estados inválidos sin llamar a la API", async () => {
    await expect(cambiarEstadoClienteAccion(-1, "inactivo")).resolves.toMatchObject({ exito: false });
    await expect(cambiarEstadoClienteAccion(1.5, "activo")).resolves.toMatchObject({ exito: false });
    await expect(cambiarEstadoClienteAccion(1, "borrado" as never)).resolves.toMatchObject({ exito: false });
    expect(s.cambiarEstadoClienteServidor).not.toHaveBeenCalled();
  });
});
