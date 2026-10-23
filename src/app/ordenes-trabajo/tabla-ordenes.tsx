"use client";

import Link from "next/link";
import { IconoLapiz, IconoOjo } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { formatearFechaPrevista, obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import type { FiltrosOrdenesTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";
import { formatearFechaCorta } from "@/utilidades/fechas";
import { urlOrdenOrdenes } from "./filtros";

/** Tabla del listado de órdenes: se ordena al instante en el navegador cuando todas las filas caben en una página. */
export function TablaOrdenes(props: { ordenes: OrdenTrabajo[]; filtros: FiltrosOrdenesTrabajo; unaSolaPagina?: boolean }) {
  const { filtros } = props;
  const ordenes = props.ordenes;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable columna={clave} etiqueta={etiqueta} orden={filtros} urlSiguiente={urlOrdenOrdenes(filtros, clave)} />
  );

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columna("id", "N°")}
            {columna("nombreCliente", "Cliente")}
            {columna("nombreActivo", "Activo")}
            {columna("tipo", "Tipo")}
            {columna("prioridad", "Prioridad")}
            {columna("nombreTecnico", "Técnico")}
            {columna("estado", "Estado")}
            {columna("creadoEn", "Fecha de creación")}
            {columna("fechaPrevistaEjecucion", "Fecha prevista")}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((orden) => (
            <tr key={orden.id}>
              <td><strong>{orden.id}</strong></td>
              <td>{orden.nombreCliente}</td>
              <td>{orden.nombreActivo}</td>
              <td>{orden.tipo}</td>
              <td>
                <span className={"status prioridad-" + orden.prioridad}>{orden.prioridad}</span>
              </td>
              <td>{orden.nombreTecnico ? orden.nombreTecnico : "Sin asignar"}</td>
              <td>
                <span className={"status status-" + orden.estado}>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</span>
              </td>
              <td>{formatearFechaCorta(orden.creadoEn)}</td>
              <td>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</td>
              <td>
                <div className="table-actions">
                  <Link aria-label="Ver detalle" className="boton-icono" href={"/ordenes-trabajo/" + orden.id} title="Ver detalle">
                    <IconoOjo />
                  </Link>
                  {orden.estado !== "cerrada" ? (
                    <SiTienePermiso permiso="ot.editar">
                      <Link aria-label="Modificar orden" className="boton-icono" href={"/ordenes-trabajo/" + orden.id + "/editar"} title="Modificar orden">
                        <IconoLapiz />
                      </Link>
                    </SiTienePermiso>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
