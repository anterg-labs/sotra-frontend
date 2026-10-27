import { FormularioModeloMaquina } from "@/componentes/formulario-modelo-maquina";
import { obtenerModeloMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import { listarTiposMaquinaServidor, obtenerTipoMaquinaServidor } from "@/servicios/servidor/tipos-maquina";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";
import { actualizarModeloMaquinaAccion } from "../../acciones";

type DatosEdicion = { modelo: ModeloMaquina; tiposMaquina: TipoMaquina[] };

/** El tipo actual del modelo va primero, aunque esté inactivo, seguido de los tipos activos. */
async function cargarDatos(modeloMaquinaId: number): Promise<DatosEdicion | null> {
  if (!Number.isInteger(modeloMaquinaId) || modeloMaquinaId <= 0) return null;
  try {
    const [modelo, pagina] = await Promise.all([
      obtenerModeloMaquinaServidor(modeloMaquinaId),
      listarTiposMaquinaServidor({ buscar: "", estado: "activo", pagina: 1 }),
    ]);
    const tipoActual = await obtenerTipoMaquinaServidor(modelo.tipoMaquinaId);
    return { modelo, tiposMaquina: [tipoActual, ...pagina.elementos.filter((tipo) => tipo.id !== tipoActual.id)] };
  } catch {
    return null;
  }
}

/** Formulario de modificación de un modelo de máquina; lo usan la página completa y el modal de ruta. */
export async function ContenidoEditarModelo(props: { params: Promise<{ id: string }> }) {
  const datos = await cargarDatos(Number((await props.params).id));

  if (!datos) return <p className="form-error-banner">No se pudo obtener la información del modelo de máquina solicitado.</p>;

  return (
    <FormularioModeloMaquina
      accion={actualizarModeloMaquinaAccion.bind(null, datos.modelo.id)}
      etiquetaConfirmacion="Confirmar modificación"
      modeloMaquinaInicial={datos.modelo}
      tiposMaquina={datos.tiposMaquina}
    />
  );
}
