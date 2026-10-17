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

export default async function PaginaEditarRepuesto(props: { params: Promise<{ id: string }> }) {
  const repuesto = await cargarRepuesto(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de repuestos</p>
          <h1>Modificar repuesto</h1>
        </div>
      </header>

      {repuesto ? (
        <section className="panel form-panel">
          <FormularioRepuesto
            accion={actualizarRepuestoAccion.bind(null, repuesto.id)}
            etiquetaConfirmacion="Confirmar modificación"
            repuestoInicial={repuesto}
          />
        </section>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del repuesto solicitado.</p>
      )}
    </main>
  );
}
