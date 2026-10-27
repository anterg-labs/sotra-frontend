import {
  apiActualizarOrdenTrabajo,
  apiActualizarRepuestosOrdenTrabajo,
  apiAsignarTecnicoOrdenTrabajo,
  apiCambiarEstadoOrdenTrabajo,
  apiCrearOrdenTrabajo,
  apiListarOrdenesTrabajo,
  apiObtenerOrdenTrabajo,
  apiSolicitarSugerenciaOrdenTrabajo,
} from "@/servicios/api/api-ordenes-trabajo";
import { apiListarTecnicos } from "@/servicios/api/api-usuarios";
import { listarUsuarios } from "@/servicios/servicio-usuarios";
import type {
  ActualizarOrdenTrabajoInput,
  CrearOrdenTrabajoInput,
  FiltrosOrdenesTrabajo,
  RepuestoPedido,
  SolicitarSugerenciaInput,
  SugerenciaObtenida,
} from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";

/** Decisión D12 (2026-10-21): la API rechaza descripciones y observaciones de más de 4000 caracteres. */
export const LARGO_MAXIMO_TEXTO_ORDEN = 4000;

export function obtenerErroresOrdenTrabajo(input: CrearOrdenTrabajoInput) {
  const errores: Partial<Record<"clienteId" | "activoId" | "descripcion" | "observaciones" | "fechaPrevistaEjecucion", string>> = {};
  if (input.clienteId <= 0) errores.clienteId = "El cliente es obligatorio.";
  if (input.activoId <= 0) errores.activoId = "El activo es obligatorio.";
  if (!input.descripcion.trim()) errores.descripcion = "La descripción de la tarea es obligatoria.";
  else if (input.descripcion.length > LARGO_MAXIMO_TEXTO_ORDEN) errores.descripcion = `La descripción no puede superar los ${LARGO_MAXIMO_TEXTO_ORDEN} caracteres.`;
  if (input.observaciones.length > LARGO_MAXIMO_TEXTO_ORDEN) errores.observaciones = `Las observaciones no pueden superar los ${LARGO_MAXIMO_TEXTO_ORDEN} caracteres.`;
  if (!input.fechaPrevistaEjecucion) errores.fechaPrevistaEjecucion = "La fecha prevista de ejecución es obligatoria.";
  return errores;
}

/** Cantidad máxima por repuesto que acepta la API. */
export const CANTIDAD_MAXIMA_REPUESTO = 1_000_000;

/** Primer problema de los repuestos pedidos (cantidad entera de 1 en adelante, sin repetir); la disponibilidad la decide la API. */
export function obtenerErrorDeRepuestos(repuestos: RepuestoPedido[]) {
  if (repuestos.some((repuesto) => !Number.isInteger(repuesto.cantidad) || repuesto.cantidad < 1 || repuesto.cantidad > CANTIDAD_MAXIMA_REPUESTO)) {
    return "La cantidad de cada repuesto debe ser un número entero de 1 en adelante.";
  }
  if (new Set(repuestos.map((repuesto) => repuesto.repuestoId)).size !== repuestos.length) {
    return "Un repuesto no puede repetirse en la orden: indicá una sola cantidad por repuesto.";
  }
  return "";
}

function validarOrdenTrabajo(input: CrearOrdenTrabajoInput) {
  const primerError = Object.values(obtenerErroresOrdenTrabajo(input))[0] ?? obtenerErrorDeRepuestos(input.repuestos);
  if (primerError) throw new Error(primerError);
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

/**
 * Técnicos activos para los selectores (asignar, filtrar). Se filtran por el nombre del rol porque `/api/v1/roles`
 * es solo del administrador y el jefe también asigna técnicos (`/api/v1/usuarios` sí lo puede listar).
 */
export async function listarTecnicosPaginados(buscar = "") {
  return apiListarTecnicos(buscar);
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

/** `versionLeida` es la `version` de la orden al abrir la edición: si otra persona la cambió, la API responde 412. */
export async function actualizarOrdenTrabajo(
  ordenTrabajoId: number,
  input: ActualizarOrdenTrabajoInput,
  versionLeida?: string,
) {
  validarOrdenTrabajo(input);
  return apiActualizarOrdenTrabajo(ordenTrabajoId, input, versionLeida);
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

/** `exigeMotivo` viene de la transición que entrega la API; la validación definitiva la hace el servidor. */
export async function cambiarEstadoOrdenTrabajo(
  ordenTrabajoId: number,
  estadoNuevo: string,
  motivo: string,
  exigeMotivo: boolean,
) {
  if (estadoNuevo === "") {
    throw new Error("Seleccioná el nuevo estado.");
  }

  if (exigeMotivo && motivo.trim() === "") {
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

/** Deja la orden usando exactamente estos repuestos y cantidades; la API reserva, ajusta o libera y valida el stock. */
export async function actualizarRepuestosOrdenTrabajo(ordenTrabajoId: number, repuestos: RepuestoPedido[]) {
  const error = obtenerErrorDeRepuestos(repuestos);
  if (error) throw new Error(error);
  return apiActualizarRepuestosOrdenTrabajo(ordenTrabajoId, repuestos);
}

export async function solicitarSugerenciaOrdenTrabajo(input: SolicitarSugerenciaInput) {
  if (!input.descripcion.trim()) {
    throw new Error("Escribí la descripción de la tarea para pedir la sugerencia.");
  }

  const respuesta = await apiSolicitarSugerenciaOrdenTrabajo(input);
  const sugerenciaObtenida: SugerenciaObtenida = {
    texto: respuesta.sugerencia,
    sinIa: respuesta.modo === "sin_ia",
  };
  return sugerenciaObtenida;
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
