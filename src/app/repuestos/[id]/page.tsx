"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { obtenerFechaDeHoy } from "@/servicios/servicio-evidencias";
import {
  listarMovimientosStock,
  obtenerEtiquetaTipoMovimiento,
  registrarIngresoStock,
} from "@/servicios/servicio-movimientos-stock";
import { obtenerDetalleRepuesto, tieneBajoStock } from "@/servicios/servicio-repuestos";
import type { MovimientoStock } from "@/tipos/movimiento-stock";
import type { Repuesto } from "@/tipos/repuesto";

export default function PaginaDetalleRepuesto() {
  const parametros = useParams<{ id: string }>();
  const repuestoId = Number(parametros.id);
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoStock[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorMovimientos, setErrorMovimientos] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(obtenerFechaDeHoy());
  const [motivo, setMotivo] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorIngreso, setErrorIngreso] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  useEffect(() => {
    async function cargarRepuesto() {
      try {
        const repuestoObtenido = await obtenerDetalleRepuesto(repuestoId);
        setRepuesto(repuestoObtenido);
        setUbicacion(repuestoObtenido.ubicacion);
      } catch {
        setErrorCarga("No se pudo obtener la información del repuesto solicitado.");
      }

      try {
        const paginaMovimientos = await listarMovimientosStock({
          buscar: "",
          repuestoId: String(repuestoId),
          tipo: "",
          fechaDesde: "",
          fechaHasta: "",
          ubicacion: "",
          usuarioId: "",
          pagina: 1,
        });
        setMovimientos(paginaMovimientos.elementos);
      } catch {
        setErrorMovimientos("No se pudieron obtener los movimientos de stock de este repuesto.");
      }
    }

    cargarRepuesto();
  }, [repuestoId]);

  function abrirFormulario() {
    setMostrarFormulario(true);
    setMensajeExito("");
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setErrorIngreso("");
  }

  function cambiarCantidad(evento: React.ChangeEvent<HTMLInputElement>) {
    setCantidad(evento.target.value);
  }

  function cambiarFecha(evento: React.ChangeEvent<HTMLInputElement>) {
    setFecha(evento.target.value);
  }

  function cambiarMotivo(evento: React.ChangeEvent<HTMLInputElement>) {
    setMotivo(evento.target.value);
  }

  function cambiarUbicacion(evento: React.ChangeEvent<HTMLInputElement>) {
    setUbicacion(evento.target.value);
  }

  function cambiarObservaciones(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setObservaciones(evento.target.value);
  }

  async function confirmarIngreso(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorIngreso("");
    setEstaEnviando(true);

    try {
      const movimientoCreado = await registrarIngresoStock(repuestoId, {
        cantidad: Number(cantidad),
        fecha: fecha,
        motivo: motivo,
        ubicacion: ubicacion,
        observaciones: observaciones,
      });

      const repuestoActualizado = await obtenerDetalleRepuesto(repuestoId);
      setRepuesto(repuestoActualizado);

      const movimientosActualizados: MovimientoStock[] = [movimientoCreado];
      if (movimientos !== null) {
        for (const movimiento of movimientos) {
          movimientosActualizados.push(movimiento);
        }
      }
      setMovimientos(movimientosActualizados);

      setCantidad("");
      setFecha(obtenerFechaDeHoy());
      setMotivo("");
      setObservaciones("");
      setMostrarFormulario(false);
      setMensajeExito("Ingreso registrado correctamente. El stock se actualizó.");
    } catch (error) {
      let mensaje = "No se pudo registrar el ingreso de stock.";
      if (error instanceof Error) {
        mensaje = error.message;
      }
      setErrorIngreso(mensaje);
    } finally {
      setEstaEnviando(false);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (repuesto === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del repuesto…</p>;
  }

  let titulo = "Detalle del repuesto";
  let contenido = null;
  if (repuesto !== null) {
    titulo = repuesto.codigo + " - " + repuesto.nombre;

    let claseEstado = "status status-inactivo";
    let etiquetaEstado = "Inactivo";
    if (repuesto.estado === "activo") {
      claseEstado = "status status-activo";
      etiquetaEstado = "Activo";
    }

    let avisoBajoStock = null;
    if (tieneBajoStock(repuesto)) {
      avisoBajoStock = (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Stock insuficiente: la cantidad disponible es igual o menor al stock mínimo.
        </p>
      );
    }

    let avisoExito = null;
    if (mensajeExito) {
      avisoExito = <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{mensajeExito}</p>;
    }

    let botonIngreso = null;
    if (repuesto.estado === "activo" && !mostrarFormulario) {
      botonIngreso = (
        <button className="primary-button" onClick={abrirFormulario} type="button">
          Ingresar repuesto
        </button>
      );
    }

    let formularioIngreso = null;
    if (mostrarFormulario) {
      let mensajeErrorIngreso = null;
      if (errorIngreso) {
        mensajeErrorIngreso = <p className="form-error-banner">{errorIngreso}</p>;
      }

      let textoBoton = "Confirmar ingreso";
      if (estaEnviando) {
        textoBoton = "Guardando…";
      }

      formularioIngreso = (
        <form className="mt-4 rounded-lg border border-gray-200 p-4" onSubmit={confirmarIngreso}>
          {mensajeErrorIngreso}
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="cantidadIngreso">Cantidad a ingresar</label>
              <input id="cantidadIngreso" min={1} onChange={cambiarCantidad} required step={1} type="number" value={cantidad} />
            </div>
            <div className="form-field">
              <label htmlFor="fechaIngreso">Fecha del ingreso</label>
              <input id="fechaIngreso" max={obtenerFechaDeHoy()} onChange={cambiarFecha} required type="date" value={fecha} />
            </div>
            <div className="form-field">
              <label htmlFor="motivoIngreso">Motivo del ingreso</label>
              <input id="motivoIngreso" onChange={cambiarMotivo} placeholder="Por ejemplo: compra a proveedor" required type="text" value={motivo} />
            </div>
            <div className="form-field">
              <label htmlFor="ubicacionIngreso">Ubicación o depósito</label>
              <input id="ubicacionIngreso" onChange={cambiarUbicacion} required type="text" value={ubicacion} />
            </div>
          </div>
          <div className="form-field form-field-full">
            <label htmlFor="observacionesIngreso">Observaciones adicionales</label>
            <textarea id="observacionesIngreso" onChange={cambiarObservaciones} rows={2} value={observaciones} />
          </div>
          <div className="form-actions">
            <button className="secondary-button" onClick={cerrarFormulario} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={estaEnviando} type="submit">
              {textoBoton}
            </button>
          </div>
        </form>
      );
    }

    let tablaMovimientos = <p className="empty-state">Cargando movimientos…</p>;
    if (errorMovimientos) {
      tablaMovimientos = <p className="form-error-banner">{errorMovimientos}</p>;
    }
    if (movimientos !== null && movimientos.length === 0) {
      tablaMovimientos = <p className="empty-state">Este repuesto todavía no tiene movimientos de stock.</p>;
    }
    if (movimientos !== null && movimientos.length > 0) {
      tablaMovimientos = (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Stock</th>
                <th>Ubicación</th>
                <th>Motivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((movimiento) => (
                <tr key={movimiento.id}>
                  <td>{new Date(movimiento.fecha).toLocaleDateString("es-UY")}</td>
                  <td>{obtenerEtiquetaTipoMovimiento(movimiento.tipo)}</td>
                  <td>{movimiento.cantidad}</td>
                  <td>{movimiento.stockAnterior + " → " + movimiento.stockPosterior}</td>
                  <td>{movimiento.ubicacion}</td>
                  <td>{movimiento.motivo}</td>
                  <td>
                    <Link className="table-action-link" href={"/repuestos/movimientos/" + movimiento.id}>
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    contenido = (
      <div className="grid gap-6">
        <section className="panel detail-panel">
          {avisoBajoStock}
          {avisoExito}
          <dl className="detail-list">
            <div>
              <dt>Código</dt>
              <dd>{repuesto.codigo}</dd>
            </div>
            <div>
              <dt>Nombre</dt>
              <dd>{repuesto.nombre}</dd>
            </div>
            <div>
              <dt>Marca</dt>
              <dd>{repuesto.marca}</dd>
            </div>
            <div>
              <dt>Descripción</dt>
              <dd>{repuesto.descripcion}</dd>
            </div>
            <div>
              <dt>Ubicación</dt>
              <dd>{repuesto.ubicacion}</dd>
            </div>
            <div>
              <dt>Cantidad disponible</dt>
              <dd>{repuesto.cantidad}</dd>
            </div>
            <div>
              <dt>Stock mínimo</dt>
              <dd>{repuesto.cantidadMinima}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd><span className={claseEstado}>{etiquetaEstado}</span></dd>
            </div>
          </dl>
          <div className="form-actions">
            <Link className="secondary-button" href={"/repuestos/" + repuesto.id + "/editar"}>
              Modificar
            </Link>
            {botonIngreso}
          </div>
          {formularioIngreso}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>Movimientos de stock</h2>
          </div>
          {tablaMovimientos}
        </section>
      </div>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Repuestos</p>
          <h1>{titulo}</h1>
        </div>
        <Link className="secondary-button" href="/repuestos">
          Volver al listado
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenido}
    </main>
  );
}
