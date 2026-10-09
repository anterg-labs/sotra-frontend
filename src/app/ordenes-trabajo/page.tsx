"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listarActivos } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import {
  formatearFechaPrevista,
  listarOrdenesTrabajo,
  listarTecnicos,
  obtenerEtiquetaEstadoOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import { obtenerIndicadores } from "@/servicios/servicio-reportes";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { estadosOrdenTrabajo } from "@/tipos/orden-trabajo";
import type { FiltrosOrdenesTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { FiltrosIndicadores, Indicadores } from "@/tipos/reporte";
import type { Usuario } from "@/tipos/usuario";
import { IconoLapiz, IconoOjo } from "@/componentes/iconos";

const filtrosVacios: FiltrosOrdenesTrabajo = {
  buscar: "",
  clienteId: "",
  activoId: "",
  tecnicoId: "",
  estado: "",
  prioridad: "",
  tipo: "",
  fechaDesde: "",
  fechaHasta: "",
  conSugerencias: false,
  pagina: 1,
};

const filtrosVaciosIndicadores: FiltrosIndicadores = {
  fechaDesde: "",
  fechaHasta: "",
  tecnicoId: "",
  clienteId: "",
  activoId: "",
  estado: "",
  tipo: "",
};

export default function PaginaOrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [resumen, setResumen] = useState<Indicadores | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosOrdenesTrabajo>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [activoId, setActivoId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [estado, setEstado] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [tipo, setTipo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [conSugerencias, setConSugerencias] = useState(false);

  async function cargarOrdenes(filtros: FiltrosOrdenesTrabajo) {
    setOrdenes(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarOrdenesTrabajo(filtros);
      setOrdenes(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch (error) {
      let mensaje = "No se pudo obtener el listado de órdenes de trabajo.";
      if (error instanceof Error) {
        mensaje = error.message;
      }
      setErrorCarga(mensaje);
    }
  }

  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        const paginaObtenida = await listarOrdenesTrabajo(filtrosVacios);
        setOrdenes(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de órdenes de trabajo.");
      }

      try {
        const resumenObtenido = await obtenerIndicadores(filtrosVaciosIndicadores);
        const clientesObtenidos = await listarClientes();
        const activosObtenidos = await listarActivos();
        const tecnicosObtenidos = await listarTecnicos();
        setResumen(resumenObtenido);
        setClientes(clientesObtenidos);
        setActivos(activosObtenidos);
        setTecnicos(tecnicosObtenidos);
      } catch {
        setErrorCarga("No se pudieron obtener las opciones de los filtros.");
      }
    }

    cargarDatosIniciales();
  }, []);

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosOrdenesTrabajo = {
      buscar: buscar,
      clienteId: clienteId,
      activoId: activoId,
      tecnicoId: tecnicoId,
      estado: estado,
      prioridad: prioridad,
      tipo: tipo,
      fechaDesde: fechaDesde,
      fechaHasta: fechaHasta,
      conSugerencias: conSugerencias,
      pagina: 1,
    };
    cargarOrdenes(filtros);
  }

  function limpiarFiltros() {
    setBuscar("");
    setClienteId("");
    setActivoId("");
    setTecnicoId("");
    setEstado("");
    setPrioridad("");
    setTipo("");
    setFechaDesde("");
    setFechaHasta("");
    setConSugerencias(false);
    cargarOrdenes(filtrosVacios);
  }

  function irAPagina(numeroPagina: number) {
    const filtros: FiltrosOrdenesTrabajo = {
      buscar: filtrosAplicados.buscar,
      clienteId: filtrosAplicados.clienteId,
      activoId: filtrosAplicados.activoId,
      tecnicoId: filtrosAplicados.tecnicoId,
      estado: filtrosAplicados.estado,
      prioridad: filtrosAplicados.prioridad,
      tipo: filtrosAplicados.tipo,
      fechaDesde: filtrosAplicados.fechaDesde,
      fechaHasta: filtrosAplicados.fechaHasta,
      conSugerencias: filtrosAplicados.conSugerencias,
      pagina: numeroPagina,
    };
    cargarOrdenes(filtros);
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

  function cambiarCliente(evento: React.ChangeEvent<HTMLSelectElement>) {
    setClienteId(evento.target.value);
    setActivoId("");
  }

  function cambiarActivo(evento: React.ChangeEvent<HTMLSelectElement>) {
    setActivoId(evento.target.value);
  }

  function cambiarTecnico(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTecnicoId(evento.target.value);
  }

  function cambiarEstado(evento: React.ChangeEvent<HTMLSelectElement>) {
    setEstado(evento.target.value);
  }

  function cambiarPrioridad(evento: React.ChangeEvent<HTMLSelectElement>) {
    setPrioridad(evento.target.value);
  }

  function cambiarTipo(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTipo(evento.target.value);
  }

  function cambiarFechaDesde(evento: React.ChangeEvent<HTMLInputElement>) {
    setFechaDesde(evento.target.value);
  }

  function cambiarFechaHasta(evento: React.ChangeEvent<HTMLInputElement>) {
    setFechaHasta(evento.target.value);
  }

  function cambiarConSugerencias(evento: React.ChangeEvent<HTMLInputElement>) {
    setConSugerencias(evento.target.checked);
  }

  function obtenerNombreVisibleDeActivo(activo: Activo) {
    if (activo.nombre !== null && activo.nombre.trim() !== "") {
      return activo.nombre;
    }

    return activo.numSerie;
  }

  function contarPorEstado(nombreEstado: string) {
    if (resumen === null) {
      return 0;
    }

    let cantidad = 0;
    for (const grupo of resumen.ordenesPorEstado) {
      if (grupo.nombre === nombreEstado) {
        cantidad = grupo.cantidad;
      }
    }
    return cantidad;
  }

  const activosDelCliente: Activo[] = [];
  for (const activo of activos) {
    if (clienteId === "" || String(activo.clienteId) === clienteId) {
      activosDelCliente.push(activo);
    }
  }

  let tarjetasResumen = null;
  if (resumen !== null) {
    tarjetasResumen = (
      <section aria-label="Resumen de órdenes de trabajo" className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="panel flex items-center justify-between px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Total de órdenes</p>
          <p className="text-xl font-bold">{resumen.totalOrdenes}</p>
        </article>
        <article className="panel flex items-center justify-between px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Creadas</p>
          <p className="text-xl font-bold">{contarPorEstado("creada")}</p>
        </article>
        <article className="panel flex items-center justify-between px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">En ejecución</p>
          <p className="text-xl font-bold">{contarPorEstado("en_ejecucion")}</p>
        </article>
        <article className="panel flex items-center justify-between px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Cerradas</p>
          <p className="text-xl font-bold">{contarPorEstado("cerrada")}</p>
        </article>
      </section>
    );
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (ordenes === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando órdenes de trabajo…</p>;
  }

  let mensajeSinResultados = null;
  if (ordenes !== null && ordenes.length === 0) {
    mensajeSinResultados = <p className="empty-state">No se encontraron órdenes de trabajo con los filtros aplicados.</p>;
  }

  let tablaOrdenes = null;
  if (ordenes !== null && ordenes.length > 0) {
    tablaOrdenes = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th>Activo</th>
              <th>Tipo</th>
              <th>Prioridad</th>
              <th>Técnico</th>
              <th>Estado</th>
              <th>Fecha prevista</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => {
              const claseEstado = "status status-" + orden.estado;
              const clasePrioridad = "status prioridad-" + orden.prioridad;

              let nombreTecnico = "Sin asignar";
              if (orden.nombreTecnico) {
                nombreTecnico = orden.nombreTecnico;
              }

              let enlaceModificar = null;
              if (orden.estado !== "cerrada") {
                enlaceModificar = (
                  <Link
                    aria-label="Modificar orden"
                    className="boton-icono"
                    href={"/ordenes-trabajo/" + orden.id + "/editar"}
                    title="Modificar orden"
                  >
                    <IconoLapiz />
                  </Link>
                );
              }

              return (
                <tr key={orden.id}>
                  <td><strong>{orden.id}</strong></td>
                  <td>{orden.nombreCliente}</td>
                  <td>{orden.nombreActivo}</td>
                  <td>{orden.tipo}</td>
                  <td>
                    <span className={clasePrioridad}>{orden.prioridad}</span>
                  </td>
                  <td>{nombreTecnico}</td>
                  <td>
                    <span className={claseEstado}>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</span>
                  </td>
                  <td>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Ver detalle"
                        className="boton-icono"
                        href={"/ordenes-trabajo/" + orden.id}
                        title="Ver detalle"
                      >
                        <IconoOjo />
                      </Link>
                      {enlaceModificar}
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
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " órdenes)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
          Siguiente
        </button>
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Órdenes de trabajo</h1>
        </div>
        <Link className="primary-button" href="/ordenes-trabajo/nuevo">
          Crear orden
        </Link>
      </header>

      {tarjetasResumen}

      <form aria-label="Búsqueda y filtros" className="barra-filtros" onSubmit={aplicarFiltros}>
        <div className="form-field campo-busqueda">
          <label htmlFor="buscar">Buscar</label>
          <input
            id="buscar"
            onChange={cambiarBuscar}
            placeholder="Número, descripción, cliente, activo o técnico"
            type="text"
            value={buscar}
          />
        </div>

        <div className="form-field">
          <label htmlFor="clienteId">Cliente</label>
          <select id="clienteId" onChange={cambiarCliente} value={clienteId}>
            <option value="">Todos los clientes</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="activoId">Activo</label>
          <select id="activoId" onChange={cambiarActivo} value={activoId}>
            <option value="">Todos los activos</option>
            {activosDelCliente.map((activo) => (
              <option key={activo.id} value={activo.id}>{obtenerNombreVisibleDeActivo(activo)}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="tecnicoId">Técnico</label>
          <select id="tecnicoId" onChange={cambiarTecnico} value={tecnicoId}>
            <option value="">Todos los técnicos</option>
            {tecnicos.map((tecnico) => (
              <option key={tecnico.id} value={tecnico.id}>{tecnico.nombre + " " + tecnico.apellido}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="estado">Estado</label>
          <select id="estado" onChange={cambiarEstado} value={estado}>
            <option value="">Todos los estados</option>
            {estadosOrdenTrabajo.map((estadoOrden) => (
              <option key={estadoOrden} value={estadoOrden}>{obtenerEtiquetaEstadoOrdenTrabajo(estadoOrden)}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="prioridad">Prioridad</label>
          <select id="prioridad" onChange={cambiarPrioridad} value={prioridad}>
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="tipo">Tipo de mantenimiento</label>
          <select id="tipo" onChange={cambiarTipo} value={tipo}>
            <option value="">Todos los tipos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="fechaDesde">Creada desde</label>
          <input id="fechaDesde" onChange={cambiarFechaDesde} type="date" value={fechaDesde} />
        </div>

        <div className="form-field">
          <label htmlFor="fechaHasta">Creada hasta</label>
          <input id="fechaHasta" onChange={cambiarFechaHasta} type="date" value={fechaHasta} />
        </div>

        <div className="form-field campo-casilla">
          <label className="flex items-center gap-2" htmlFor="conSugerencias">
            <input checked={conSugerencias} id="conSugerencias" onChange={cambiarConSugerencias} type="checkbox" />
            Solo con recomendaciones de IA
          </label>
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
        {tablaOrdenes}
        {paginacion}
      </section>
    </main>
  );
}
