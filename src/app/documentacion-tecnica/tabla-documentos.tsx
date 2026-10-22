"use client";

import Link from "next/link";
import { useState } from "react";
import { IconoDescarga, IconoOjo, IconoPapelera } from "@/componentes/iconos";
import { useCambioEstado } from "@/componentes/listado/use-cambio-estado";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { apiObtenerUrlDescargaDocumentoTecnico } from "@/servicios/api/api-documentos-tecnicos";
import type { DocumentoTecnico } from "@/tipos/documento-tecnico";
import { eliminarDocumentoTecnicoAccion } from "./acciones";
import { formatearFechaCorta } from "@/utilidades/fechas";

/** Tabla del listado: recibe los documentos ya cargados en el servidor y maneja la eliminación con confirmación. */
export function TablaDocumentos(props: { documentos: DocumentoTecnico[] }) {
  const puedeGestionar = useTienePermiso("documento.gestionar");
  const [documentoPendiente, setDocumentoPendiente] = useState<DocumentoTecnico | null>(null);
  const { enProcesoId, error, ejecutar } = useCambioEstado(
    (id) => eliminarDocumentoTecnicoAccion(id),
    () => setDocumentoPendiente(null),
  );

  return (
    <>
      {error ? <p className="form-error-banner">{error}</p> : null}
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
            {props.documentos.map((documento) => {
              const estaOcupado = enProcesoId === documento.id;
              return (
                <tr aria-busy={estaOcupado || undefined} className={estaOcupado ? "opacity-60" : undefined} key={documento.id}>
                  <td><strong>{documento.nombreArchivo}</strong></td>
                  <td>{documento.nombreActivo ? documento.nombreActivo : "Sin activo"}</td>
                  <td>
                    <span className={documento.usaSugerenciasIA ? "status status-activo" : "status status-inactivo"}>
                      {documento.usaSugerenciasIA ? "Sí" : "No"}
                    </span>
                  </td>
                  <td>{formatearFechaCorta(documento.creadoEn)}</td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Ver detalle"
                        className="boton-icono"
                        href={"/documentacion-tecnica/" + documento.id}
                        title="Ver detalle"
                      >
                        <IconoOjo />
                      </Link>
                      <a
                        aria-label="Descargar PDF"
                        className="boton-icono"
                        href={apiObtenerUrlDescargaDocumentoTecnico(documento.id)}
                        title="Descargar PDF"
                      >
                        <IconoDescarga />
                      </a>
                      {puedeGestionar ? (
                        <button
                          aria-label="Eliminar documento"
                          className="boton-icono boton-icono-peligro"
                          disabled={estaOcupado}
                          onClick={() => setDocumentoPendiente(documento)}
                          title="Eliminar documento"
                          type="button"
                        >
                          <IconoPapelera />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {documentoPendiente ? (
        <ModalConfirmacion
          descripcion={
            "¿Confirmás la eliminación de " +
            documentoPendiente.nombreArchivo +
            "? Si se usa para sugerencias de IA, también se borrarán sus fragmentos y embeddings."
          }
          estaConfirmando={enProcesoId === documentoPendiente.id}
          etiquetaConfirmar="Eliminar"
          onCancelar={() => setDocumentoPendiente(null)}
          onConfirmar={() => ejecutar(documentoPendiente.id, "inactivo")}
          titulo="Eliminar documento técnico"
        />
      ) : null}
    </>
  );
}
