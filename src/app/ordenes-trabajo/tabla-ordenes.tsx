"use client";

import Link from "next/link";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { IconoLapiz, IconoOjo } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";
import { SiTienePermiso } from "@/componentes/sesion/contexto-sesion";
import { EtiquetaEstadoOrden, useFaseEstadoOrden } from "@/componentes/estados-orden";
import { formatearFechaPrevista } from "@/servicios/servicio-ordenes-trabajo";
import type { FiltrosOrdenesTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";
import { formatearFechaCorta } from "@/utilidades/fechas";
import { urlOrdenOrdenes } from "./filtros";

const RANGO_PRIORIDAD: Record<string, number> = { baja: 1, media: 2, alta: 3 };

/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  id: (fila: OrdenTrabajo): ValorOrdenable => fila.id,
  nombreCliente: (fila: OrdenTrabajo): ValorOrdenable => fila.nombreCliente,
  nombreActivo: (fila: OrdenTrabajo): ValorOrdenable => fila.nombreActivo,
  tipo: (fila: OrdenTrabajo): ValorOrdenable => fila.tipo,
  prioridad: (fila: OrdenTrabajo): ValorOrdenable => RANGO_PRIORIDAD[fila.prioridad] ?? 0,
  nombreTecnico: (fila: OrdenTrabajo): ValorOrdenable => fila.nombreTecnico,
  estado: (fila: OrdenTrabajo): ValorOrdenable => fila.estado,
  creadoEn: (fila: OrdenTrabajo): ValorOrdenable => Date.parse(fila.creadoEn),
  fechaPrevistaEjecucion: (fila: OrdenTrabajo): ValorOrdenable => fila.fechaPrevistaEjecucion,
};

/** Tabla del listado de órdenes: se ordena al instante en el navegador cuando todas las filas caben en una página. */
export function TablaOrdenes(props: { ordenes: OrdenTrabajo[]; filtros: FiltrosOrdenesTrabajo; unaSolaPagina?: boolean }) {
  const { filtros } = props;
  const faseDelEstado = useFaseEstadoOrden();
  const ordenes = useFilasConOrdenInstantaneo(props.ordenes, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable columna={clave} etiqueta={etiqueta} orden={filtros} urlSiguiente={urlOrdenOrdenes(filtros, clave)} />
  );

  return (
    <ContenedorTabla etiqueta="Listado de órdenes de trabajo">
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
              <td className="celda-numerica"><strong>{orden.id}</strong></td>
              <td>{orden.nombreCliente}</td>
              <td>{orden.nombreActivo}</td>
              <td>{orden.tipo}</td>
              <td>
                <span className={"status prioridad-" + orden.prioridad}>{orden.prioridad}</span>
              </td>
              <td>{orden.nombreTecnico ? orden.nombreTecnico : "Sin asignar"}</td>
              <td>
                <EtiquetaEstadoOrden estado={orden.estado} />
              </td>
              <td>{formatearFechaCorta(orden.creadoEn)}</td>
              <td>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</td>
              <td>
                <div className="table-actions">
                  <Link aria-label="Ver detalle" className="boton-icono" href={"/ordenes-trabajo/" + orden.id} title="Ver detalle">
                    <IconoOjo />
                  </Link>
                  {faseDelEstado(orden.estado) !== "cerrada" && faseDelEstado(orden.estado) !== "eliminada" ? (
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
    </ContenedorTabla>
  );
}
