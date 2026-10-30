import type { CrearRepuestoInput } from "@/tipos/repuesto";

export function obtenerErroresRepuesto(input: CrearRepuestoInput) {
  const errores: Partial<Record<"codigo" | "nombre" | "marca" | "ubicacion" | "categoria" | "modeloCompatibilidad" | "unidadMedida" | "observaciones" | "cantidad" | "cantidadMinima", string>> = {};
  if (!input.codigo.trim()) errores.codigo = "El código del repuesto es obligatorio.";
  else if (input.codigo.length > 50) errores.codigo = "El código no puede superar los 50 caracteres.";
  if (!input.nombre.trim()) errores.nombre = "El nombre del repuesto es obligatorio.";
  else if (input.nombre.length > 120) errores.nombre = "El nombre no puede superar los 120 caracteres.";
  if ((input.marca?.length ?? 0) > 100) errores.marca = "La marca no puede superar los 100 caracteres.";
  if ((input.ubicacion?.length ?? 0) > 120) errores.ubicacion = "La ubicación no puede superar los 120 caracteres.";
  if ((input.categoria?.length ?? 0) > 80) errores.categoria = "La categoría no puede superar los 80 caracteres.";
  if ((input.modeloCompatibilidad?.length ?? 0) > 120) {
    errores.modeloCompatibilidad = "El modelo o la compatibilidad no puede superar los 120 caracteres.";
  }
  if ((input.unidadMedida?.length ?? 0) > 30) errores.unidadMedida = "La unidad de medida no puede superar los 30 caracteres.";
  if ((input.observaciones?.length ?? 0) > 2000) errores.observaciones = "Las observaciones no pueden superar los 2000 caracteres.";
  if (!Number.isInteger(input.cantidad) || input.cantidad < 0) {
    errores.cantidad = "La cantidad debe ser un número entero mayor o igual a cero.";
  }
  if (!Number.isInteger(input.cantidadMinima) || input.cantidadMinima < 0) {
    errores.cantidadMinima = "La cantidad mínima debe ser un número entero mayor o igual a cero.";
  }
  return errores;
}

export function obtenerErrorStockMinimo(cantidadMinima: number) {
  if (!Number.isInteger(cantidadMinima) || cantidadMinima < 0) {
    return "El stock mínimo debe ser un número entero mayor o igual a cero.";
  }
  return "";
}
