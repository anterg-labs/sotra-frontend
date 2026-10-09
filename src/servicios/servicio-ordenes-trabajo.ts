import {
  apiActualizarOrdenTrabajo,
  apiAsignarTecnicoOrdenTrabajo,
  apiCambiarEstadoOrdenTrabajo,
  apiCrearOrdenTrabajo,
  apiListarOrdenesTrabajo,
  apiObtenerOrdenTrabajo,
  apiSolicitarSugerenciaOrdenTrabajo,
} from "@/servicios/api/api-ordenes-trabajo";
import { listarUsuarios } from "@/servicios/servicio-usuarios";
import type {
  ActualizarOrdenTrabajoInput,
  CrearOrdenTrabajoInput,
  EstadoOrdenTrabajo,
  FiltrosOrdenesTrabajo,
  SolicitarSugerenciaInput,
} from "@/tipos/orden-trabajo";
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

export async function listarOrdenesTrabajo(filtros: FiltrosOrdenesTrabajo) {
  return apiListarOrdenesTrabajo(filtros);
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

export function crearSesionDeSugerencias() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  let identificador = "";
  const plantilla = "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx";
  for (const caracter of plantilla) {
    if (caracter === "x") {
      const numeroAlAzar = Math.floor(Math.random() * 16);
      identificador = identificador + numeroAlAzar.toString(16);
    } else {
      identificador = identificador + caracter;
    }
  }
  return identificador;
}

export function estadoNecesitaMotivo(estadoActual: string, estadoNuevo: string) {
  if (estadoNuevo === estadoActual) {
    return false;
  }

  if (estadoNuevo === "pausada" || estadoNuevo === "cancelada" || estadoNuevo === "cerrada") {
    return true;
  }

  if (estadoActual === "finalizada" && estadoNuevo === "asignada") {
    return true;
  }

  return false;
}

export async function cambiarEstadoOrdenTrabajo(
  ordenTrabajoId: number,
  estadoActual: string,
  estadoNuevo: string,
  motivo: string,
) {
  if (estadoNuevo === "") {
    throw new Error("Seleccioná el nuevo estado.");
  }

  if (estadoNecesitaMotivo(estadoActual, estadoNuevo) && motivo.trim() === "") {
    throw new Error("Indicá el motivo u observación del cambio de estado.");
  }

  return apiCambiarEstadoOrdenTrabajo(ordenTrabajoId, estadoNuevo, motivo.trim());
}

export async function asignarTecnicoOrdenTrabajo(ordenTrabajoId: number, tecnicoId: string) {
  if (tecnicoId === "") {
    throw new Error("Seleccioná un técnico.");
  }

  return apiAsignarTecnicoOrdenTrabajo(ordenTrabajoId, Number(tecnicoId));
}

export async function solicitarSugerenciaOrdenTrabajo(input: SolicitarSugerenciaInput) {
  if (!input.descripcion.trim()) {
    throw new Error("Escribí la descripción de la tarea para pedir la sugerencia.");
  }

  const respuesta = await apiSolicitarSugerenciaOrdenTrabajo(input);
  return respuesta.sugerencia;
}

export function leerSugerenciasTemporales(clave: string) {
  try {
    const textoGuardado = localStorage.getItem(clave);
    if (textoGuardado === null) {
      return null;
    }

    return JSON.parse(textoGuardado) as string[];
  } catch {
    return null;
  }
}

export function guardarSugerenciasTemporales(clave: string, sugerencias: string[]) {
  try {
    localStorage.setItem(clave, JSON.stringify(sugerencias));
    return true;
  } catch {
    return false;
  }
}

export function borrarSugerenciasTemporales(clave: string) {
  try {
    localStorage.removeItem(clave);
    return true;
  } catch {
    return false;
  }
}
