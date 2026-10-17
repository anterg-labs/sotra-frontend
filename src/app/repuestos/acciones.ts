"use server";

import { revalidatePath } from "next/cache";
import {
  registrarAjusteStockServidor,
  registrarEgresoStockServidor,
  registrarIngresoStockServidor,
} from "@/servicios/servidor/movimientos-stock";
import {
  actualizarRepuestoServidor,
  actualizarStockMinimoServidor,
  cambiarEstadoRepuestoServidor,
  crearRepuestoServidor,
} from "@/servicios/servidor/repuestos";
import { ejecutarCambioEstado, esIdValido, resultadoFallido } from "@/servicios/servidor/resultado-accion";
import type { AjusteStockInput, EgresoStockInput, IngresoStockInput, MovimientoStock } from "@/tipos/movimiento-stock";
import type { ResultadoCambiarEstado, ResultadoGuardar } from "@/tipos/resultado-accion";
import type { CrearRepuestoInput, EstadoRepuesto, Repuesto } from "@/tipos/repuesto";
import {
  obtenerErroresAjusteStock,
  obtenerErroresEgresoStock,
  obtenerErroresIngresoStock,
} from "@/validaciones/movimiento-stock";
import { obtenerErrorStockMinimo, obtenerErroresRepuesto } from "@/validaciones/repuesto";

const MENSAJE_GENERAL = "No se pudo guardar el repuesto.";
const campoPorCodigoDuplicado = { CODIGO_REPUESTO_DUPLICADO: "codigo" };

function revalidarRepuestos() {
  revalidatePath("/repuestos", "layout");
}

/** Una Server Action es un endpoint público: la entrada se revisa como si viniera de cualquier cliente. */
function leerRepuesto(datos: unknown): CrearRepuestoInput | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { codigo, nombre, descripcion, marca, ubicacion, cantidad, cantidadMinima } = datos as Record<string, unknown>;
  if (
    typeof codigo !== "string" ||
    typeof nombre !== "string" ||
    typeof descripcion !== "string" ||
    typeof marca !== "string" ||
    typeof ubicacion !== "string" ||
    typeof cantidad !== "number" ||
    typeof cantidadMinima !== "number"
  ) {
    return null;
  }
  return { codigo, nombre, descripcion, marca, ubicacion, cantidad, cantidadMinima };
}

async function guardarRepuesto(
  datos: unknown,
  guardar: (repuesto: CrearRepuestoInput) => Promise<Repuesto>,
): Promise<ResultadoGuardar<Repuesto>> {
  const entrada = leerRepuesto(datos);
  if (!entrada) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL };

  const errores = obtenerErroresRepuesto(entrada);
  if (Object.keys(errores).length > 0) return { exito: false, errores: errores as Record<string, string>, mensaje: "" };

  try {
    const registro = await guardar(entrada);
    revalidarRepuestos();
    return { exito: true, registro };
  } catch (error) {
    return resultadoFallido(error, campoPorCodigoDuplicado, MENSAJE_GENERAL);
  }
}

export async function crearRepuestoAccion(datos: CrearRepuestoInput) {
  return guardarRepuesto(datos, crearRepuestoServidor);
}

export async function actualizarRepuestoAccion(repuestoId: number, datos: CrearRepuestoInput) {
  if (!esIdValido(repuestoId)) return { exito: false, errores: {}, mensaje: MENSAJE_GENERAL } satisfies ResultadoGuardar<Repuesto>;
  return guardarRepuesto(datos, (repuesto) => actualizarRepuestoServidor(repuestoId, repuesto));
}

export async function cambiarEstadoRepuestoAccion(repuestoId: number, estado: EstadoRepuesto): Promise<ResultadoCambiarEstado> {
  return ejecutarCambioEstado(repuestoId, estado, cambiarEstadoRepuestoServidor, revalidarRepuestos, {
    baja: "No se pudo dar de baja el repuesto seleccionado.",
    reactivacion: "No se pudo reactivar el repuesto seleccionado.",
  });
}

export async function actualizarStockMinimoAccion(repuestoId: number, cantidadMinima: number): Promise<ResultadoGuardar<Repuesto>> {
  const mensaje = "No se pudo actualizar el stock mínimo.";
  if (!esIdValido(repuestoId) || typeof cantidadMinima !== "number") return { exito: false, errores: {}, mensaje };
  const error = obtenerErrorStockMinimo(cantidadMinima);
  if (error) return { exito: false, errores: { cantidadMinima: error }, mensaje: "" };

  try {
    const registro = await actualizarStockMinimoServidor(repuestoId, cantidadMinima);
    revalidarRepuestos();
    return { exito: true, registro };
  } catch (excepcion) {
    return resultadoFallido(excepcion, {}, mensaje);
  }
}

type DatosMovimiento = Record<string, unknown>;

function leerDatos(datos: unknown): DatosMovimiento | null {
  return typeof datos === "object" && datos !== null ? (datos as DatosMovimiento) : null;
}

async function registrarMovimiento(
  repuestoId: unknown,
  errores: Record<string, string | undefined>,
  mensaje: string,
  registrar: () => Promise<MovimientoStock>,
): Promise<ResultadoGuardar<MovimientoStock>> {
  if (!esIdValido(repuestoId)) return { exito: false, errores: {}, mensaje };
  const conError = Object.fromEntries(Object.entries(errores).filter((par): par is [string, string] => Boolean(par[1])));
  if (Object.keys(conError).length > 0) return { exito: false, errores: conError, mensaje: "" };

  try {
    const registro = await registrar();
    revalidarRepuestos();
    return { exito: true, registro };
  } catch (excepcion) {
    return resultadoFallido(excepcion, {}, mensaje);
  }
}

export async function registrarIngresoStockAccion(repuestoId: number, datos: IngresoStockInput) {
  const mensaje = "No se pudo registrar el ingreso de stock.";
  const d = leerDatos(datos);
  if (!d || typeof d.cantidad !== "number" || typeof d.fecha !== "string" || typeof d.motivo !== "string" || typeof d.ubicacion !== "string") {
    return { exito: false, errores: {}, mensaje } satisfies ResultadoGuardar<MovimientoStock>;
  }
  const ingreso: IngresoStockInput = {
    cantidad: d.cantidad,
    fecha: d.fecha,
    motivo: d.motivo,
    ubicacion: d.ubicacion,
    observaciones: typeof d.observaciones === "string" ? d.observaciones : "",
  };
  return registrarMovimiento(repuestoId, obtenerErroresIngresoStock(ingreso), mensaje, () =>
    registrarIngresoStockServidor(repuestoId, ingreso),
  );
}

export async function registrarEgresoStockAccion(repuestoId: number, datos: EgresoStockInput) {
  const mensaje = "No se pudo registrar el egreso de stock.";
  const d = leerDatos(datos);
  if (!d || typeof d.cantidad !== "number" || typeof d.motivo !== "string") {
    return { exito: false, errores: {}, mensaje } satisfies ResultadoGuardar<MovimientoStock>;
  }
  const egreso: EgresoStockInput = {
    cantidad: d.cantidad,
    motivo: d.motivo,
    observaciones: typeof d.observaciones === "string" ? d.observaciones : "",
  };
  // El stock disponible lo valida la API; aquí solo la forma de los datos.
  return registrarMovimiento(repuestoId, obtenerErroresEgresoStock(egreso, Number.MAX_SAFE_INTEGER), mensaje, () =>
    registrarEgresoStockServidor(repuestoId, egreso),
  );
}

export async function registrarAjusteStockAccion(repuestoId: number, datos: AjusteStockInput) {
  const mensaje = "No se pudo registrar el ajuste de stock.";
  const d = leerDatos(datos);
  if (!d || typeof d.cantidadReal !== "number" || typeof d.motivo !== "string") {
    return { exito: false, errores: {}, mensaje } satisfies ResultadoGuardar<MovimientoStock>;
  }
  const ajuste: AjusteStockInput = {
    cantidadReal: d.cantidadReal,
    motivo: d.motivo,
    observaciones: typeof d.observaciones === "string" ? d.observaciones : "",
  };
  return registrarMovimiento(repuestoId, obtenerErroresAjusteStock(ajuste), mensaje, () =>
    registrarAjusteStockServidor(repuestoId, ajuste),
  );
}
