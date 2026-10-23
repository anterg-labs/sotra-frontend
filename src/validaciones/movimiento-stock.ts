import type { AjusteStockInput, EgresoStockInput, IngresoStockInput } from "@/tipos/movimiento-stock";

const etiquetasTipoMovimiento: Record<string, string> = {
  ingreso: "Ingreso",
  egreso: "Egreso",
  ajuste: "Ajuste",
};

export function obtenerEtiquetaTipoMovimiento(tipo: string) {
  return etiquetasTipoMovimiento[tipo];
}

export function obtenerErroresIngresoStock(ingreso: IngresoStockInput) {
  const errores: Partial<Record<"cantidad", string>> = {};
  if (!Number.isInteger(ingreso.cantidad) || ingreso.cantidad <= 0) {
    errores.cantidad = "La cantidad a ingresar debe ser un número entero mayor a cero.";
  }
  return errores;
}

export function obtenerErroresEgresoStock(egreso: EgresoStockInput, stockDisponible: number) {
  const errores: Partial<Record<"cantidad" | "motivo", string>> = {};
  if (!Number.isInteger(egreso.cantidad) || egreso.cantidad <= 0) {
    errores.cantidad = "La cantidad a retirar debe ser un número entero mayor a cero.";
  } else if (egreso.cantidad > stockDisponible) {
    errores.cantidad = "No hay stock suficiente: disponible " + stockDisponible + ".";
  }
  if (egreso.motivo.trim() === "") {
    errores.motivo = "Indicá el motivo del egreso.";
  }
  return errores;
}

export function obtenerErroresAjusteStock(ajuste: AjusteStockInput) {
  const errores: Partial<Record<"cantidadReal" | "motivo", string>> = {};
  if (!Number.isInteger(ajuste.cantidadReal) || ajuste.cantidadReal < 0) {
    errores.cantidadReal = "El stock real debe ser un número entero mayor o igual a cero.";
  }
  if (ajuste.motivo.trim() === "") {
    errores.motivo = "Indicá el motivo del ajuste.";
  }
  return errores;
}
