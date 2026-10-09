"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  obtenerDetalleDocumentoTecnico,
  obtenerUrlDescargaDocumentoTecnico,
} from "@/servicios/servicio-documentos-tecnicos";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";

export default function PaginaDetalleDocumentoTecnico() {
  const parametros = useParams<{ id: string }>();
  const documentoId = Number(parametros.id);
  const [documento, setDocumento] = useState<DocumentoTecnico | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarDocumento() {
      try {
        const documentoObtenido = await obtenerDetalleDocumentoTecnico(documentoId);
        setDocumento(documentoObtenido);
      } catch {
        setErrorCarga("No se pudo obtener la información del documento solicitado.");
      }
    }

    cargarDocumento();
  }, [documentoId]);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (documento === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del documento…</p>;
  }

  let titulo = "Detalle del documento técnico";
  let contenido = null;
  if (documento !== null) {
    titulo = documento.nombreArchivo;

    let activoAsociado = <span>Sin activo</span>;
    if (documento.activoId !== null) {
      let nombreActivo = "Activo " + documento.activoId;
      if (documento.nombreActivo !== null) {
        nombreActivo = documento.nombreActivo;
      }
      activoAsociado = (
        <Link className="text-link" href={"/activos/" + documento.activoId}>{nombreActivo}</Link>
      );
    }

    let textoSugerenciasIA = "No se usa para sugerencias de IA";
    if (documento.usaSugerenciasIA) {
      textoSugerenciasIA = "Se usa para sugerencias de IA (" + documento.cantidadFragmentos + " fragmentos procesados)";
    }

    contenido = (
      <section className="panel detail-panel">
        <dl className="detail-list">
          <div>
            <dt>Archivo</dt>
            <dd>{documento.nombreArchivo}</dd>
          </div>
          <div>
            <dt>Activo asociado</dt>
            <dd>{activoAsociado}</dd>
          </div>
          <div>
            <dt>Sugerencias de IA</dt>
            <dd>{textoSugerenciasIA}</dd>
          </div>
          <div>
            <dt>Fecha de carga</dt>
            <dd>{new Date(documento.creadoEn).toLocaleString("es-UY")}</dd>
          </div>
        </dl>
        <div className="form-actions">
          <a className="primary-button" href={obtenerUrlDescargaDocumentoTecnico(documento.id)}>
            Descargar PDF
          </a>
        </div>
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Documentación técnica</p>
          <h1>{titulo}</h1>
        </div>
        <Link className="secondary-button" href="/documentacion-tecnica">
          Volver al listado
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenido}
    </main>
  );
}
