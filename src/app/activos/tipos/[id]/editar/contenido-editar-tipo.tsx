import { FormularioTipoMaquina } from "@/componentes/formulario-tipo-maquina";
import { obtenerTipoMaquinaServidor } from "@/servicios/servidor/tipos-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";
import { actualizarTipoMaquinaAccion } from "../../acciones";

async function cargarTipo(tipoMaquinaId: number): Promise<TipoMaquina | null> {
  if (!Number.isInteger(tipoMaquinaId) || tipoMaquinaId <= 0) return null;
  try {
    return await obtenerTipoMaquinaServidor(tipoMaquinaId);
  } catch {
    return null;
  }
}

/** Formulario de modificación de un tipo de máquina; lo usan la página completa y el modal de ruta. */
export async function ContenidoEditarTipo(props: { params: Promise<{ id: string }> }) {
  const tipoMaquina = await cargarTipo(Number((await props.params).id));

  if (!tipoMaquina) return <p className="form-error-banner">No se pudo obtener la información del tipo de máquina solicitado.</p>;

  return (
    <FormularioTipoMaquina
      accion={actualizarTipoMaquinaAccion.bind(null, tipoMaquina.id)}
      etiquetaConfirmacion="Confirmar modificación"
      tipoMaquinaInicial={tipoMaquina}
    />
  );
}
