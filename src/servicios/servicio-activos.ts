import {
  apiActualizarActivo,
  apiCrearActivo,
  apiDesactivarActivo,
  apiListarActivos,
  apiObtenerActivo,
} from "@/servicios/api/api-activos";
import type { ActualizarActivoInput, CrearActivoInput } from "@/tipos/activo";

function validarActivo(input: CrearActivoInput) {
  if (!input.numSerie.trim()) {
    throw new Error("El número de serie es obligatorio.");
  }

  if (input.clienteId <= 0) {
    throw new Error("El cliente es obligatorio.");
  }

  if (input.modeloMaquinaId <= 0) {
    throw new Error("El modelo de máquina es obligatorio.");
  }
}

export async function listarActivos() {
  return apiListarActivos();
}

export async function obtenerDetalleActivo(activoId: number) {
  return apiObtenerActivo(activoId);
}

export async function crearActivo(input: CrearActivoInput) {
  validarActivo(input);
  return apiCrearActivo(input);
}

export async function actualizarActivo(activoId: number, input: ActualizarActivoInput) {
  validarActivo(input);
  return apiActualizarActivo(activoId, input);
}

export async function desactivarActivo(activoId: number) {
  return apiDesactivarActivo(activoId);
}
