"use client";

import Link from "next/link";
import { IconoDescarga, IconoOjo, IconoPapelera } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { useCambioEstadoConfirmado } from "@/componentes/listado/use-cambio-estado-confirmado";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { apiObtenerUrlDescargaDocumentoTecnico } from "@/servicios/api/api-documentos-tecnicos";
import { obtenerEtiquetaTipoDocumento, type DocumentoTecnico, type FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
import { EstadoSugerenciasIa } from "./estado-procesamiento";
import { eliminarDocumentoTecnicoAccion } from "./acciones";
import { construirUrlDocumentos } from "./filtros";
import { formatearFechaCorta } from "@/utilidades/fechas";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";

function descripcionDeAsociacion(documento: DocumentoTecnico) {
  const partes = [documento.nombreActivo, documento.nombreModelo].filter((parte): parte is string => Boolean(parte));
  return partes.length > 0 ? partes.join(" · ") : "General";
}

/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  titulo: (fila: DocumentoTecnico): ValorOrdenable => fila.titulo,
  tipo: (fila: DocumentoTecnico): ValorOrdenable => fila.tipo,
  vigente: (fila: DocumentoTecnico): ValorOrdenable => fila.vigente,
  nombreAsociado: (fila: DocumentoTecnico): ValorOrdenable => fila.nombreActivo ?? fila.nombreModelo,
  usaSugerenciasIA: (fila: DocumentoTecnico): ValorOrdenable => fila.usaSugerenciasIA,
  creadoEn: (fila: DocumentoTecnico): ValorOrdenable => Date.parse(fila.creadoEn),
};

/** Tabla del listado: recibe los documentos ya cargados en el servidor y maneja la eliminación con confirmación. */
export function TablaDocumentos(props: { documentos: DocumentoTecnico[]; filtros: FiltrosDocumentosTecnicos; unaSolaPagina?: boolean }) {
  const documentos = useFilasConOrdenInstantaneo(props.documentos, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const puedeGestionar = useTienePermiso("documento.gestionar");
  const { filtros } = props;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable
      columna={clave}
      construirUrl={(orden) => construirUrlDocumentos({ ...filtros, ...orden, pagina: 1 })}
      etiqueta={etiqueta}
      orden={filtros}
    />
  );
  const { enProcesoId, pedirBaja, modales } = useCambioEstadoConfirmado<DocumentoTecnico>((id) => eliminarDocumentoTecnicoAccion(id), {
    mensajeBaja: "Documento eliminado.",
    tituloBaja: "Eliminar documento",
    etiquetaBaja: "Eliminar",
    descripcionBaja: (documento) =>
      "¿Confirmás la eliminación de " + documento.titulo + "? Si se usa para sugerencias de IA, también se borrarán sus fragmentos y embeddings.",
  });

  return (
    <>
      <ContenedorTabla etiqueta="Listado de documentación">
        <table>
          <thead>
            <tr>
              {columna("titulo", "Documento")}
              {columna("tipo", "Tipo")}
              {columna("vigente", "Vigencia")}
              {columna("nombreAsociado", "Asociado a")}
              {columna("usaSugerenciasIA", "Sugerencias de IA")}
              {columna("creadoEn", "Fecha de carga")}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map((documento) => {
              const estaOcupado = enProcesoId === documento.id;
              return (
                <tr aria-busy={estaOcupado || undefined} className={estaOcupado ? "opacity-60" : undefined} key={documento.id}>
                  <td>
                    <strong>{documento.titulo}</strong>
                    {documento.titulo !== documento.nombreArchivo ? <span>{documento.nombreArchivo}</span> : null}
                  </td>
                  <td>{obtenerEtiquetaTipoDocumento(documento.tipo)}</td>
                  <td>
                    <span className={documento.vigente ? "status status-activo" : "status status-inactivo"}>
                      {documento.vigente ? "Vigente" : "Obsoleto"}
                    </span>
                  </td>
                  <td>{descripcionDeAsociacion(documento)}</td>
                  <td>
                    <EstadoSugerenciasIa documento={documento} />
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
                          onClick={() => pedirBaja(documento)}
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
      </ContenedorTabla>

      {modales}
    </>
  );
}
