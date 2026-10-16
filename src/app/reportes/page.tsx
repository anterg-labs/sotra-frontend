"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listarActivos } from "@/servicios/servicio-activos";
import { listarClientes } from "@/servicios/servicio-clientes";
import { listarTecnicos, obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import { obtenerIndicadores, obtenerUrlReportePdf, tiposDeReporte } from "@/servicios/servicio-reportes";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { estadosOrdenTrabajo } from "@/tipos/orden-trabajo";
import type { CantidadPorGrupo, FiltrosIndicadores, Indicadores } from "@/tipos/reporte";
import type { Usuario } from "@/tipos/usuario";
import { IconoOjo } from "@/componentes/iconos";

const filtrosVacios: FiltrosIndicadores = {
  fechaDesde: "",
  fechaHasta: "",
  tecnicoId: "",
  clienteId: "",
  activoId: "",
  estado: "",
  tipo: "",
};

export default function PaginaReportes() {
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [activoId, setActivoId] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [tipoReporte, setTipoReporte] = useState("ordenes-trabajo");
  const [prioridadReporte, setPrioridadReporte] = useState("");

  async function cargarIndicadores(filtros: FiltrosIndicadores) {
    setIndicadores(null);
    setErrorCarga("");

    try {
      const indicadoresObtenidos = await obtenerIndicadores(filtros);
      setIndicadores(indicadoresObtenidos);
    } catch (error) {
      let mensaje = "No se pudieron obtener los indicadores.";
      if (error instanceof Error) {
        mensaje = error.message;
      }
      setErrorCarga(mensaje);
    }
  }

  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        const tecnicosObtenidos = await listarTecnicos();
        const clientesObtenidos = await listarClientes();
        const activosObtenidos = await listarActivos();
        setTecnicos(tecnicosObtenidos);
        setClientes(clientesObtenidos);
        setActivos(activosObtenidos);
      } catch {
        setErrorCarga("No se pudieron obtener las opciones de los filtros.");
      }

      try {
        const indicadoresObtenidos = await obtenerIndicadores(filtrosVacios);
        setIndicadores(indicadoresObtenidos);
      } catch {
        setErrorCarga("No se pudieron obtener los indicadores.");
      }
    }

    cargarDatosIniciales();
  }, []);

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosIndicadores = {
      fechaDesde: fechaDesde,
      fechaHasta: fechaHasta,
      tecnicoId: tecnicoId,
      clienteId: clienteId,
      activoId: activoId,
      estado: estado,
      tipo: tipo,
    };
    cargarIndicadores(filtros);
  }

  function limpiarFiltros() {
    setFechaDesde("");
    setFechaHasta("");
    setTecnicoId("");
    setClienteId("");
    setActivoId("");
    setEstado("");
    setTipo("");
    cargarIndicadores(filtrosVacios);
  }

  function cambiarFechaDesde(evento: React.ChangeEvent<HTMLInputElement>) {
    setFechaDesde(evento.target.value);
  }

  function cambiarFechaHasta(evento: React.ChangeEvent<HTMLInputElement>) {
    setFechaHasta(evento.target.value);
  }

  function cambiarTecnico(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTecnicoId(evento.target.value);
  }

  function cambiarCliente(evento: React.ChangeEvent<HTMLSelectElement>) {
    setClienteId(evento.target.value);
    setActivoId("");
  }

  function cambiarActivo(evento: React.ChangeEvent<HTMLSelectElement>) {
    setActivoId(evento.target.value);
  }

  function cambiarEstado(evento: React.ChangeEvent<HTMLSelectElement>) {
    setEstado(evento.target.value);
  }

  function cambiarTipo(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTipo(evento.target.value);
  }

  function cambiarTipoReporte(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTipoReporte(evento.target.value);
  }

  function cambiarPrioridadReporte(evento: React.ChangeEvent<HTMLSelectElement>) {
    setPrioridadReporte(evento.target.value);
  }

  function obtenerNombreVisibleDeActivo(activo: Activo) {
    if (activo.nombre !== null && activo.nombre.trim() !== "") {
      return activo.nombre;
    }

    return activo.numSerie;
  }

  function formatearHoras(horas: number | null) {
    if (horas === null) {
      return "Sin datos";
    }

    return horas + " h";
  }

  function obtenerNombreTecnico(nombreTecnico: string | null) {
    if (nombreTecnico === null) {
      return "Sin asignar";
    }

    return nombreTecnico;
  }

  const filtrosParaReporte: FiltrosIndicadores = {
    fechaDesde: fechaDesde,
    fechaHasta: fechaHasta,
    tecnicoId: tecnicoId,
    clienteId: clienteId,
    activoId: activoId,
    estado: estado,
    tipo: tipo,
  };

  const activosDelCliente: Activo[] = [];
  for (const activo of activos) {
    if (clienteId === "" || String(activo.clienteId) === clienteId) {
      activosDelCliente.push(activo);
    }
  }

  function dibujarTablaGrupos(titulo: string, columna: string, grupos: CantidadPorGrupo[]) {
    let contenido = <p className="empty-state">No hay datos registrados.</p>;
    if (grupos.length > 0) {
      contenido = (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{columna}</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <tr key={grupo.nombre}>
                  <td>{grupo.nombre}</td>
                  <td>{grupo.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <section className="panel">
        <div className="panel-heading">
          <h2>{titulo}</h2>
        </div>
        {contenido}
      </section>
    );
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (indicadores === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando indicadores…</p>;
  }

  let contenidoIndicadores = null;
  if (indicadores !== null) {
    let tablaRepuestos = <p className="empty-state">No hay repuestos con bajo stock.</p>;
    if (indicadores.repuestosBajoStock.length > 0) {
      tablaRepuestos = (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Mínima</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.repuestosBajoStock.map((repuesto) => (
                <tr key={repuesto.id}>
                  <td><strong>{repuesto.codigo}</strong></td>
                  <td>{repuesto.nombre}</td>
                  <td>{repuesto.cantidad}</td>
                  <td>{repuesto.cantidadMinima}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    let tablaOrdenesRecientes = <p className="empty-state">No hay órdenes de trabajo registradas.</p>;
    if (indicadores.ordenesRecientes.length > 0) {
      tablaOrdenesRecientes = (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Cliente</th>
                <th>Activo</th>
                <th>Técnico</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.ordenesRecientes.map((orden) => (
                <tr key={orden.id}>
                  <td><strong>{orden.id}</strong></td>
                  <td>{orden.nombreCliente}</td>
                  <td>{orden.nombreActivo}</td>
                  <td>{obtenerNombreTecnico(orden.nombreTecnico)}</td>
                  <td>{orden.prioridad}</td>
                  <td>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</td>
                  <td>
                    <Link aria-label="Ver detalle" className="boton-icono" href={"/ordenes-trabajo/" + orden.id} title="Ver detalle">
                      <IconoOjo />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    contenidoIndicadores = (
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2>Órdenes de trabajo registradas</h2>
          <p className="mt-2 text-4xl font-bold">{indicadores.totalOrdenes}</p>
        </section>
        <section className="panel p-6">
          <h2>Atención necesaria</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            <li><strong>{indicadores.ordenesAltaPrioridadPendientes}</strong> órdenes de prioridad alta pendientes</li>
            <li><strong>{indicadores.ordenesPendientesDeValidacion}</strong> órdenes finalizadas pendientes de validación</li>
            <li><strong>{indicadores.repuestosBajoStock.length}</strong> repuestos con bajo stock</li>
          </ul>
        </section>
        <section className="panel p-6">
          <h2>Tiempo promedio hasta el inicio</h2>
          <p className="mt-2 text-3xl font-bold">{formatearHoras(indicadores.promedioHorasHastaInicio)}</p>
        </section>
        <section className="panel p-6">
          <h2>Tiempo promedio hasta el cierre</h2>
          <p className="mt-2 text-3xl font-bold">{formatearHoras(indicadores.promedioHorasHastaCierre)}</p>
        </section>
        <section className="panel lg:col-span-2">
          <div className="panel-heading">
            <h2>Órdenes recientes</h2>
            <Link className="text-link" href="/ordenes-trabajo">
              Ver todas
            </Link>
          </div>
          {tablaOrdenesRecientes}
        </section>
        {dibujarTablaGrupos("Órdenes por estado", "Estado", indicadores.ordenesPorEstado)}
        {dibujarTablaGrupos("Órdenes por prioridad", "Prioridad", indicadores.ordenesPorPrioridad)}
        {dibujarTablaGrupos("Órdenes por tipo de mantenimiento", "Tipo", indicadores.ordenesPorTipo)}
        {dibujarTablaGrupos("Órdenes asignadas por técnico", "Técnico", indicadores.ordenesPorTecnico)}
        {dibujarTablaGrupos("Activos con más intervenciones", "Activo", indicadores.activosConMasIntervenciones)}
        <section className="panel">
          <div className="panel-heading">
            <h2>Repuestos con bajo stock</h2>
          </div>
          {tablaRepuestos}
        </section>
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Reportes e indicadores</h1>
        </div>
      </header>

      <form aria-label="Filtros" className="barra-filtros" onSubmit={aplicarFiltros}>
        <div className="form-field">
          <label htmlFor="fechaDesde">Fecha desde</label>
          <input id="fechaDesde" onChange={cambiarFechaDesde} type="date" value={fechaDesde} />
        </div>

        <div className="form-field">
          <label htmlFor="fechaHasta">Fecha hasta</label>
          <input id="fechaHasta" onChange={cambiarFechaHasta} type="date" value={fechaHasta} />
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
          <label htmlFor="estado">Estado</label>
          <select id="estado" onChange={cambiarEstado} value={estado}>
            <option value="">Todos los estados</option>
            {estadosOrdenTrabajo.map((estadoOrden) => (
              <option key={estadoOrden} value={estadoOrden}>{obtenerEtiquetaEstadoOrdenTrabajo(estadoOrden)}</option>
            ))}
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
        <div className="barra-filtros-acciones">
          <button className="secondary-button" onClick={limpiarFiltros} type="button">
            Limpiar filtros
          </button>
          <button className="primary-button" type="submit">
            Aplicar filtros
          </button>
        </div>
      </form>

      <section className="panel form-panel mb-6">
        <div className="panel-heading">
          <h2>Descarga de reportes</h2>
        </div>
        <p className="mb-4 mt-3 text-sm texto-tenue">
          El reporte en PDF usa los criterios elegidos en los filtros de arriba, más la prioridad.
        </p>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipoReporte">Tipo de reporte</label>
            <select id="tipoReporte" onChange={cambiarTipoReporte} value={tipoReporte}>
              {tiposDeReporte.map((tipoDisponible) => (
                <option key={tipoDisponible.valor} value={tipoDisponible.valor}>{tipoDisponible.etiqueta}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="prioridadReporte">Prioridad</label>
            <select id="prioridadReporte" onChange={cambiarPrioridadReporte} value={prioridadReporte}>
              <option value="">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <a
            className="primary-button"
            href={obtenerUrlReportePdf(tipoReporte, filtrosParaReporte, prioridadReporte)}
            rel="noreferrer"
            target="_blank"
          >
            Descargar reporte
          </a>
        </div>
      </section>

      {mensajeError}
      {mensajeCargando}
      {contenidoIndicadores}
    </main>
  );
}
