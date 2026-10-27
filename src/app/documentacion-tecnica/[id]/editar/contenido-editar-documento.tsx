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

/** Formulario de modificación de un documento técnico; lo usan la página completa y el modal de ruta. */
export async function ContenidoEditarDocumento(props: { params: Promise<{ id: string }> }) {
  const documento = await cargarDocumento(Number((await props.params).id));

  if (!documento) return <p className="form-error-banner">No se pudo obtener la información del documento solicitado.</p>;

  return <FormularioEditarDocumento accion={actualizarDocumentoAccion.bind(null, documento.id)} documento={documento} />;
}
