"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  cambiarEstadoOrdenTrabajo,
  formatearFechaPrevista,
  obtenerDetalleOrdenTrabajo,
  obtenerEtiquetaEstadoOrdenTrabajo,
  solicitarSugerenciaOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import { estadosOrdenTrabajo } from "@/tipos/orden-trabajo";
import type { EstadoOrdenTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";

export default function PaginaDetalleOrdenTrabajo() {
  const parametros = useParams<{ id: string }>();
  const ordenTrabajoId = Number(parametros.id);
  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [estaCambiandoEstado, setEstaCambiandoEstado] = useState(false);
  const [estaSolicitandoSugerencia, setEstaSolicitandoSugerencia] = useState(false);

  useEffect(() => {
    async function cargarOrden() {
      try {
        const ordenObtenida = await obtenerDetalleOrdenTrabajo(ordenTrabajoId);
        setOrden(ordenObtenida);
        setEstadoSeleccionado(ordenObtenida.estado);
      } catch {
        setErrorCarga("No se pudo obtener la información de la orden solicitada.");
      }
    }

    cargarOrden();
  }, [ordenTrabajoId]);

  function cambiarEstadoSeleccionado(evento: React.ChangeEvent<HTMLSelectElement>) {
    setEstadoSeleccionado(evento.target.value);
  }

  async function actualizarEstado() {
    setEstaCambiandoEstado(true);
    setErrorAccion("");

    try {
      const ordenActualizada = await cambiarEstadoOrdenTrabajo(ordenTrabajoId, estadoSeleccionado as EstadoOrdenTrabajo);
      setOrden(ordenActualizada);
    } catch {
      setErrorAccion("No se pudo cambiar el estado de la orden.");
    } finally {
      setEstaCambiandoEstado(false);
    }
  }

  async function pedirSugerencia() {
    setEstaSolicitandoSugerencia(true);
    setErrorAccion("");

    try {
      const ordenActualizada = await solicitarSugerenciaOrdenTrabajo(ordenTrabajoId);
      setOrden(ordenActualizada);
    } catch {
      setErrorAccion("No se pudo obtener la sugerencia para la orden.");
    } finally {
      setEstaSolicitandoSugerencia(false);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (orden === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información de la orden…</p>;
  }

  let mensajeErrorAccion = null;
  if (errorAccion) {
    mensajeErrorAccion = <p className="form-error-banner">{errorAccion}</p>;
  }

  let contenidoOrden = null;
  if (orden !== null) {
    let nombreTecnico = "Sin asignar";
    if (orden.nombreTecnico) {
      nombreTecnico = orden.nombreTecnico;
    }

    let textoObservaciones = "Sin observaciones";
    if (orden.observaciones) {
      textoObservaciones = orden.observaciones;
    }

    const fechaCreacion = new Date(orden.creadoEn).toLocaleDateString("es-UY");

    let enlaceModificar = null;
    let panelAcciones = null;
    if (orden.estado !== "cerrada") {
      enlaceModificar = (
        <Link className="secondary-button" href={"/ordenes-trabajo/" + orden.id + "/editar"}>
          Modificar
        </Link>
      );

      let textoBotonEstado = "Actualizar estado";
      if (estaCambiandoEstado) {
        textoBotonEstado = "Actualizando…";
      }

      let textoBotonSugerencia = "Solicitar sugerencia";
      if (estaSolicitandoSugerencia) {
        textoBotonSugerencia = "Solicitando…";
      }

      panelAcciones = (
        <section className="panel detail-panel">
          <h2>Acciones</h2>
          {mensajeErrorAccion}

          <div className="form-field">
            <label htmlFor="estado">Estado de la orden</label>
            <select id="estado" onChange={cambiarEstadoSeleccionado} value={estadoSeleccionado}>
              {estadosOrdenTrabajo.map((estado) => (
                <option key={estado} value={estado}>{obtenerEtiquetaEstadoOrdenTrabajo(estado)}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button className="secondary-button" disabled={estaCambiandoEstado} onClick={actualizarEstado} type="button">
              {textoBotonEstado}
            </button>
            <button className="primary-button" disabled={estaSolicitandoSugerencia} onClick={pedirSugerencia} type="button">
              {textoBotonSugerencia}
            </button>
          </div>
        </section>
      );
    }

    let panelSugerencia = null;
    if (orden.recomendacionIa) {
      panelSugerencia = (
        <section className="panel detail-panel">
          <h2>Sugerencia</h2>
          <p className="mt-3 whitespace-pre-wrap rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm">
            {orden.recomendacionIa}
          </p>
        </section>
      );
    }

    contenidoOrden = (
      <div className="flex flex-col gap-6">
        <section className="panel detail-panel">
          <dl className="detail-list">
            <div>
              <dt>Cliente</dt>
              <dd>{orden.nombreCliente}</dd>
            </div>
            <div>
              <dt>Activo</dt>
              <dd>{orden.nombreActivo}</dd>
            </div>
            <div>
              <dt>Tipo de mantenimiento</dt>
              <dd>{orden.tipo}</dd>
            </div>
            <div>
              <dt>Prioridad</dt>
              <dd>{orden.prioridad}</dd>
            </div>
            <div>
              <dt>Técnico responsable</dt>
              <dd>{nombreTecnico}</dd>
            </div>
            <div>
              <dt>Estado actual</dt>
              <dd>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</dd>
            </div>
            <div>
              <dt>Fecha de creación</dt>
              <dd>{fechaCreacion}</dd>
            </div>
            <div>
              <dt>Fecha prevista de ejecución</dt>
              <dd>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</dd>
            </div>
            <div>
              <dt>Descripción de la tarea</dt>
              <dd>{orden.descripcion}</dd>
            </div>
            <div>
              <dt>Observaciones</dt>
              <dd>{textoObservaciones}</dd>
            </div>
          </dl>
          <div className="form-actions">{enlaceModificar}</div>
        </section>

        {panelAcciones}
        {panelSugerencia}
      </div>
    );
  }

  let titulo = "Orden de trabajo";
  if (orden !== null) {
    titulo = "Orden de trabajo N° " + orden.id;
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Órdenes de trabajo</p>
          <h1>{titulo}</h1>
        </div>
        <Link className="secondary-button" href="/ordenes-trabajo">
          Volver al listado
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenidoOrden}
    </main>
  );
}
