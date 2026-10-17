import "server-only";
import { leerJsonServidor, opcionesJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type {
  ActualizarModeloMaquinaInput,
  CrearModeloMaquinaInput,
  EstadoModeloMaquina,
  FiltrosModelosMaquina,
  ModeloMaquina,
} from "@/tipos/modelo-maquina";
import type { Pagina } from "@/tipos/pagina";

export function listarModelosMaquinaServidor(filtros: FiltrosModelosMaquina) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.tipoMaquinaId !== "") parametros.append("tipoMaquinaId", filtros.tipoMaquinaId);
  if (filtros.estado !== "") parametros.append("estado", filtros.estado);
  parametros.append("pagina", String(filtros.pagina));
  return leerJsonServidor<Pagina<ModeloMaquina>>(
    "/api/v1/modelos-maquina?" + parametros.toString(),
    "No se pudo obtener el listado de modelos de máquina.",
  );
}

export function obtenerModeloMaquinaServidor(modeloMaquinaId: number) {
  return leerJsonServidor<ModeloMaquina>(
    "/api/v1/modelos-maquina/" + modeloMaquinaId,
    "No se pudo obtener el modelo de máquina solicitado.",
  );
}

export function crearModeloMaquinaServidor(modeloMaquina: CrearModeloMaquinaInput) {
  return leerJsonServidor<ModeloMaquina>(
    "/api/v1/modelos-maquina",
    "No se pudo crear el modelo de máquina.",
    opcionesJsonServidor("POST", modeloMaquina),
  );
}

export function actualizarModeloMaquinaServidor(modeloMaquinaId: number, modeloMaquina: ActualizarModeloMaquinaInput) {
  return leerJsonServidor<ModeloMaquina>(
    "/api/v1/modelos-maquina/" + modeloMaquinaId,
    "No se pudo actualizar el modelo de máquina.",
    opcionesJsonServidor("PUT", modeloMaquina),
  );
}

export function cambiarEstadoModeloMaquinaServidor(modeloMaquinaId: number, estado: EstadoModeloMaquina) {
  return leerJsonServidor<ModeloMaquina>(
    "/api/v1/modelos-maquina/" + modeloMaquinaId,
    estado === "activo" ? "No se pudo reactivar el modelo de máquina." : "No se pudo dar de baja el modelo de máquina.",
    opcionesJsonServidor("PATCH", { estado }),
  );
}
