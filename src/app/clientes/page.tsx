"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarCliente, listarClientesPaginados, reactivarCliente } from "@/servicios/servicio-clientes";
import type { Cliente, FiltrosClientes } from "@/tipos/cliente";
import { IconoLapiz, IconoOjo, IconoPapelera, IconoReactivar } from "@/componentes/iconos";

const filtrosVacios: FiltrosClientes = {
  buscar: "",
  estado: "",
  pagina: 1,
};

function obtenerEtiquetaEstado(estado: Cliente["estado"]) {
  if (estado === "activo") {
    return "Activo";
  }

  return "Inactivo";
}

export default function PaginaClientes() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [clienteDesactivandoId, setClienteDesactivandoId] = useState<number | null>(null);
  const [clientePendienteDesactivacion, setClientePendienteDesactivacion] = useState<Cliente | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosClientes>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  useEffect(() => {
    async function cargarClientes() {
      try {
        const paginaObtenida = await listarClientesPaginados(filtrosVacios);
        setClientes(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de clientes.");
      }
    }

    cargarClientes();
  }, []);

  async function cargarPagina(filtros: FiltrosClientes) {
    setClientes(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarClientesPaginados(filtros);
      setClientes(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch {
      setErrorCarga("No se pudo obtener el listado de clientes.");
    }
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosClientes = {
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
    const filtros: FiltrosClientes = {
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

  function pedirBajaCliente(cliente: Cliente) {
    setClientePendienteDesactivacion(cliente);
  }

  function cancelarBaja() {
    setClientePendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!clientePendienteDesactivacion) {
      return;
    }

    const clienteId = clientePendienteDesactivacion.id;
    setClienteDesactivandoId(clienteId);

    try {
      await desactivarCliente(clienteId);
      setClientePendienteDesactivacion(null);
      await cargarPagina(filtrosAplicados);
    } catch {
      setErrorCarga("No se pudo dar de baja al cliente seleccionado.");
    } finally {
      setClienteDesactivandoId(null);
    }
  }

  async function reactivarClienteSeleccionado(cliente: Cliente) {
    setClienteDesactivandoId(cliente.id);

    try {
      await reactivarCliente(cliente.id);
      await cargarPagina(filtrosAplicados);
    } catch {
      setErrorCarga("No se pudo reactivar al cliente seleccionado.");
    } finally {
      setClienteDesactivandoId(null);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (clientes === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando clientes…</p>;
  }

  let mensajeSinResultados = null;
  if (clientes !== null && clientes.length === 0) {
    mensajeSinResultados = <p className="empty-state">No se encontraron clientes con los filtros aplicados.</p>;
  }

  let tablaClientes = null;
  if (clientes !== null && clientes.length > 0) {
    tablaClientes = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Razón social</th>
              <th>Contacto</th>
              <th>Correo electrónico</th>
              <th>Teléfono</th>
              <th>Activos asociados</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => {
              let claseEstado = "status status-inactivo";
              if (cliente.estado === "activo") {
                claseEstado = "status status-activo";
              }

              let botonBaja = null;
              if (cliente.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="boton-icono boton-icono-peligro"
                    disabled={clienteDesactivandoId === cliente.id}
                    onClick={() => pedirBajaCliente(cliente)}
                    title="Dar de baja"
                    type="button"
                  >
                    <IconoPapelera />
                  </button>
                );
              }

              let botonPrincipal = (
                <Link
                  aria-label="Modificar cliente"
                  className="boton-icono"
                  href={"/clientes/" + cliente.id + "/editar"}
                  title="Modificar cliente"
                >
                  <IconoLapiz />
                </Link>
              );
              if (cliente.estado === "inactivo") {
                botonPrincipal = (
                  <button
                    aria-label="Reactivar cliente"
                    className="boton-icono"
                    disabled={clienteDesactivandoId === cliente.id}
                    onClick={() => reactivarClienteSeleccionado(cliente)}
                    title="Reactivar cliente"
                    type="button"
                  >
                    <IconoReactivar />
                  </button>
                );
              }

              return (
                <tr key={cliente.id}>
                  <td><strong>{cliente.razonSocial}</strong></td>
                  <td>{cliente.nombreContacto}</td>
                  <td>{cliente.correo}</td>
                  <td>{cliente.telefono}</td>
                  <td>{cliente.cantidadActivosAsociados}</td>
                  <td>
                    <span className={claseEstado}>{obtenerEtiquetaEstado(cliente.estado)}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Ver detalle"
                        className="boton-icono"
                        href={"/clientes/" + cliente.id}
                        title="Ver detalle"
                      >
                        <IconoOjo />
                      </Link>
                      {botonPrincipal}
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
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " clientes)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
          Siguiente
        </button>
      </div>
    );
  }

  let modalBaja = null;
  if (clientePendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          clientePendienteDesactivacion.razonSocial +
          "? El cliente quedará inactivo, pero sus datos seguirán disponibles."
        }
        estaConfirmando={clienteDesactivandoId === clientePendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja cliente"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Gestión de clientes</h1>
        </div>
        <Link className="primary-button" href="/clientes/nuevo">
          Registrar nuevo cliente
        </Link>
      </header>

      <form aria-label="Búsqueda y filtros" className="barra-filtros" onSubmit={aplicarFiltros}>
        <div className="form-field campo-busqueda">
          <label htmlFor="buscarCliente">Buscar</label>
          <input
            id="buscarCliente"
            onChange={cambiarBuscar}
            placeholder="Razón social, contacto o correo"
            type="text"
            value={buscar}
          />
        </div>
        <div className="form-field">
          <label htmlFor="estadoClienteFiltro">Estado</label>
          <select id="estadoClienteFiltro" onChange={cambiarEstadoFiltro} value={estadoFiltro}>
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
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
        {tablaClientes}
        {paginacion}
      </section>

      {modalBaja}
    </main>
  );
}
