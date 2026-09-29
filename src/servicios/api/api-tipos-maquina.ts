import { crearOpcionesJson, leerDatosApi } from "@/servicios/api/solicitudes-http";
import type { ActualizarTipoMaquinaInput, CrearTipoMaquinaInput, TipoMaquina } from "@/tipos/tipo-maquina";

export async function apiListarTiposMaquina() {
  const tiposMaquina = await leerDatosApi("/api/v1/tipos-maquina", { cache: "no-store" }, "No se pudo obtener el listado de tipos de máquina.");
  return tiposMaquina as TipoMaquina[];
}

export async function apiObtenerTipoMaquina(tipoMaquinaId: number) {
  const tipoMaquina = await leerDatosApi("/api/v1/tipos-maquina/" + tipoMaquinaId, { cache: "no-store" }, "No se pudo obtener el tipo de máquina solicitado.");
  return tipoMaquina as TipoMaquina;
}

export async function apiCrearTipoMaquina(tipoMaquina: CrearTipoMaquinaInput) {
  const opciones = crearOpcionesJson("POST", tipoMaquina);
  const tipoMaquinaCreado = await leerDatosApi("/api/v1/tipos-maquina", opciones, "No se pudo crear el tipo de máquina.");
  return tipoMaquinaCreado as TipoMaquina;
}

export async function apiActualizarTipoMaquina(tipoMaquinaId: number, tipoMaquina: ActualizarTipoMaquinaInput) {
  const opciones = crearOpcionesJson("PUT", tipoMaquina);
  const tipoMaquinaActualizado = await leerDatosApi("/api/v1/tipos-maquina/" + tipoMaquinaId, opciones, "No se pudo actualizar el tipo de máquina.");
  return tipoMaquinaActualizado as TipoMaquina;
}

export async function apiDesactivarTipoMaquina(tipoMaquinaId: number) {
  const opciones = crearOpcionesJson("PATCH", { estado: "inactivo" });
  const tipoMaquinaActualizado = await leerDatosApi("/api/v1/tipos-maquina/" + tipoMaquinaId, opciones, "No se pudo dar de baja el tipo de máquina.");
  return tipoMaquinaActualizado as TipoMaquina;
}
