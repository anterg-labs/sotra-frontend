import {
  apiActualizarActivo,
  apiCrearActivo,
  apiDesactivarActivo,
  apiListarActivos,
  apiObtenerActivo,
} from "@/servicios/cliente-api";
import type { ActualizarActivoInput, CrearActivoInput } from "@/tipos/activo";

function validarActivo(input: CrearActivoInput) {
  if (!input.nombre.trim()) {
    throw new Error("El nombre del activo es obligatorio.");
  }

  if (!input.numeroSerie.trim()) {
    throw new Error("El número de serie es obligatorio.");
  }

  if (input.clienteId <= 0) {
    throw new Error("El cliente es obligatorio.");
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
