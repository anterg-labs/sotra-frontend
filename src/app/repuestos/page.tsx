"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import { desactivarRepuesto, listarRepuestosPaginados, tieneBajoStock } from "@/servicios/servicio-repuestos";
import type { FiltrosRepuestos, Repuesto } from "@/tipos/repuesto";

const filtrosVacios: FiltrosRepuestos = {
  buscar: "",
  estado: "",
  ubicacion: "",
  bajoStock: false,
  pagina: 1,
};

const filtrosAlerta: FiltrosRepuestos = {
  buscar: "",
  estado: "activo",
  ubicacion: "",
  bajoStock: true,
  pagina: 1,
};

export default function PaginaRepuestos() {
  const [repuestos, setRepuestos] = useState<Repuesto[] | null>(null);
  const [repuestosConAlerta, setRepuestosConAlerta] = useState<Repuesto[]>([]);
  const [errorCarga, setErrorCarga] = useState("");
  const [repuestoDesactivandoId, setRepuestoDesactivandoId] = useState<number | null>(null);
  const [repuestoPendienteDesactivacion, setRepuestoPendienteDesactivacion] = useState<Repuesto | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosRepuestos>(filtrosVacios);
  const [buscar, setBuscar] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [ubicacionFiltro, setUbicacionFiltro] = useState("");
  const [soloBajoStock, setSoloBajoStock] = useState(false);

  useEffect(() => {
    async function cargarRepuestos() {
      try {
        const paginaObtenida = await listarRepuestosPaginados(filtrosVacios);
        setRepuestos(paginaObtenida.elementos);
        setPaginaActual(paginaObtenida.pagina);
        setTotalPaginas(paginaObtenida.totalPaginas);
        setTotalElementos(paginaObtenida.totalElementos);

        const paginaAlerta = await listarRepuestosPaginados(filtrosAlerta);
        setRepuestosConAlerta(paginaAlerta.elementos);
      } catch {
        setErrorCarga("No se pudo obtener el listado de repuestos.");
      }
    }

    cargarRepuestos();
  }, []);

  async function cargarPagina(filtros: FiltrosRepuestos) {
    setRepuestos(null);
    setErrorCarga("");
    setFiltrosAplicados(filtros);

    try {
      const paginaObtenida = await listarRepuestosPaginados(filtros);
      setRepuestos(paginaObtenida.elementos);
      setPaginaActual(paginaObtenida.pagina);
      setTotalPaginas(paginaObtenida.totalPaginas);
      setTotalElementos(paginaObtenida.totalElementos);

      const paginaAlerta = await listarRepuestosPaginados(filtrosAlerta);
      setRepuestosConAlerta(paginaAlerta.elementos);
    } catch {
      setErrorCarga("No se pudo obtener el listado de repuestos.");
    }
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const filtros: FiltrosRepuestos = {
      buscar: buscar,
      estado: estadoFiltro,
      ubicacion: ubicacionFiltro,
      bajoStock: soloBajoStock,
      pagina: 1,
    };
    cargarPagina(filtros);
  }

  function limpiarFiltros() {
    setBuscar("");
    setEstadoFiltro("");
    setUbicacionFiltro("");
    setSoloBajoStock(false);
    cargarPagina(filtrosVacios);
  }

  function irAPagina(numeroPagina: number) {
    const filtros: FiltrosRepuestos = {
      buscar: filtrosAplicados.buscar,
      estado: filtrosAplicados.estado,
      ubicacion: filtrosAplicados.ubicacion,
      bajoStock: filtrosAplicados.bajoStock,
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

  function cambiarUbicacionFiltro(evento: React.ChangeEvent<HTMLInputElement>) {
    setUbicacionFiltro(evento.target.value);
  }

  function cambiarSoloBajoStock(evento: React.ChangeEvent<HTMLInputElement>) {
    setSoloBajoStock(evento.target.checked);
  }

  function pedirBajaRepuesto(repuesto: Repuesto) {
    setRepuestoPendienteDesactivacion(repuesto);
  }

  function cancelarBaja() {
    setRepuestoPendienteDesactivacion(null);
  }

  async function confirmarDesactivacion() {
    if (!repuestoPendienteDesactivacion) {
      return;
    }

    const repuestoId = repuestoPendienteDesactivacion.id;
    setRepuestoDesactivandoId(repuestoId);

    try {
      await desactivarRepuesto(repuestoId);
      setRepuestoPendienteDesactivacion(null);
      await cargarPagina(filtrosAplicados);
    } catch {
      setErrorCarga("No se pudo dar de baja el repuesto seleccionado.");
    } finally {
      setRepuestoDesactivandoId(null);
    }
  }

  let alertaStock = null;
  if (repuestosConAlerta.length > 0) {
    alertaStock = (
      <section aria-label="Alerta de stock insuficiente" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="text-red-700">{"Stock insuficiente (" + repuestosConAlerta.length + ")"}</h2>
        <p className="mb-3 mt-1 text-sm text-red-700">
          Estos repuestos tienen una cantidad igual o menor a su stock mínimo.
        </p>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Cantidad</th>
                <th>Mínima</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {repuestosConAlerta.map((repuesto) => (
                <tr key={repuesto.id}>
                  <td><strong>{repuesto.codigo}</strong></td>
                  <td>{repuesto.nombre}</td>
                  <td>{repuesto.cantidad}</td>
                  <td>{repuesto.cantidadMinima}</td>
                  <td>{repuesto.ubicacion}</td>
                  <td><span className="status status-activo">Activo</span></td>
                  <td>
                    <Link className="table-action-link" href={"/repuestos/" + repuesto.id}>
                      Ver detalle o registrar ingreso
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (repuestos === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando repuestos…</p>;
  }

  let mensajeSinResultados = null;
  if (repuestos !== null && repuestos.length === 0) {
    mensajeSinResultados = <p className="empty-state">No se encontraron repuestos con los filtros aplicados.</p>;
  }

  let tablaRepuestos = null;
  if (repuestos !== null && repuestos.length > 0) {
    tablaRepuestos = (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Ubicación</th>
              <th>Cantidad</th>
              <th>Mínima</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {repuestos.map((repuesto) => {
              let claseEstado = "status status-inactivo";
              let textoEstado = "Inactivo";
              if (repuesto.estado === "activo") {
                claseEstado = "status status-activo";
                textoEstado = "Activo";
              }

              let etiquetaBajoStock = null;
              if (tieneBajoStock(repuesto)) {
                etiquetaBajoStock = <span className="status prioridad-alta">Bajo stock</span>;
              }

              let botonBaja = null;
              if (repuesto.estado === "activo") {
                botonBaja = (
                  <button
                    aria-label="Dar de baja"
                    className="table-action-link table-action-link-danger"
                    disabled={repuestoDesactivandoId === repuesto.id}
                    onClick={() => pedirBajaRepuesto(repuesto)}
                    title="Dar de baja"
                    type="button"
                  >
                    Dar de baja
                  </button>
                );
              }

              return (
                <tr key={repuesto.id}>
                  <td><strong>{repuesto.codigo}</strong></td>
                  <td>{repuesto.nombre}</td>
                  <td>{repuesto.marca}</td>
                  <td>{repuesto.ubicacion}</td>
                  <td>
                    {repuesto.cantidad}
                    {etiquetaBajoStock}
                  </td>
                  <td>{repuesto.cantidadMinima}</td>
                  <td>
                    <span className={claseEstado}>{textoEstado}</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Ver detalle"
                        className="table-action-link"
                        href={"/repuestos/" + repuesto.id}
                        title="Ver detalle"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        aria-label="Modificar repuesto"
                        className="table-action-link"
                        href={"/repuestos/" + repuesto.id + "/editar"}
                        title="Modificar repuesto"
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
        <span>{"Página " + paginaActual + " de " + totalPaginas + " (" + totalElementos + " repuestos)"}</span>
        <button disabled={paginaActual >= totalPaginas} onClick={irAPaginaSiguiente} type="button">
          Siguiente
        </button>
      </div>
    );
  }

  let modalBaja = null;
  if (repuestoPendienteDesactivacion) {
    modalBaja = (
      <ModalConfirmacion
        descripcion={
          "¿Confirmás la baja de " +
          repuestoPendienteDesactivacion.nombre +
          "? El repuesto no se elimina, pero ya no se podrá asociar a nuevas órdenes de trabajo."
        }
        estaConfirmando={repuestoDesactivandoId === repuestoPendienteDesactivacion.id}
        etiquetaConfirmar="Dar de baja"
        onCancelar={cancelarBaja}
        onConfirmar={confirmarDesactivacion}
        titulo="Dar de baja repuesto"
      />
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <h1>Repuestos</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="secondary-button" href="/repuestos/movimientos">
            Movimientos de stock
          </Link>
          <Link className="primary-button" href="/repuestos/nuevo">
            Registrar repuesto
          </Link>
        </div>
      </header>

      {alertaStock}

      <form className="panel form-panel mb-6" onSubmit={aplicarFiltros}>
        <div className="panel-heading">
          <h2>Búsqueda y filtros</h2>
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="buscarRepuesto">Buscar</label>
            <input
              id="buscarRepuesto"
              onChange={cambiarBuscar}
              placeholder="Código, nombre, marca o descripción"
              type="text"
              value={buscar}
            />
          </div>
          <div className="form-field">
            <label htmlFor="ubicacionRepuestoFiltro">Ubicación</label>
            <input id="ubicacionRepuestoFiltro" onChange={cambiarUbicacionFiltro} type="text" value={ubicacionFiltro} />
          </div>
          <div className="form-field">
            <label htmlFor="estadoRepuestoFiltro">Estado</label>
            <select id="estadoRepuestoFiltro" onChange={cambiarEstadoFiltro} value={estadoFiltro}>
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="form-field">
            <label className="flex items-center gap-2" htmlFor="soloBajoStock">
              <input checked={soloBajoStock} id="soloBajoStock" onChange={cambiarSoloBajoStock} type="checkbox" />
              Solo con stock insuficiente
            </label>
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

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaRepuestos}
        {paginacion}
      </section>

      {modalBaja}
    </main>
  );
}
