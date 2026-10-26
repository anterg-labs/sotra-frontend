import type { ReactNode } from "react";
import { ProveedorEstadosOrden } from "@/componentes/estados-orden";
import type { OpcionEstadoOrden, TransicionOrden } from "@/tipos/orden-trabajo";

/** Catálogo de estados tal como lo entrega la API (tabla `estado_ot`), en el orden del ciclo de vida. */
export const estadosDePrueba: OpcionEstadoOrden[] = [
  { valor: "creada", etiqueta: "Creada", orden: 1, fase: "pendiente", tono: "neutro" },
  { valor: "asignada", etiqueta: "Asignada", orden: 2, fase: "pendiente", tono: "info" },
  { valor: "en_ejecucion", etiqueta: "En ejecución", orden: 3, fase: "en_curso", tono: "info" },
  { valor: "pausada", etiqueta: "Pausada", orden: 4, fase: "en_curso", tono: "alerta" },
  { valor: "finalizada", etiqueta: "Finalizada", orden: 5, fase: "por_validar", tono: "destacado" },
  { valor: "cerrada", etiqueta: "Cerrada", orden: 6, fase: "cerrada", tono: "exito" },
  { valor: "cancelada", etiqueta: "Cancelada", orden: 7, fase: "cancelada", tono: "neutro" },
];

/** Construye una transición como la entrega la API; por defecto no exige motivo ni la usa el técnico. */
export function transicion(estado: string, opciones: Partial<Omit<TransicionOrden, "estado">> = {}): TransicionOrden {
  return { estado, exigeMotivo: false, puedeTecnico: false, accion: null, principal: false, ...opciones };
}

/** Transiciones de la API desde cada estado, según la sección 13.1 de `Flujo de datos SOTRA.md`. */
export const transicionesDePrueba: Record<string, TransicionOrden[]> = {
  creada: [transicion("asignada"), transicion("cancelada", { exigeMotivo: true })],
  asignada: [transicion("en_ejecucion", { puedeTecnico: true, accion: "Iniciar", principal: true }), transicion("cancelada", { exigeMotivo: true })],
  en_ejecucion: [
    transicion("pausada", { exigeMotivo: true, puedeTecnico: true, accion: "Pausar" }),
    transicion("finalizada", { puedeTecnico: true, accion: "Finalizar", principal: true }),
  ],
  pausada: [transicion("en_ejecucion", { puedeTecnico: true, accion: "Reanudar", principal: true }), transicion("cancelada", { exigeMotivo: true })],
  finalizada: [transicion("asignada", { exigeMotivo: true }), transicion("cerrada", { exigeMotivo: true })],
  cerrada: [],
  cancelada: [],
};

export function conEstadosOrden(contenido: ReactNode) {
  return <ProveedorEstadosOrden estados={estadosDePrueba}>{contenido}</ProveedorEstadosOrden>;
}
