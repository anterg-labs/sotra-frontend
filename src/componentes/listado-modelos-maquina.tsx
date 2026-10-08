"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarModeloMaquina, listarModelosMaquinaPaginados } from "@/servicios/servicio-modelos-maquina";
import { listarTiposMaquina } from "@/servicios/servicio-tipos-maquina";
import type { FiltrosModelosMaquina, ModeloMaquina } from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

const filtrosVacios: FiltrosModelosMaquina = {
  buscar: "",
  tipoMaquinaId: "",
  estado: "",
  pagina: 1,
};

export function ListadoModelosMaquina() {
  const [modelosMaquina, setModelosMaquina] = useState<ModeloMaquina[] | null>(null);
  const [tiposMaquina, setTiposMaquina] = useState<TipoMaquina[]>([]);
  const [errorCarga, setErrorCarga] = useState("");
  const [modeloDesactivandoId, setModeloDesactivandoId] = useState<number | null>(null);
  const [modeloPendienteDesactivacion, setModeloPendienteDesactivacion] = useState<ModeloMaquina | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosModelosMaquina>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [tipoMaquinaIdFiltro, setTipoMaquinaIdFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  useEffect(() => {
    async function cargarModelosMaquina() {
      try {
        const paginaObtenida = await listarModelosMaquinaPaginados(filtrosVacios);
        const tiposObtenidos = await listarTiposMaquina();
        setTiposMaquina(tiposObtenidos);
        setModelosMaquina(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de modelos de máquina.");
      }
    }

    cargarModelosMaquina();
  }, []);

  async function cargarPagina(filtros: FiltrosModelosMaquina) {
    setModelosMaquina(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarModelosMaquinaPaginados(filtros);
      setModelosMaquina(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch {
      setErrorCarga("No se pudo obtener el listado de modelos de máquina.");
    }
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosModelosMaquina = {
      buscar: buscar,
      tipoMaquinaId: tipoMaquinaIdFiltro,
      estado: estadoFiltro,
      pagina: 1,
    };
    cargarPagina(filtros);
  }

  function limpiarFiltros() {
    setBuscar("");
    setTipoMaquinaIdFiltro("");
    setEstadoFiltro("");
    cargarPagina(filtrosVacios);
  }

  function irAPagina(numeroPagina: number) {
    const filtros: FiltrosModelosMaquina = {
      buscar: filtrosAplicados.buscar,
      tipoMaquinaId: filtrosAplicados.tipoMaquinaId,
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

  function cambiarTipoFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTipoMaquinaIdFiltro(evento.target.value);
  }

  function cambiarEstadoFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setEstadoFiltro(evento.target.value);
  }

  function obtenerNombreTipo(tipoMaquinaId: number) {
    for (const tipoMaquina of tiposMaquina) {
      if (tipoMaquina.id === tipoMaquinaId) {
        return tipoMaquina.nombre;
      }
    }

    return "Sin tipo";
  }

  function pedirBajaModelo(modeloMaquina: ModeloMaquina) {
    setModeloPendienteDesactivacion(modeloMaquina);
  }

  function cancelarBaja() {
    setModeloPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!modeloPendienteDesactivacion) {
      return;
    }

    const modeloMaquinaId = modeloPendienteDesactivacion.id;
    setModeloDesactivandoId(modeloMaquinaId);

    try {
      await desactivarModeloMaquina(modeloMaquinaId);
      setModeloPendienteDesactivacion(null);
      await cargarPagina(filtrosAplicados);
    } catch {
      setErrorCarga("No se pudo dar de baja el modelo de máquina seleccionado.");
    } finally {
      setModeloDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (modelosMaquina === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando modelos de máquina…</p>;
  }

  let mensajeSinResultados = null;
  if (modelosMaquina !== null && modelosMaquina.length === 0) {
    mensajeSinResultados = <p className="empty-state">No se encontraron modelos de máquina con los filtros aplicados.</p>;
  }

  let tablaModelos = null;
  if (modelosMaquina !== null && modelosMaquina.length > 0) {
    tablaModelos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {modelosMaquina.map((modeloMaquina) => {
              let claseEstado = "status status-inactivo";
              let textoEstado = "Inactivo";
              if (modeloMaquina.estado === "activo") {
                claseEstado = "status status-activo";
                textoEstado = "Activo";
              }

              let botonBaja = null;
              if (modeloMaquina.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={modeloDesactivandoId === modeloMaquina.id}
                    onClick={() => pedirBajaModelo(modeloMaquina)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              return (
                <tr key={modeloMaquina.id}>
                  <td><strong>{modeloMaquina.nombre}</strong></td>
                  <td>{obtenerNombreTipo(modeloMaquina.tipoMaquinaId)}</td>
                  <td>{modeloMaquina.descripcion}</td>
                  <td>
                    <span className={claseEstado}>{textoEstado}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Ver detalle"
                        className="table-action-link"
                        href={"/activos/modelos/" + modeloMaquina.id}
                        title="Ver detalle"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        aria-label="Modificar modelo de máquina"
                        className="table-action-link"
                        href={"/activos/modelos/" + modeloMaquina.id + "/editar"}
                        title="Modificar modelo de máquina"
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
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " modelos)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
          Siguiente
        </button>
      </div>
    );
  }

  let modalBaja = null;
  if (modeloPendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          modeloPendienteDesactivacion.nombre +
          "? El modelo no se elimina, pero ya no se podrá usar en activos nuevos."
        }
        estaConfirmando={modeloDesactivandoId === modeloPendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja modelo de máquina"
      />
    );
  }

  return (
    <div className="mb-8">
      <header className="page-heading">
        <div>
          <h2>Modelos de máquina</h2>
        </div>
        <Link className="primary-button" href="/activos/modelos/nuevo">
          Registrar modelo
        </Link>
      </header>

      <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={aplicarFiltros}>
        <div className="form-field">
          <label htmlFor="buscarModelo">Buscar modelo</label>
          <input id="buscarModelo" onChange={cambiarBuscar} placeholder="Nombre o descripción" type="text" value={buscar} />
        </div>
        <div className="form-field">
          <label htmlFor="tipoModeloFiltro">Tipo</label>
          <select id="tipoModeloFiltro" onChange={cambiarTipoFiltro} value={tipoMaquinaIdFiltro}>
            <option value="">Todos los tipos</option>
            {tiposMaquina.map((tipoMaquina) => (
              <option key={tipoMaquina.id} value={tipoMaquina.id}>{tipoMaquina.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="estadoModeloFiltro">Estado del modelo</label>
          <select id="estadoModeloFiltro" onChange={cambiarEstadoFiltro} value={estadoFiltro}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <button className="secondary-button" onClick={limpiarFiltros} type="button">
          Limpiar
        </button>
        <button className="primary-button" type="submit">
          Filtrar modelos
        </button>
      </form>

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaModelos}
        {paginacion}
      </section>

      {modalBaja}
    </div>
  );
}
