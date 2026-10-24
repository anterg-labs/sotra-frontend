import Link from "next/link";
import { apiObtenerUrlDescargaDocumentoTecnico } from "@/servicios/api/api-documentos-tecnicos";
import { obtenerDocumentoTecnicoServidor } from "@/servicios/servidor/documentos-tecnicos";
import { obtenerEtiquetaTipoDocumento, type DocumentoTecnico } from "@/tipos/documento-tecnico";
import { formatearFechaHora } from "@/utilidades/fechas";
import { BotonVigencia } from "./boton-vigencia";
import { EnlaceVolver } from "@/componentes/enlace-volver";

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
        <div className="encabezado-volver">
          <EnlaceVolver etiqueta="Volver al listado" href="/documentacion-tecnica" />
          <div>
            <p className="eyebrow">Documentación</p>
            <h1>{documento ? documento.titulo : "Detalle del documento"}</h1>
          </div>
        </div>
      </header>

      {documento ? (
        <section className="panel detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Archivo</dt>
              <dd>{documento.nombreArchivo}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{obtenerEtiquetaTipoDocumento(documento.tipo)}</dd>
            </div>
            <div>
              <dt>Vigencia</dt>
              <dd>
                <span className={documento.vigente ? "status status-activo" : "status status-inactivo"}>
                  {documento.vigente ? "Vigente" : "Obsoleto"}
                </span>
              </dd>
            </div>
            {documento.descripcion ? (
              <div>
                <dt>Descripción</dt>
                <dd>{documento.descripcion}</dd>
              </div>
            ) : null}
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
              <dt>Modelo de máquina</dt>
              <dd>{documento.nombreModelo ?? "Sin modelo"}</dd>
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
            <Link className="secondary-button" href={"/documentacion-tecnica/" + documento.id + "/editar"}>
              Modificar
            </Link>
            <BotonVigencia documentoId={documento.id} vigente={documento.vigente} />
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
