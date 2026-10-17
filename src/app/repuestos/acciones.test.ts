import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorDeApi } from "@/servicios/api/solicitudes-http";
import { obtenerFechaDeHoy } from "@/validaciones/fecha";
import {
  actualizarRepuestoAccion,
  actualizarStockMinimoAccion,
  cambiarEstadoRepuestoAccion,
  crearRepuestoAccion,
  registrarAjusteStockAccion,
  registrarEgresoStockAccion,
  registrarIngresoStockAccion,
} from "./acciones";

const revalidatePath = vi.hoisted(() => vi.fn());
const r = vi.hoisted(() => ({
  crearRepuestoServidor: vi.fn(),
  actualizarRepuestoServidor: vi.fn(),
  cambiarEstadoRepuestoServidor: vi.fn(),
  actualizarStockMinimoServidor: vi.fn(),
}));
const m = vi.hoisted(() => ({
  registrarIngresoStockServidor: vi.fn(),
  registrarEgresoStockServidor: vi.fn(),
  registrarAjusteStockServidor: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/servicios/servidor/repuestos", () => r);
vi.mock("@/servicios/servidor/movimientos-stock", () => m);

const datos = { codigo: "R-1", nombre: "Filtro", descripcion: "", marca: "", ubicacion: "", cantidad: 3, cantidadMinima: 1 };
const guardado = { id: 5, ...datos, estado: "activo", estadoStock: "normal" };
const movimiento = { id: 9, tipo: "ingreso" };

beforeEach(() => {
  [...Object.values(r), ...Object.values(m), revalidatePath].forEach((f) => f.mockReset());
});

describe("acciones de repuestos", () => {
  it("crea el repuesto y revalida /repuestos", async () => {
    r.crearRepuestoServidor.mockResolvedValue(guardado);
    await expect(crearRepuestoAccion(datos)).resolves.toEqual({ exito: true, registro: guardado });
    expect(r.crearRepuestoServidor).toHaveBeenCalledWith(datos);
    expect(revalidatePath).toHaveBeenCalledWith("/repuestos", "layout");
  });

  it("valida en el servidor sin llamar a la API y rechaza formas inválidas", async () => {
    const resultado = await crearRepuestoAccion({ ...datos, codigo: " ", cantidad: -1, cantidadMinima: Number.NaN });
    expect(resultado).toMatchObject({
      exito: false,
      errores: { codigo: expect.any(String), cantidad: expect.any(String), cantidadMinima: expect.any(String) },
    });
    await expect(crearRepuestoAccion({ ...datos, cantidad: "3" } as never)).resolves.toMatchObject({ exito: false, mensaje: "No se pudo guardar el repuesto." });
    await expect(crearRepuestoAccion(null as never)).resolves.toMatchObject({ exito: false });
    expect(r.crearRepuestoServidor).not.toHaveBeenCalled();
  });

  it("mapea CODIGO_REPUESTO_DUPLICADO al código y devuelve otros mensajes", async () => {
    r.crearRepuestoServidor.mockRejectedValueOnce(new ErrorDeApi("El código ya existe.", "CODIGO_REPUESTO_DUPLICADO", 409));
    await expect(crearRepuestoAccion(datos)).resolves.toEqual({ exito: false, errores: { codigo: "El código ya existe." }, mensaje: "" });
    r.crearRepuestoServidor.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    await expect(crearRepuestoAccion(datos)).resolves.toMatchObject({ mensaje: "No se pudo guardar el repuesto." });
  });

  it("modifica el repuesto indicado y rechaza ids inválidos", async () => {
    r.actualizarRepuestoServidor.mockResolvedValue(guardado);
    await expect(actualizarRepuestoAccion(5, datos)).resolves.toMatchObject({ exito: true });
    expect(r.actualizarRepuestoServidor).toHaveBeenCalledWith(5, datos);
    await expect(actualizarRepuestoAccion(0, datos)).resolves.toMatchObject({ exito: false });
  });

  it("da de baja y reactiva, informa errores y rechaza argumentos inválidos", async () => {
    r.cambiarEstadoRepuestoServidor.mockResolvedValueOnce(guardado).mockRejectedValueOnce(new Error("x"));
    await expect(cambiarEstadoRepuestoAccion(5, "inactivo")).resolves.toEqual({ exito: true });
    await expect(cambiarEstadoRepuestoAccion(5, "activo")).resolves.toEqual({
      exito: false, mensaje: "No se pudo reactivar el repuesto seleccionado.",
    });
    await expect(cambiarEstadoRepuestoAccion(5, "x" as never)).resolves.toMatchObject({ exito: false });
    expect(r.cambiarEstadoRepuestoServidor).toHaveBeenCalledTimes(2);
  });

  it("actualiza el stock mínimo validando el valor", async () => {
    r.actualizarStockMinimoServidor.mockResolvedValue(guardado);
    await expect(actualizarStockMinimoAccion(5, 4)).resolves.toEqual({ exito: true, registro: guardado });
    expect(r.actualizarStockMinimoServidor).toHaveBeenCalledWith(5, 4);
    await expect(actualizarStockMinimoAccion(5, -1)).resolves.toMatchObject({ exito: false, errores: { cantidadMinima: expect.any(String) } });
    await expect(actualizarStockMinimoAccion(5, "1" as never)).resolves.toMatchObject({ exito: false });
    expect(r.actualizarStockMinimoServidor).toHaveBeenCalledTimes(1);
  });
});

describe("acciones de movimientos de stock", () => {
  const hoy = obtenerFechaDeHoy();

  it("registra un ingreso válido y revalida", async () => {
    m.registrarIngresoStockServidor.mockResolvedValue(movimiento);
    const ingreso = { cantidad: 4, fecha: hoy, motivo: "Compra", ubicacion: "A1", observaciones: "" };
    await expect(registrarIngresoStockAccion(5, ingreso)).resolves.toEqual({ exito: true, registro: movimiento });
    expect(m.registrarIngresoStockServidor).toHaveBeenCalledWith(5, ingreso);
    expect(revalidatePath).toHaveBeenCalledWith("/repuestos", "layout");
  });

  it("valida el ingreso por campo y rechaza datos mal formados", async () => {
    const resultado = await registrarIngresoStockAccion(5, { cantidad: 0, fecha: "", motivo: " ", ubicacion: "", observaciones: "" });
    expect(resultado).toMatchObject({ exito: false, errores: { cantidad: expect.any(String), fecha: expect.any(String), motivo: expect.any(String), ubicacion: expect.any(String) } });
    await expect(registrarIngresoStockAccion(5, { cantidad: "1" } as never)).resolves.toMatchObject({ exito: false });
    await expect(registrarIngresoStockAccion(0, { cantidad: 1, fecha: hoy, motivo: "x", ubicacion: "y", observaciones: "" })).resolves.toMatchObject({ exito: false });
    expect(m.registrarIngresoStockServidor).not.toHaveBeenCalled();
  });

  it("registra egresos y ajustes; el stock disponible lo valida la API", async () => {
    m.registrarEgresoStockServidor.mockResolvedValue({ ...movimiento, tipo: "egreso" });
    m.registrarAjusteStockServidor.mockResolvedValue({ ...movimiento, tipo: "ajuste" });
    await expect(registrarEgresoStockAccion(5, { cantidad: 2, motivo: "Entrega" })).resolves.toMatchObject({ exito: true });
    expect(m.registrarEgresoStockServidor).toHaveBeenCalledWith(5, { cantidad: 2, motivo: "Entrega", observaciones: "" });
    await expect(registrarAjusteStockAccion(5, { cantidadReal: 7, motivo: "Conteo" })).resolves.toMatchObject({ exito: true });
    expect(m.registrarAjusteStockServidor).toHaveBeenCalledWith(5, { cantidadReal: 7, motivo: "Conteo", observaciones: "" });

    await expect(registrarEgresoStockAccion(5, { cantidad: 0, motivo: "" })).resolves.toMatchObject({ errores: { cantidad: expect.any(String), motivo: expect.any(String) } });
    await expect(registrarAjusteStockAccion(5, { cantidadReal: -1, motivo: "" })).resolves.toMatchObject({ errores: { cantidadReal: expect.any(String), motivo: expect.any(String) } });
  });

  it("devuelve el mensaje de la API cuando no hay stock suficiente", async () => {
    m.registrarEgresoStockServidor.mockRejectedValue(new ErrorDeApi("No hay stock suficiente.", "STOCK_INSUFICIENTE", 409));
    await expect(registrarEgresoStockAccion(5, { cantidad: 99, motivo: "x" })).resolves.toEqual({
      exito: false, errores: {}, mensaje: "No hay stock suficiente.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
