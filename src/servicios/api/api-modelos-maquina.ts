import { crearOpcionesJson, leerDatosApi } from "@/servicios/api/solicitudes-http";
import type {
  ActualizarModeloMaquinaInput,
  CrearModeloMaquinaInput,
  ModeloMaquina,
} from "@/tipos/modelo-maquina";

export async function apiListarModelosMaquina() {
  const modelosMaquina = await leerDatosApi("/api/v1/modelos-maquina", { cache: "no-store" }, "No se pudo obtener el listado de modelos de máquina.");
  return modelosMaquina as ModeloMaquina[];
}

export async function apiObtenerModeloMaquina(modeloMaquinaId: number) {
  const modeloMaquina = await leerDatosApi("/api/v1/modelos-maquina/" + modeloMaquinaId, { cache: "no-store" }, "No se pudo obtener el modelo de máquina solicitado.");
  return modeloMaquina as ModeloMaquina;
}

export async function apiCrearModeloMaquina(modeloMaquina: CrearModeloMaquinaInput) {
  const opciones = crearOpcionesJson("POST", modeloMaquina);
  const modeloMaquinaCreado = await leerDatosApi("/api/v1/modelos-maquina", opciones, "No se pudo crear el modelo de máquina.");
  return modeloMaquinaCreado as ModeloMaquina;
}

export async function apiActualizarModeloMaquina(modeloMaquinaId: number, modeloMaquina: ActualizarModeloMaquinaInput) {
  const opciones = crearOpcionesJson("PUT", modeloMaquina);
  const modeloMaquinaActualizado = await leerDatosApi("/api/v1/modelos-maquina/" + modeloMaquinaId, opciones, "No se pudo actualizar el modelo de máquina.");
  return modeloMaquinaActualizado as ModeloMaquina;
}

export async function apiDesactivarModeloMaquina(modeloMaquinaId: number) {
  const opciones = crearOpcionesJson("PATCH", { estado: "inactivo" });
  const modeloMaquinaActualizado = await leerDatosApi("/api/v1/modelos-maquina/" + modeloMaquinaId, opciones, "No se pudo dar de baja el modelo de máquina.");
  return modeloMaquinaActualizado as ModeloMaquina;
}
