import Link from "next/link";
import { apiObtenerUrlDescargaDocumentoTecnico } from "@/servicios/api/api-documentos-tecnicos";
import { obtenerDocumentoTecnicoServidor } from "@/servicios/servidor/documentos-tecnicos";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";
import { formatearFechaHora } from "@/utilidades/fechas";

async function cargarDocumento(documentoId: number): Promise<DocumentoTecnico | null> {
  if (!Number.isInteger(documentoId) || documentoId <= 0) return null;
  try {
    return await obtenerDocumentoTecnicoServidor(documentoId);
  } catch {
    return null;
  }
}

export default async function PaginaDetalleDocumentoTecnico(props: { params: Promise<{ id: string }> }) {
  const documento = await cargarDocumento(Number((await props.params).id));

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Documentación técnica</p>
          <h1>{documento ? documento.nombreArchivo : "Detalle del documento técnico"}</h1>
        </div>
        <Link className="secondary-button" href="/documentacion-tecnica">
          Volver al listado
        </Link>
      </header>

      {documento ? (
        <section className="panel detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Archivo</dt>
              <dd>{documento.nombreArchivo}</dd>
            </div>
            <div>
              <dt>Activo asociado</dt>
              <dd>
                {documento.activoId !== null ? (
                  <Link className="text-link" href={"/activos/" + documento.activoId}>
                    {documento.nombreActivo ?? "Activo " + documento.activoId}
                  </Link>
                ) : (
                  <span>Sin activo</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Sugerencias de IA</dt>
              <dd>
                {documento.usaSugerenciasIA
                  ? "Se usa para sugerencias de IA (" + documento.cantidadFragmentos + " fragmentos procesados)"
                  : "No se usa para sugerencias de IA"}
              </dd>
            </div>
            <div>
              <dt>Fecha de carga</dt>
              <dd>{formatearFechaHora(documento.creadoEn)}</dd>
            </div>
          </dl>
          <div className="form-actions">
            <a className="primary-button" href={apiObtenerUrlDescargaDocumentoTecnico(documento.id)}>
              Descargar PDF
            </a>
          </div>
        </section>
      ) : (
        <p className="form-error-banner">No se pudo obtener la información del documento solicitado.</p>
      )}
    </main>
  );
}
