"use client";

import { FormularioOrdenTrabajo } from "@/componentes/formulario-orden-trabajo";
import { actualizarOrdenTrabajo, crearOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Repuesto } from "@/tipos/repuesto";
import type { Usuario } from "@/tipos/usuario";

type DatosFormulario = { clientes: Cliente[]; activos: Activo[]; tecnicos: Usuario[]; repuestos: Repuesto[] };

/**
 * Islas del alta y la edición: los datos de los selectores llegan del servidor, pero el envío sigue yendo del navegador
 * a la API (con `If-Match`/`version` en la edición) para conservar el borrador de sugerencias de IA y el error 412 `ORDEN_MODIFICADA`.
 */
export function FormularioNuevaOrden(props: DatosFormulario) {
  return <FormularioOrdenTrabajo {...props} alEnviar={crearOrdenTrabajo} etiquetaConfirmacion="Confirmar creación" />;
}

export function FormularioEditarOrden(props: DatosFormulario & { orden: OrdenTrabajo }) {
  const { orden, ...datos } = props;
  return (
    <FormularioOrdenTrabajo
      {...datos}
      alEnviar={(campos) => actualizarOrdenTrabajo(orden.id, campos, orden.version)}
      etiquetaConfirmacion="Confirmar modificación"
      ordenInicial={orden}
    />
  );
}
