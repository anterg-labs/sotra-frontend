"use client";

import { crearModeloMaquinaAccion } from "@/app/activos/modelos/acciones";
import { FormularioModeloMaquina } from "@/componentes/formulario-modelo-maquina";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

type PropiedadesAltaModeloMaquina = {
  /** Tipos activos cargados en el servidor; `null` si no se pudieron obtener. */
  tiposMaquina: TipoMaquina[] | null;
  alGuardar?: (modelo: ModeloMaquina) => void;
  alCancelar?: () => void;
};

/** Formulario de alta de modelo con los tipos ya cargados, en una página o dentro de un modal. */
export function AltaModeloMaquina(props: PropiedadesAltaModeloMaquina) {
  if (props.tiposMaquina === null) {
    return <p className="form-error-banner">No se pudo obtener el listado de tipos de máquina.</p>;
  }

  return (
    <FormularioModeloMaquina
      accion={crearModeloMaquinaAccion}
      alCancelar={props.alCancelar}
      alGuardar={props.alGuardar}
      etiquetaConfirmacion="Confirmar registro"
      tiposMaquina={props.tiposMaquina}
    />
  );
}
