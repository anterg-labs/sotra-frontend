import { FormularioRepuesto } from "@/componentes/formulario-repuesto";
import { obtenerRepuestoServidor } from "@/servicios/servidor/repuestos";
import type { Repuesto } from "@/tipos/repuesto";
import { actualizarRepuestoAccion } from "../../acciones";

async function cargarRepuesto(repuestoId: number): Promise<Repuesto | null> {
  if (!Number.isInteger(repuestoId) || repuestoId <= 0) return null;
  try {
    return await obtenerRepuestoServidor(repuestoId);
  } catch {
    return null;
  }
}

/** Formulario de modificación de un repuesto; lo usan la página completa y el modal de ruta. */
export async function ContenidoEditarRepuesto(props: { params: Promise<{ id: string }> }) {
  const repuesto = await cargarRepuesto(Number((await props.params).id));

  if (!repuesto) return <p className="form-error-banner">No se pudo obtener la información del repuesto solicitado.</p>;

  return (
    <FormularioRepuesto
      accion={actualizarRepuestoAccion.bind(null, repuesto.id)}
      etiquetaConfirmacion="Confirmar modificación"
      repuestoInicial={repuesto}
    />
  );
}
