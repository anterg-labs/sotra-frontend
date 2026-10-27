import type { ReactNode } from "react";
import { ProveedorEstadosOrden } from "@/componentes/estados-orden";
import type { OpcionEstadoOrden, TransicionOrden } from "@/tipos/orden-trabajo";

/** Catálogo de estados tal como lo entrega la API (tabla `estado_ot`), en el orden del ciclo de vida. */
export const estadosDePrueba: OpcionEstadoOrden[] = [
  { valor: "pendiente", etiqueta: "Pendiente", orden: 1, fase: "pendiente", tono: "neutro" },
  { valor: "en_progreso", etiqueta: "En progreso", orden: 2, fase: "en_curso", tono: "info" },
  { valor: "en_revision", etiqueta: "En revisión", orden: 3, fase: "por_validar", tono: "destacado" },
  { valor: "cerrado", etiqueta: "Cerrado", orden: 4, fase: "cerrada", tono: "exito" },
  { valor: "pausado", etiqueta: "Pausado", orden: 5, fase: "en_curso", tono: "alerta" },
  { valor: "eliminado", etiqueta: "Eliminado", orden: 6, fase: "eliminada", tono: "neutro" },
];

/** Construye una transición como la entrega la API; por defecto no exige motivo ni la usa el técnico. */
export function transicion(estado: string, opciones: Partial<Omit<TransicionOrden, "estado">> = {}): TransicionOrden {
  return { estado, exigeMotivo: false, puedeTecnico: false, accion: null, principal: false, ...opciones };
}

/** Transiciones de la API desde cada estado, según la sección 13.1 de `Flujo de datos SOTRA.md`. */
export const transicionesDePrueba: Record<string, TransicionOrden[]> = {
  pendiente: [transicion("en_progreso", { puedeTecnico: true, accion: "Iniciar", principal: true }), transicion("eliminado", { exigeMotivo: true })],
  en_progreso: [
    transicion("en_revision", { puedeTecnico: true, accion: "Enviar a revisión", principal: true }),
    transicion("pausado", { exigeMotivo: true, puedeTecnico: true, accion: "Pausar" }),
  ],
  en_revision: [transicion("pendiente", { exigeMotivo: true }), transicion("cerrado")],
  pausado: [transicion("en_progreso", { puedeTecnico: true, accion: "Reanudar", principal: true }), transicion("eliminado", { exigeMotivo: true })],
  cerrado: [],
  eliminado: [],
};

export function conEstadosOrden(contenido: ReactNode) {
  return <ProveedorEstadosOrden estados={estadosDePrueba}>{contenido}</ProveedorEstadosOrden>;
}
