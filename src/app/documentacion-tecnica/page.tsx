"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import {
  eliminarDocumentoTecnico,
  listarDocumentosTecnicos,
  obtenerUrlDescargaDocumentoTecnico,
} from "@/servicios/servicio-documentos-tecnicos";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";

export default function PaginaDocumentacionTecnica() {
  const [documentos, setDocumentos] = useState<DocumentoTecnico[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [documentoEliminandoId, setDocumentoEliminandoId] = useState<number | null>(null);
  const [documentoPendienteEliminacion, setDocumentoPendienteEliminacion] = useState<DocumentoTecnico | null>(null);

  useEffect(() => {
    async function cargarDocumentos() {
      setDocumentos(null);
      setErrorCarga("");

      try {
        const documentosObtenidos = await listarDocumentosTecnicos();
        setDocumentos(documentosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de documentos técnicos.");
      }
    }

    cargarDocumentos();
  }, []);

  function pedirEliminacionDocumento(documento: DocumentoTecnico) {
    setDocumentoPendienteEliminacion(documento);
  }

  function cancelarEliminacion() {
    setDocumentoPendienteEliminacion(null);
  }

  async function confirmarEliminacion() {
    if (!documentoPendienteEliminacion) {
      return;
    }

    const documentoId = documentoPendienteEliminacion.id;
    setDocumentoEliminandoId(documentoId);

    try {
      await eliminarDocumentoTecnico(documentoId);
      const documentosActualizados = await listarDocumentosTecnicos();
      setDocumentos(documentosActualizados);
      setDocumentoPendienteEliminacion(null);
    } catch {
      setErrorCarga("No se pudo eliminar el documento seleccionado.");
    } finally {
      setDocumentoEliminandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (documentos === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando documentos técnicos…</p>;
  }

  let mensajeSinResultados = null;
  if (documentos !== null && documentos.length === 0) {
    mensajeSinResultados = <p className="empty-state">No hay documentos técnicos cargados.</p>;
  }

  let tablaDocumentos = null;
  if (documentos !== null && documentos.length > 0) {
    tablaDocumentos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Activo asociado</th>
              <th>Sugerencias de IA</th>
              <th>Fecha de carga</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((documento) => {
              let nombreActivo = "Sin activo";
              if (documento.nombreActivo) {
                nombreActivo = documento.nombreActivo;
              }

              let textoSugerenciasIA = "No";
              let claseSugerenciasIA = "status status-inactivo";
              if (documento.usaSugerenciasIA) {
                textoSugerenciasIA = "Sí";
                claseSugerenciasIA = "status status-activo";
              }

              const fechaCarga = new Date(documento.creadoEn).toLocaleDateString("es-UY");

              return (
                <tr key={documento.id}>
                  <td><strong>{documento.nombreArchivo}</strong></td>
                  <td>{nombreActivo}</td>
                  <td>
                    <span className={claseSugerenciasIA}>{textoSugerenciasIA}</span>
                  </td>
                  <td>{fechaCarga}</td>
                  <td>
                    <div className="table-actions">
                      <a
                        aria-label="Descargar PDF"
                        className="table-action-link"
                        href={obtenerUrlDescargaDocumentoTecnico(documento.id)}
                        title="Descargar PDF"
                      >
                        Descargar
                      </a>
                      <button
                        aria-label="Eliminar documento"
                        className="table-action-link table-action-link-danger"
                        disabled={documentoEliminandoId === documento.id}
                        onClick={() => pedirEliminacionDocumento(documento)}
                        title="Eliminar documento"
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  let modalEliminacion = null;
  if (documentoPendienteEliminacion) {
    modalEliminacion = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la eliminación de " +
          documentoPendienteEliminacion.nombreArchivo +
          "? Si se usa para sugerencias de IA, también se borrarán sus fragmentos y embeddings."
        }
        estaConfirmando={documentoEliminandoId === documentoPendienteEliminacion.id}
        etiquetaConfirmar="Eliminar"
        onCancelar={cancelarEliminacion}
        onConfirmar={confirmarEliminacion}
        titulo="Eliminar documento técnico"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Documentación técnica</h1>
        </div>
        <Link className="primary-button" href="/documentacion-tecnica/nuevo">
          Cargar documento
        </Link>
      </header>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaDocumentos}
      </section>

      {modalEliminacion}
    </main>
  );
}
