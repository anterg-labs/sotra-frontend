"use client";

import { crearActivoAccion } from "@/app/activos/acciones";
import { FormularioActivo } from "@/componentes/formulario-activo";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";

type PropiedadesAltaActivo = {
  /** Clientes y modelos activos cargados en el servidor; `null` si no se pudieron obtener. */
  clientes: Cliente[] | null;
  modelosMaquina: ModeloMaquina[] | null;
  alGuardar?: (activo: Activo) => void;
  alCancelar?: () => void;
};

/** Formulario de alta de activo con los datos ya cargados, en una página o dentro de un modal. */
export function AltaActivo(props: PropiedadesAltaActivo) {
  const { clientes, modelosMaquina } = props;

  if (clientes === null || modelosMaquina === null) {
    return <p className="form-error-banner">No se pudieron obtener los datos necesarios para registrar el activo.</p>;
  }

  if (!clientes.some((cliente) => cliente.estado === "activo")) {
    return <p className="empty-state">Primero se debe registrar un cliente activo.</p>;
  }

  if (!modelosMaquina.some((modelo) => modelo.estado === "activo")) {
    return <p className="empty-state">Primero se debe registrar un modelo de máquina activo.</p>;
  }

  return (
    <FormularioActivo
      accion={crearActivoAccion}
      alCancelar={props.alCancelar}
      alGuardar={props.alGuardar}
      clientes={clientes}
      etiquetaConfirmacion="Confirmar registro"
      modelosMaquina={modelosMaquina}
    />
  );
}
