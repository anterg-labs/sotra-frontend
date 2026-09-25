"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatearFechaPrevista,
  listarOrdenesTrabajo,
  obtenerEtiquetaEstadoOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";

export default function PaginaOrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[] | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarOrdenes() {
      setOrdenes(null);
      setErrorCarga("");

      try {
        const ordenesObtenidas = await listarOrdenesTrabajo();
        setOrdenes(ordenesObtenidas);
      } catch {
        setErrorCarga("No se pudo obtener el listado de órdenes de trabajo.");
      }
    }

    cargarOrdenes();
  }, []);

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
    mensajeSinResultados = <p className="empty-state">No hay órdenes de trabajo registradas.</p>;
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
              let claseEstado = "status status-activo";
              if (orden.estado === "cerrada" || orden.estado === "cancelada") {
                claseEstado = "status status-inactivo";
              }

              let nombreTecnico = "Sin asignar";
              if (orden.nombreTecnico) {
                nombreTecnico = orden.nombreTecnico;
              }

              let enlaceModificar = null;
              if (orden.estado !== "cerrada") {
                enlaceModificar = (
                  <Link
                    aria-label="Modificar orden"
                    className="table-action-link"
                    href={"/ordenes-trabajo/" + orden.id + "/editar"}
                    title="Modificar orden"
                  >
                    Modificar
                  </Link>
                );
              }

              return (
                <tr key={orden.id}>
                  <td><strong>{orden.id}</strong></td>
                  <td>{orden.nombreCliente}</td>
                  <td>{orden.nombreActivo}</td>
                  <td>{orden.tipo}</td>
                  <td>{orden.prioridad}</td>
                  <td>{nombreTecnico}</td>
                  <td>
                    <span className={claseEstado}>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</span>
                  </td>
                  <td>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</td>
                  <td>
                    <div className="table-actions">
                      <Link
                        aria-label="Ver detalle"
                        className="table-action-link"
                        href={"/ordenes-trabajo/" + orden.id}
                        title="Ver detalle"
                      >
                        Ver detalle
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

      <section className="panel">
        {mensajeError}
        {mensajeCargando}
        {mensajeSinResultados}
        {tablaOrdenes}
      </section>
    </main>
  );
}
