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

export default async function PaginaEditarTipoMaquina(props: { params: Promise<{ id: string }> }) {
  const tipoMaquina = await cargarTipo(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de tipos de máquina</p>
          <h1>Modificar tipo de máquina</h1>
        </div>
      </header>

      {tipoMaquina ? (
        <section className="panel form-panel">
          <FormularioTipoMaquina
            accion={actualizarTipoMaquinaAccion.bind(null, tipoMaquina.id)}
            etiquetaConfirmacion="Confirmar modificación"
            tipoMaquinaInicial={tipoMaquina}
          />
        </section>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del tipo de máquina solicitado.</p>
      )}
    </main>
  );
}
