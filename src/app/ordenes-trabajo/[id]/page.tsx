"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  formatearFechaPrevista,
  obtenerDetalleOrdenTrabajo,
  obtenerEtiquetaEstadoOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";

export default function PaginaDetalleOrdenTrabajo() {
  const parametros = useParams<{ id: string }>();
  const ordenTrabajoId = Number(parametros.id);
  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarOrden() {
      try {
        const ordenObtenida = await obtenerDetalleOrdenTrabajo(ordenTrabajoId);
        setOrden(ordenObtenida);
      } catch {
        setErrorCarga("No se pudo obtener la información de la orden solicitada.");
      }
    }

    cargarOrden();
  }, [ordenTrabajoId]);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (orden === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información de la orden…</p>;
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

    let textoRepuestos = <span>Sin repuestos asociados</span>;
    if (orden.repuestos.length > 0) {
      textoRepuestos = (
        <ul>
          {orden.repuestos.map((repuestoDeLaOrden) => (
            <li key={repuestoDeLaOrden.id}>{repuestoDeLaOrden.codigo + " - " + repuestoDeLaOrden.nombre}</li>
          ))}
        </ul>
      );
    }

    let textoSugerencias = <span>Sin sugerencias</span>;
    if (orden.sugerencias.length > 0) {
      textoSugerencias = (
        <div className="flex flex-col gap-3">
          {orden.sugerencias.map((textoSugerencia, indice) => (
            <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm" key={indice}>
              {textoSugerencia}
            </p>
          ))}
        </div>
      );
    }

    const fechaCreacion = new Date(orden.creadoEn).toLocaleDateString("es-UY");

    let enlaceModificar = null;
    if (orden.estado !== "cerrada") {
      enlaceModificar = (
        <Link className="primary-button" href={"/ordenes-trabajo/" + orden.id + "/editar"}>
          Modificar
        </Link>
      );
    }

    contenidoOrden = (
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
            <dt>Estado</dt>
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
          <div>
            <dt>Repuestos</dt>
            <dd>{textoRepuestos}</dd>
          </div>
          <div>
            <dt>Sugerencias</dt>
            <dd>{textoSugerencias}</dd>
          </div>
        </dl>
        <div className="form-actions">{enlaceModificar}</div>
      </section>
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
