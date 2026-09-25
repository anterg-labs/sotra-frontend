import {
  apiActualizarOrdenTrabajo,
  apiCambiarEstadoOrdenTrabajo,
  apiCrearOrdenTrabajo,
  apiListarOrdenesTrabajo,
  apiObtenerOrdenTrabajo,
  apiSolicitarSugerenciaOrdenTrabajo,
} from "@/servicios/cliente-api";
import { listarUsuarios } from "@/servicios/servicio-usuarios";
import type { ActualizarOrdenTrabajoInput, CrearOrdenTrabajoInput, EstadoOrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";

const etiquetasEstado = {
  creada: "Creada",
  asignada: "Asignada",
  en_ejecucion: "En ejecución",
  pausada: "Pausada",
  finalizada: "Finalizada",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

function validarOrdenTrabajo(input: CrearOrdenTrabajoInput) {
  if (input.clienteId <= 0) {
    throw new Error("El cliente es obligatorio.");
  }

  if (input.activoId <= 0) {
    throw new Error("El activo es obligatorio.");
  }

  if (!input.descripcion.trim()) {
    throw new Error("La descripción de la tarea es obligatoria.");
  }

  if (!input.fechaPrevistaEjecucion) {
    throw new Error("La fecha prevista de ejecución es obligatoria.");
  }
}

export function obtenerEtiquetaEstadoOrdenTrabajo(estado: EstadoOrdenTrabajo) {
  return etiquetasEstado[estado];
}

export function formatearFechaPrevista(fechaPrevista: string) {
  const partesFecha = fechaPrevista.split("-");
  return partesFecha[2] + "/" + partesFecha[1] + "/" + partesFecha[0];
}

export async function listarTecnicos() {
  const usuarios = await listarUsuarios();
  const tecnicos: Usuario[] = [];

  for (const usuario of usuarios) {
    let esTecnico = false;
    for (const rol of usuario.roles) {
      if (rol.nombre === "Técnico") {
        esTecnico = true;
      }
    }

    if (esTecnico && usuario.estado === "activo") {
      tecnicos.push(usuario);
    }
  }

  return tecnicos;
}

export async function listarOrdenesTrabajo() {
  return apiListarOrdenesTrabajo();
}

export async function obtenerDetalleOrdenTrabajo(ordenTrabajoId: number) {
  return apiObtenerOrdenTrabajo(ordenTrabajoId);
}

export async function crearOrdenTrabajo(input: CrearOrdenTrabajoInput) {
  validarOrdenTrabajo(input);
  return apiCrearOrdenTrabajo(input);
}

export async function actualizarOrdenTrabajo(ordenTrabajoId: number, input: ActualizarOrdenTrabajoInput) {
  validarOrdenTrabajo(input);
  return apiActualizarOrdenTrabajo(ordenTrabajoId, input);
}

export async function cambiarEstadoOrdenTrabajo(ordenTrabajoId: number, estado: EstadoOrdenTrabajo) {
  return apiCambiarEstadoOrdenTrabajo(ordenTrabajoId, estado);
}

export async function solicitarSugerenciaOrdenTrabajo(ordenTrabajoId: number) {
  return apiSolicitarSugerenciaOrdenTrabajo(ordenTrabajoId);
}
