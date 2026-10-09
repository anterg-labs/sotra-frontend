import {
  apiActualizarTipoMaquina,
  apiCrearTipoMaquina,
  apiDesactivarTipoMaquina,
  apiListarTiposMaquina,
  apiListarTiposMaquinaPaginados,
  apiObtenerTipoMaquina,
} from "@/servicios/api/api-tipos-maquina";
import type { ActualizarTipoMaquinaInput, CrearTipoMaquinaInput, FiltrosTiposMaquina } from "@/tipos/tipo-maquina";

function validarTipoMaquina(input: CrearTipoMaquinaInput) {
  if (!input.nombre.trim()) {
    throw new Error("El nombre del tipo de máquina es obligatorio.");
  }
}

export async function listarTiposMaquina() {
  return apiListarTiposMaquina();
}

export async function listarTiposMaquinaPaginados(filtros: FiltrosTiposMaquina) {
  return apiListarTiposMaquinaPaginados(filtros);
}

export async function obtenerDetalleTipoMaquina(tipoMaquinaId: number) {
  return apiObtenerTipoMaquina(tipoMaquinaId);
}

export async function crearTipoMaquina(input: CrearTipoMaquinaInput) {
  validarTipoMaquina(input);
  return apiCrearTipoMaquina(input);
}

export async function actualizarTipoMaquina(tipoMaquinaId: number, input: ActualizarTipoMaquinaInput) {
  validarTipoMaquina(input);
  return apiActualizarTipoMaquina(tipoMaquinaId, input);
}

export async function desactivarTipoMaquina(tipoMaquinaId: number) {
  return apiDesactivarTipoMaquina(tipoMaquinaId);
}
