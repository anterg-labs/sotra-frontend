import {
  apiActualizarModeloMaquina,
  apiCrearModeloMaquina,
  apiDesactivarModeloMaquina,
  apiListarModelosMaquina,
  apiObtenerModeloMaquina,
} from "@/servicios/cliente-api";
import type { ActualizarModeloMaquinaInput, CrearModeloMaquinaInput } from "@/tipos/modelo-maquina";

function validarModeloMaquina(input: CrearModeloMaquinaInput) {
  if (!input.nombre.trim()) {
    throw new Error("El nombre del modelo es obligatorio.");
  }

  if (input.tipoMaquinaId <= 0) {
    throw new Error("El tipo de máquina es obligatorio.");
  }
}

export async function listarModelosMaquina() {
  return apiListarModelosMaquina();
}

export async function obtenerDetalleModeloMaquina(modeloMaquinaId: number) {
  return apiObtenerModeloMaquina(modeloMaquinaId);
}

export async function crearModeloMaquina(input: CrearModeloMaquinaInput) {
  validarModeloMaquina(input);
  return apiCrearModeloMaquina(input);
}

export async function actualizarModeloMaquina(modeloMaquinaId: number, input: ActualizarModeloMaquinaInput) {
  validarModeloMaquina(input);
  return apiActualizarModeloMaquina(modeloMaquinaId, input);
}

export async function desactivarModeloMaquina(modeloMaquinaId: number) {
  return apiDesactivarModeloMaquina(modeloMaquinaId);
}
