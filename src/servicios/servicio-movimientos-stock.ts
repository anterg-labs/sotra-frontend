import {
  apiListarMovimientosStock,
  apiObtenerMovimientoStock,
  apiRegistrarIngresoStock,
} from "@/servicios/api/api-movimientos-stock";
import { obtenerFechaDeHoy } from "@/servicios/servicio-evidencias";
import type { FiltrosMovimientosStock, IngresoStockInput } from "@/tipos/movimiento-stock";

const etiquetasTipoMovimiento: Record<string, string> = {
  ingreso: "Ingreso",
  egreso: "Egreso",
  ajuste: "Ajuste",
};

export function obtenerEtiquetaTipoMovimiento(tipo: string) {
  return etiquetasTipoMovimiento[tipo];
}

export async function listarMovimientosStock(filtros: FiltrosMovimientosStock) {
  return apiListarMovimientosStock(filtros);
}

export async function obtenerDetalleMovimientoStock(movimientoId: number) {
  return apiObtenerMovimientoStock(movimientoId);
}

export async function registrarIngresoStock(repuestoId: number, ingreso: IngresoStockInput) {
  if (!Number.isInteger(ingreso.cantidad) || ingreso.cantidad <= 0) {
    throw new Error("La cantidad a ingresar debe ser un número entero mayor a cero.");
  }

  if (ingreso.fecha === "") {
    throw new Error("Indicá la fecha del ingreso.");
  }

  if (ingreso.fecha > obtenerFechaDeHoy()) {
    throw new Error("La fecha del ingreso no puede ser futura.");
  }

  if (ingreso.motivo.trim() === "") {
    throw new Error("Indicá el motivo del ingreso.");
  }

  if (ingreso.ubicacion.trim() === "") {
    throw new Error("Indicá la ubicación o depósito.");
  }

  return apiRegistrarIngresoStock(repuestoId, ingreso);
}
