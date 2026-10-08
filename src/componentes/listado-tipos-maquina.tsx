"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarTipoMaquina, listarTiposMaquinaPaginados } from "@/servicios/servicio-tipos-maquina";
import type { FiltrosTiposMaquina, TipoMaquina } from "@/tipos/tipo-maquina";

const filtrosVacios: FiltrosTiposMaquina = {
  buscar: "",
  estado: "",
  pagina: 1,
};

export function ListadoTiposMaquina() {
  const [tiposMaquina, setTiposMaquina] = useState<TipoMaquina[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [tipoDesactivandoId, setTipoDesactivandoId] = useState<number | null>(null);
  const [tipoPendienteDesactivacion, setTipoPendienteDesactivacion] = useState<TipoMaquina | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosTiposMaquina>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  useEffect(() => {
    async function cargarTiposMaquina() {
      try {
        const paginaObtenida = await listarTiposMaquinaPaginados(filtrosVacios);
        setTiposMaquina(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de tipos de máquina.");
      }
    }

    cargarTiposMaquina();
  }, []);

  async function cargarPagina(filtros: FiltrosTiposMaquina) {
    setTiposMaquina(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarTiposMaquinaPaginados(filtros);
      setTiposMaquina(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch {
      setErrorCarga("No se pudo obtener el listado de tipos de máquina.");
    }
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosTiposMaquina = {
      buscar: buscar,
      estado: estadoFiltro,
      pagina: 1,
    };
    cargarPagina(filtros);
  }

  function limpiarFiltros() {
    setBuscar("");
    setEstadoFiltro("");
    cargarPagina(filtrosVacios);
  }

  function irAPagina(numeroPagina: number) {
    const filtros: FiltrosTiposMaquina = {
      buscar: filtrosAplicados.buscar,
      estado: filtrosAplicados.estado,
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

  function cambiarEstadoFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setEstadoFiltro(evento.target.value);
  }

  function pedirBajaTipo(tipoMaquina: TipoMaquina) {
    setTipoPendienteDesactivacion(tipoMaquina);
  }

  function cancelarBaja() {
    setTipoPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!tipoPendienteDesactivacion) {
      return;
    }

    const tipoMaquinaId = tipoPendienteDesactivacion.id;
    setTipoDesactivandoId(tipoMaquinaId);

    try {
      await desactivarTipoMaquina(tipoMaquinaId);
      setTipoPendienteDesactivacion(null);
      await cargarPagina(filtrosAplicados);
    } catch {
      setErrorCarga("No se pudo dar de baja el tipo de máquina seleccionado.");
    } finally {
      setTipoDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (tiposMaquina === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando tipos de máquina…</p>;
  }

  let mensajeSinResultados = null;
  if (tiposMaquina !== null && tiposMaquina.length === 0) {
    mensajeSinResultados = <p className="empty-state">No se encontraron tipos de máquina con los filtros aplicados.</p>;
  }

  let tablaTipos = null;
  if (tiposMaquina !== null && tiposMaquina.length > 0) {
    tablaTipos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tiposMaquina.map((tipoMaquina) => {
              let claseEstado = "status status-inactivo";
              let textoEstado = "Inactivo";
              if (tipoMaquina.estado === "activo") {
                claseEstado = "status status-activo";
                textoEstado = "Activo";
              }

              let botonBaja = null;
              if (tipoMaquina.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={tipoDesactivandoId === tipoMaquina.id}
                    onClick={() => pedirBajaTipo(tipoMaquina)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              return (
                <tr key={tipoMaquina.id}>
                  <td><strong>{tipoMaquina.nombre}</strong></td>
                  <td>
                    <span className={claseEstado}>{textoEstado}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Ver detalle"
                        className="table-action-link"
                        href={"/activos/tipos/" + tipoMaquina.id}
                        title="Ver detalle"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        aria-label="Modificar tipo de máquina"
                        className="table-action-link"
                        href={"/activos/tipos/" + tipoMaquina.id + "/editar"}
                        title="Modificar tipo de máquina"
                      >
                        Modificar
                      </Link>
                      {botonBaja}
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
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " tipos)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
          Siguiente
        </button>
      </div>
    );
  }

  let modalBaja = null;
  if (tipoPendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          tipoPendienteDesactivacion.nombre +
          "? El tipo no se elimina, pero ya no se podrá usar en modelos nuevos."
        }
        estaConfirmando={tipoDesactivandoId === tipoPendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja tipo de máquina"
      />
    );
  }

  return (
    <div className="mb-8">
      <header className="page-heading">
        <div>
          <h2>Tipos de máquina</h2>
        </div>
        <Link className="primary-button" href="/activos/tipos/nuevo">
          Registrar tipo
        </Link>
      </header>

      <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={aplicarFiltros}>
        <div className="form-field">
          <label htmlFor="buscarTipo">Buscar tipo</label>
          <input id="buscarTipo" onChange={cambiarBuscar} placeholder="Nombre" type="text" value={buscar} />
        </div>
        <div className="form-field">
          <label htmlFor="estadoTipoFiltro">Estado del tipo</label>
          <select id="estadoTipoFiltro" onChange={cambiarEstadoFiltro} value={estadoFiltro}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <button className="secondary-button" onClick={limpiarFiltros} type="button">
          Limpiar
        </button>
        <button className="primary-button" type="submit">
          Filtrar tipos
        </button>
      </form>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaTipos}
        {paginacion}
      </section>

      {modalBaja}
    </div>
  );
}
