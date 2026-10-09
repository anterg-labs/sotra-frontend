"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListadoModelosMaquina } from "@/componentes/listado-modelos-maquina";
import { ListadoTiposMaquina } from "@/componentes/listado-tipos-maquina";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarActivo, listarActivosPaginados } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import { listarModelosMaquina } from "@/servicios/servicio-modelos-maquina";
import type { Activo, FiltrosActivos } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";

const filtrosVacios: FiltrosActivos = {
  buscar: "",
  clienteId: "",
  modeloMaquinaId: "",
  estado: "",
  pagina: 1,
};

function obtenerEtiquetaEstado(estado: Activo["estado"]) {
  if (estado === "activo") {
    return "Activo";
  }

  return "Inactivo";
}

export default function PaginaActivos() {
  const [activos, setActivos] = useState<Activo[] | null>(null);
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [modelosMaquina, setModelosMaquina] = useState<ModeloMaquina[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [activoDesactivandoId, setActivoDesactivandoId] = useState<number | null>(null);
  const [activoPendienteDesactivacion, setActivoPendienteDesactivacion] = useState<Activo | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosActivos>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [clienteIdFiltro, setClienteIdFiltro] = useState("");
  const [modeloMaquinaIdFiltro, setModeloMaquinaIdFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  useEffect(() => {
    async function cargarActivos() {
      try {
        const paginaObtenida = await listarActivosPaginados(filtrosVacios);
        const clientesObtenidos = await listarClientes();
        const modelosObtenidos = await listarModelosMaquina();
        setActivos(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
        setClientes(clientesObtenidos);
        setModelosMaquina(modelosObtenidos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de activos.");
      }
    }

    cargarActivos();
  }, []);

  async function cargarPagina(filtros: FiltrosActivos) {
    setActivos(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarActivosPaginados(filtros);
      setActivos(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch {
      setErrorCarga("No se pudo obtener el listado de activos.");
    }
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosActivos = {
      buscar: buscar,
      clienteId: clienteIdFiltro,
      modeloMaquinaId: modeloMaquinaIdFiltro,
      estado: estadoFiltro,
      pagina: 1,
    };
    cargarPagina(filtros);
  }

  function limpiarFiltros() {
    setBuscar("");
    setClienteIdFiltro("");
    setModeloMaquinaIdFiltro("");
    setEstadoFiltro("");
    cargarPagina(filtrosVacios);
  }

  function irAPagina(numeroPagina: number) {
    const filtros: FiltrosActivos = {
      buscar: filtrosAplicados.buscar,
      clienteId: filtrosAplicados.clienteId,
      modeloMaquinaId: filtrosAplicados.modeloMaquinaId,
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

  function cambiarClienteFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setClienteIdFiltro(evento.target.value);
  }

  function cambiarModeloFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setModeloMaquinaIdFiltro(evento.target.value);
  }

  function cambiarEstadoFiltro(evento: React.ChangeEvent<HTMLSelectElement>) {
    setEstadoFiltro(evento.target.value);
  }

  function pedirBajaActivo(activo: Activo) {
    setActivoPendienteDesactivacion(activo);
  }

  function cancelarBaja() {
    setActivoPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!activoPendienteDesactivacion) {
      return;
    }

    const activoId = activoPendienteDesactivacion.id;
    setActivoDesactivandoId(activoId);

    try {
      await desactivarActivo(activoId);
      setActivoPendienteDesactivacion(null);
      await cargarPagina(filtrosAplicados);
    } catch {
      setErrorCarga("No se pudo dar de baja al activo seleccionado.");
    } finally {
      setActivoDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if ((activos === null || clientes === null || modelosMaquina === null) && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando activos…</p>;
  }

  let mensajeSinResultados = null;
  if (activos !== null && activos.length === 0) {
    mensajeSinResultados = <p className="empty-state">No se encontraron activos con los filtros aplicados.</p>;
  }

  let tablaActivos = null;
  if (activos !== null && activos.length > 0 && clientes !== null && modelosMaquina !== null) {
    tablaActivos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre del activo</th>
              <th>Número de serie</th>
              <th>Cliente</th>
              <th>Modelo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {activos.map((activo) => {
              let claseEstado = "status status-inactivo";
              if (activo.estado === "activo") {
                claseEstado = "status status-activo";
              }

              let botonBaja = null;
              if (activo.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={activoDesactivandoId === activo.id}
                    onClick={() => pedirBajaActivo(activo)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              let nombreCliente = "Cliente " + activo.clienteId;
              for (const cliente of clientes) {
                if (cliente.id === activo.clienteId) {
                  nombreCliente = cliente.razonSocial;
                }
              }

              let nombreModelo = "Modelo " + activo.modeloMaquinaId;
              for (const modeloMaquina of modelosMaquina) {
                if (modeloMaquina.id === activo.modeloMaquinaId) {
                  nombreModelo = modeloMaquina.nombre;
                }
              }

              let nombreActivo = "Sin nombre";
              if (activo.nombre !== null) {
                nombreActivo = activo.nombre;
              }

              return (
                <tr key={activo.id}>
                  <td><strong>{nombreActivo}</strong></td>
                  <td>{activo.numSerie}</td>
                  <td>{nombreCliente}</td>
                  <td>{nombreModelo}</td>
                  <td>
                    <span className={claseEstado}>{obtenerEtiquetaEstado(activo.estado)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Ver detalle"
                        className="table-action-link"
                        href={"/activos/" + activo.id}
                        title="Ver detalle"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        aria-label="Modificar activo"
                        className="table-action-link"
                        href={"/activos/" + activo.id + "/editar"}
                        title="Modificar activo"
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
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " activos)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
          Siguiente
        </button>
      </div>
    );
  }

  let opcionesClientes = null;
  if (clientes !== null) {
    opcionesClientes = clientes.map((cliente) => (
      <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
    ));
  }

  let opcionesModelos = null;
  if (modelosMaquina !== null) {
    opcionesModelos = modelosMaquina.map((modeloMaquina) => (
      <option key={modeloMaquina.id} value={modeloMaquina.id}>{modeloMaquina.nombre}</option>
    ));
  }

  let modalBaja = null;
  if (activoPendienteDesactivacion) {
    let nombreActivoPendiente = "el activo seleccionado";
    if (activoPendienteDesactivacion.nombre !== null) {
      nombreActivoPendiente = activoPendienteDesactivacion.nombre;
    }

    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          nombreActivoPendiente +
          "? El activo quedará inactivo, pero sus datos seguirán disponibles."
        }
        estaConfirmando={activoDesactivandoId === activoPendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja activo"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Gestión de activos</h1>
        </div>
        <Link className="primary-button" href="/activos/nuevo">
          Registrar nuevo activo
        </Link>
      </header>

      <form className="panel form-panel mb-6" onSubmit={aplicarFiltros}>
        <div className="panel-heading">
          <h2>Búsqueda y filtros de activos</h2>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="buscarActivo">Buscar</label>
            <input
              id="buscarActivo"
              onChange={cambiarBuscar}
              placeholder="Nombre, número de serie, ubicación o descripción"
              type="text"
              value={buscar}
            />
          </div>
          <div className="form-field">
            <label htmlFor="clienteFiltro">Cliente</label>
            <select id="clienteFiltro" onChange={cambiarClienteFiltro} value={clienteIdFiltro}>
              <option value="">Todos los clientes</option>
              {opcionesClientes}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="modeloFiltro">Modelo</label>
            <select id="modeloFiltro" onChange={cambiarModeloFiltro} value={modeloMaquinaIdFiltro}>
              <option value="">Todos los modelos</option>
              {opcionesModelos}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="estadoActivoFiltro">Estado</label>
            <select id="estadoActivoFiltro" onChange={cambiarEstadoFiltro} value={estadoFiltro}>
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button className="secondary-button" onClick={limpiarFiltros} type="button">
            Limpiar filtros
          </button>
          <button className="primary-button" type="submit">
            Aplicar filtros
          </button>
        </div>
      </form>

      <section className="panel mb-8">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaActivos}
        {paginacion}
      </section>

      <ListadoModelosMaquina />
      <ListadoTiposMaquina />

      {modalBaja}
    </main>
  );
}
