import { FormularioEditarDocumento } from "@/componentes/formulario-editar-documento";
import { obtenerDocumentoTecnicoServidor } from "@/servicios/servidor/documentos-tecnicos";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";
import { actualizarDocumentoAccion } from "../../acciones";

async function cargarDocumento(documentoId: number): Promise<DocumentoTecnico | null> {
  if (!Number.isInteger(documentoId) || documentoId <= 0) return null;
  try {
    return await obtenerDocumentoTecnicoServidor(documentoId);
  } catch {
    return null;
  }
}

export default async function PaginaEditarDocumento(props: { params: Promise<{ id: string }> }) {
  const documento = await cargarDocumento(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Documentación</p>
          <h1>Modificar documento</h1>
        </div>
      </header>

      {documento ? (
        <section className="panel form-panel">
          <FormularioEditarDocumento accion={actualizarDocumentoAccion.bind(null, documento.id)} documento={documento} />
        </section>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del documento solicitado.</p>
      )}
    </main>
  );
}
