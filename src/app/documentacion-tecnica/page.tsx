"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { listarActivos } from "@/servicios/servicio-activos";
import {
  eliminarDocumentoTecnico,
  listarDocumentosTecnicosPaginados,
  obtenerUrlDescargaDocumentoTecnico,
} from "@/servicios/servicio-documentos-tecnicos";
import type { Activo } from "@/tipos/activo";
import type { DocumentoTecnico, FiltrosDocumentosTecnicos } from "@/tipos/documento-tecnico";
import { IconoDescarga, IconoOjo, IconoPapelera } from "@/componentes/iconos";

const filtrosVacios: FiltrosDocumentosTecnicos = {
  buscar: "",
  activoId: "",
  pagina: 1,
};

export default function PaginaDocumentacionTecnica() {
  const [documentos, setDocumentos] = useState<DocumentoTecnico[] | null>(null);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [errorCarga, setErrorCarga] = useState("");
  const [documentoEliminandoId, setDocumentoEliminandoId] = useState<number | null>(null);
  const [documentoPendienteEliminacion, setDocumentoPendienteEliminacion] = useState<DocumentoTecnico | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosDocumentosTecnicos>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [activoIdFiltro, setActivoIdFiltro] = useState("");

  useEffect(() => {
    async function cargarDocumentos() {
      try {
        const paginaObtenida = await listarDocumentosTecnicosPaginados(filtrosVacios);
        setDocumentos(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de documentos técnicos.");
      }

      try {
        const activosObtenidos = await listarActivos();
        setActivos(activosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de activos para el filtro.");
      }
    }

    cargarDocumentos();
  }, []);

  async function cargarPagina(filtros: FiltrosDocumentosTecnicos) {
    setDocumentos(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarDocumentosTecnicosPaginados(filtros);
      setDocumentos(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch {
      setErrorCarga("No se pudo obtener el listado de documentos técnicos.");
    }
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosDocumentosTecnicos = {
      buscar: buscar,
      activoId: activoIdFiltro,
      pagina: 1,
    };
    cargarPagina(filtros);
  }

  function limpiarFiltros() {
    setBuscar("");
    setActivoIdFiltro("");
    cargarPagina(filtrosVacios);
  }

  function irAPagina(numeroPagina: number) {
    const filtros: FiltrosDocumentosTecnicos = {
      buscar: filtrosAplicados.buscar,
      activoId: filtrosAplicados.activoId,
      pagina: numeroPagina,
    };
    cargarPagina(filtros);
  }

  function irAPaginaAnterior() {
    irAPagina(paginaActual - 1);
  }

  function irAPaginaSiguiente() {
    irAPagina(paginaActual + 1);
  }

  function cambiarBuscar(evento: React.ChangeEvent<HTMLInputElement>) {
    setBuscar(evento.target.value);
  }

  function cambiarActivoFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setActivoIdFiltro(evento.target.value);
  }

  function obtenerNombreVisibleDeActivo(activo: Activo) {
    if (activo.nombre !== null && activo.nombre.trim() !== "") {
      return activo.nombre;
    }

    return activo.numSerie;
  }

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
      setDocumentoPendienteEliminacion(null);
      await cargarPagina(filtrosAplicados);
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
    mensajeSinResultados = <p className="empty-state">No se encontraron documentos técnicos con los filtros aplicados.</p>;
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
                        href={obtenerUrlDescargaDocumentoTecnico(documento.id)}
                        title="Descargar PDF"
                      >
                        <IconoDescarga />
                      </a>
                      <button
                        aria-label="Eliminar documento"
                        className="boton-icono boton-icono-peligro"
                        disabled={documentoEliminandoId === documento.id}
                        onClick={() => pedirEliminacionDocumento(documento)}
                        title="Eliminar documento"
                        type="button"
                      >
                        <IconoPapelera />
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

  let paginacion = null;
  if (totalPaginas > 1) {
    paginacion = (
      <div className="pagination">
        <button disabled={paginaActual <= 1} onClick={irAPaginaAnterior} type="button">
          Anterior
        </button>
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " documentos)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
          Siguiente
        </button>
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

      <form aria-label="Búsqueda y filtros" className="barra-filtros" onSubmit={aplicarFiltros}>
        <div className="form-field campo-busqueda">
          <label htmlFor="buscarDocumento">Buscar</label>
          <input
            id="buscarDocumento"
            onChange={cambiarBuscar}
            placeholder="Nombre del archivo o del activo"
            type="text"
            value={buscar}
          />
        </div>
        <div className="form-field">
          <label htmlFor="activoDocumentoFiltro">Activo asociado</label>
          <select id="activoDocumentoFiltro" onChange={cambiarActivoFiltro} value={activoIdFiltro}>
            <option value="">Todos los activos</option>
            {activos.map((activo) => (
              <option key={activo.id} value={activo.id}>{obtenerNombreVisibleDeActivo(activo)}</option>
            ))}
          </select>
        </div>
        <div className="barra-filtros-acciones">
          <button className="secondary-button" onClick={limpiarFiltros} type="button">
            Limpiar filtros
          </button>
          <button className="primary-button" type="submit">
            Aplicar filtros
          </button>
        </div>
      </form>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaDocumentos}
        {paginacion}
      </section>

      {modalEliminacion}
    </main>
  );
}
