import "server-only";
import { parametrosDeOrden } from "@/componentes/listado/url-listado";
import { leerJsonServidor, opcionesJsonServidor } from "@/servicios/servidor/cliente-http-servidor";
import type { Pagina } from "@/tipos/pagina";
import type {
  ActualizarTipoMaquinaInput,
  CrearTipoMaquinaInput,
  EstadoTipoMaquina,
  FiltrosTiposMaquina,
  TipoMaquina,
} from "@/tipos/tipo-maquina";

export function listarTiposMaquinaServidor(filtros: FiltrosTiposMaquina) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") parametros.append("buscar", filtros.buscar.trim());
  if (filtros.estado !== "") parametros.append("estado", filtros.estado);
  for (const [nombre, valor] of parametrosDeOrden(filtros)) parametros.append(nombre, valor);
  parametros.append("pagina", String(filtros.pagina));
  return leerJsonServidor<Pagina<TipoMaquina>>(
    "/api/v1/tipos-maquina?" + parametros.toString(),
    "No se pudo obtener el listado de tipos de máquina.",
  );
}

export function obtenerTipoMaquinaServidor(tipoMaquinaId: number) {
  return leerJsonServidor<TipoMaquina>(
    "/api/v1/tipos-maquina/" + tipoMaquinaId,
    "No se pudo obtener el tipo de máquina solicitado.",
  );
}

export function crearTipoMaquinaServidor(tipoMaquina: CrearTipoMaquinaInput) {
  return leerJsonServidor<TipoMaquina>(
    "/api/v1/tipos-maquina",
    "No se pudo crear el tipo de máquina.",
    opcionesJsonServidor("POST", tipoMaquina),
  );
}

export function actualizarTipoMaquinaServidor(tipoMaquinaId: number, tipoMaquina: ActualizarTipoMaquinaInput) {
  return leerJsonServidor<TipoMaquina>(
    "/api/v1/tipos-maquina/" + tipoMaquinaId,
    "No se pudo actualizar el tipo de máquina.",
    opcionesJsonServidor("PUT", tipoMaquina),
  );
}

export function cambiarEstadoTipoMaquinaServidor(tipoMaquinaId: number, estado: EstadoTipoMaquina) {
  return leerJsonServidor<TipoMaquina>(
    "/api/v1/tipos-maquina/" + tipoMaquinaId,
    estado === "activo" ? "No se pudo reactivar el tipo de máquina." : "No se pudo dar de baja el tipo de máquina.",
    opcionesJsonServidor("PATCH", { estado }),
  );
}
