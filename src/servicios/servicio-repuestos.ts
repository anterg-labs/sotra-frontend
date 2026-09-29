import {
  apiActualizarRepuesto,
  apiCrearRepuesto,
  apiDesactivarRepuesto,
  apiListarRepuestos,
  apiObtenerRepuesto,
} from "@/servicios/api/api-repuestos";
import type { ActualizarRepuestoInput, CrearRepuestoInput } from "@/tipos/repuesto";

function validarRepuesto(input: CrearRepuestoInput) {
  if (!input.codigo.trim()) {
    throw new Error("El código del repuesto es obligatorio.");
  }

  if (!input.nombre.trim()) {
    throw new Error("El nombre del repuesto es obligatorio.");
  }

  if (!Number.isInteger(input.cantidad) || input.cantidad < 0) {
    throw new Error("La cantidad debe ser un número entero mayor o igual a cero.");
  }

  if (!Number.isInteger(input.cantidadMinima) || input.cantidadMinima < 0) {
    throw new Error("La cantidad mínima debe ser un número entero mayor o igual a cero.");
  }
}

export async function listarRepuestos() {
  return apiListarRepuestos();
}

export async function obtenerDetalleRepuesto(repuestoId: number) {
  return apiObtenerRepuesto(repuestoId);
}

export async function crearRepuesto(input: CrearRepuestoInput) {
  validarRepuesto(input);
  return apiCrearRepuesto(input);
}

export async function actualizarRepuesto(repuestoId: number, input: ActualizarRepuestoInput) {
  validarRepuesto(input);
  return apiActualizarRepuesto(repuestoId, input);
}

export async function desactivarRepuesto(repuestoId: number) {
  return apiDesactivarRepuesto(repuestoId);
}
