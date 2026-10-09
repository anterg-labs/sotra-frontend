"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listarMovimientosStock, obtenerEtiquetaTipoMovimiento } from "@/servicios/servicio-movimientos-stock";
import { listarRepuestos } from "@/servicios/servicio-repuestos";
import { listarUsuarios } from "@/servicios/servicio-usuarios";
import type { FiltrosMovimientosStock, MovimientoStock } from "@/tipos/movimiento-stock";
import type { Repuesto } from "@/tipos/repuesto";
import type { Usuario } from "@/tipos/usuario";
import { IconoOjo } from "@/componentes/iconos";

const filtrosVacios: FiltrosMovimientosStock = {
  buscar: "",
  repuestoId: "",
  tipo: "",
  fechaDesde: "",
  fechaHasta: "",
  ubicacion: "",
  usuarioId: "",
  pagina: 1,
};

export default function PaginaMovimientosStock() {
  const [movimientos, setMovimientos] = useState<MovimientoStock[] | null>(null);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [errorCarga, setErrorCarga] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosMovimientosStock>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [repuestoId, setRepuestoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [usuarioId, setUsuarioId] = useState("");

  useEffect(() => {
    async function cargarMovimientos() {
      try {
        const paginaObtenida = await listarMovimientosStock(filtrosVacios);
        setMovimientos(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de movimientos de stock.");
      }

      try {
        const repuestosObtenidos = await listarRepuestos();
        const usuariosObtenidos = await listarUsuarios();
        setRepuestos(repuestosObtenidos);
        setUsuarios(usuariosObtenidos);
      } catch {
        setErrorCarga("No se pudieron obtener las opciones de los filtros.");
      }
    }

    cargarMovimientos();
  }, []);

  async function cargarPagina(filtros: FiltrosMovimientosStock) {
    setMovimientos(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarMovimientosStock(filtros);
      setMovimientos(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);
    } catch (error) {
      let mensaje = "No se pudo obtener el listado de movimientos de stock.";
      if (error instanceof Error) {
        mensaje = error.message;
      }
      setErrorCarga(mensaje);
    }
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosMovimientosStock = {
      buscar: buscar,
      repuestoId: repuestoId,
      tipo: tipo,
      fechaDesde: fechaDesde,
      fechaHasta: fechaHasta,
      ubicacion: ubicacion,
      usuarioId: usuarioId,
      pagina: 1,
    };
    cargarPagina(filtros);
  }

  function limpiarFiltros() {
    setBuscar("");
    setRepuestoId("");
    setTipo("");
    setFechaDesde("");
    setFechaHasta("");
    setUbicacion("");
    setUsuarioId("");
    cargarPagina(filtrosVacios);
  }

  function irAPagina(numeroPagina: number) {
    const filtros: FiltrosMovimientosStock = {
      buscar: filtrosAplicados.buscar,
      repuestoId: filtrosAplicados.repuestoId,
      tipo: filtrosAplicados.tipo,
      fechaDesde: filtrosAplicados.fechaDesde,
      fechaHasta: filtrosAplicados.fechaHasta,
      ubicacion: filtrosAplicados.ubicacion,
      usuarioId: filtrosAplicados.usuarioId,
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

  function cambiarRepuesto(evento: React.ChangeEvent<HTMLSelectElement>) {
    setRepuestoId(evento.target.value);
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

  function cambiarUbicacion(evento: React.ChangeEvent<HTMLInputElement>) {
    setUbicacion(evento.target.value);
  }

  function cambiarUsuario(evento: React.ChangeEvent<HTMLSelectElement>) {
    setUsuarioId(evento.target.value);
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (movimientos === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando movimientos de stock…</p>;
  }

  let mensajeSinResultados = null;
  if (movimientos !== null && movimientos.length === 0) {
    mensajeSinResultados = <p className="empty-state">No se encontraron movimientos de stock con los filtros aplicados.</p>;
  }

  let tablaMovimientos = null;
  if (movimientos !== null && movimientos.length > 0) {
    tablaMovimientos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Código</th>
              <th>Repuesto</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Ubicación</th>
              <th>Usuario</th>
              <th>Motivo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((movimiento) => {
              let nombreUsuario = "Sin registrar";
              if (movimiento.nombreUsuario !== null) {
                nombreUsuario = movimiento.nombreUsuario;
              }

              return (
                <tr key={movimiento.id}>
                  <td>{new Date(movimiento.fecha).toLocaleDateString("es-UY")}</td>
                  <td><strong>{movimiento.codigoRepuesto}</strong></td>
                  <td>{movimiento.nombreRepuesto}</td>
                  <td>{obtenerEtiquetaTipoMovimiento(movimiento.tipo)}</td>
                  <td>{movimiento.cantidad}</td>
                  <td>{movimiento.ubicacion}</td>
                  <td>{nombreUsuario}</td>
                  <td>{movimiento.motivo}</td>
                  <td>
                    <Link aria-label="Ver detalle" className="boton-icono" href={"/repuestos/movimientos/" + movimiento.id} title="Ver detalle">
                      <IconoOjo />
                    </Link>
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
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " movimientos)"}</span>
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
          <p className="eyebrow">Repuestos</p>
          <h1>Movimientos de stock</h1>
        </div>
        <Link className="secondary-button" href="/repuestos">
          Volver a repuestos
        </Link>
      </header>

      <form aria-label="Búsqueda y filtros" className="barra-filtros" onSubmit={aplicarFiltros}>
        <div className="form-field campo-busqueda">
          <label htmlFor="buscarMovimiento">Buscar</label>
          <input
            id="buscarMovimiento"
            onChange={cambiarBuscar}
            placeholder="Código o nombre del repuesto, o motivo"
            type="text"
            value={buscar}
          />
        </div>
        <div className="form-field">
          <label htmlFor="repuestoMovimiento">Repuesto</label>
          <select id="repuestoMovimiento" onChange={cambiarRepuesto} value={repuestoId}>
            <option value="">Todos los repuestos</option>
            {repuestos.map((repuesto) => (
              <option key={repuesto.id} value={repuesto.id}>{repuesto.codigo + " - " + repuesto.nombre}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="tipoMovimiento">Tipo de movimiento</label>
          <select id="tipoMovimiento" onChange={cambiarTipo} value={tipo}>
            <option value="">Todos los tipos</option>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
            <option value="ajuste">Ajuste</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="usuarioMovimiento">Usuario responsable</label>
          <select id="usuarioMovimiento" onChange={cambiarUsuario} value={usuarioId}>
            <option value="">Todos los usuarios</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>{usuario.nombre + " " + usuario.apellido}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="ubicacionMovimiento">Ubicación o depósito</label>
          <input id="ubicacionMovimiento" onChange={cambiarUbicacion} type="text" value={ubicacion} />
        </div>
        <div className="form-field">
          <label htmlFor="fechaDesdeMovimiento">Fecha desde</label>
          <input id="fechaDesdeMovimiento" onChange={cambiarFechaDesde} type="date" value={fechaDesde} />
        </div>
        <div className="form-field">
          <label htmlFor="fechaHastaMovimiento">Fecha hasta</label>
          <input id="fechaHastaMovimiento" onChange={cambiarFechaHasta} type="date" value={fechaHasta} />
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
        {tablaMovimientos}
        {paginacion}
      </section>
    </main>
  );
}
