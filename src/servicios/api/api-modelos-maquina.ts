import { crearOpcionesJson, leerDatosApi, leerPagina, leerTodasLasPaginas } from "@/servicios/api/solicitudes-http";
import type {
  ActualizarModeloMaquinaInput,
  CrearModeloMaquinaInput,
  FiltrosModelosMaquina,
  ModeloMaquina,
} from "@/tipos/modelo-maquina";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarModelosMaquina() {
  const modelosMaquina = await leerTodasLasPaginas("/api/v1/modelos-maquina", "No se pudo obtener el listado de modelos de máquina.");
  return modelosMaquina as ModeloMaquina[];
}

export async function apiListarModelosMaquinaPaginados(filtros: FiltrosModelosMaquina) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.tipoMaquinaId !== "") {
    parametros.append("tipoMaquinaId", filtros.tipoMaquinaId);
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/modelos-maquina", parametros, "No se pudo obtener el listado de modelos de máquina.");
  return pagina as Pagina<ModeloMaquina>;
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
