"use client";

import Link from "next/link";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { IconoOjo } from "@/componentes/iconos";
import { InsigniaStock } from "@/componentes/indicador-stock";
import { EncabezadoOrdenLocal, useOrdenLocal } from "@/componentes/listado/orden-local";
import { obtenerEtiquetaEstadoOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import type { MovimientoStock } from "@/tipos/movimiento-stock";
import type { OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { CantidadPorGrupo } from "@/tipos/reporte";
import type { Repuesto } from "@/tipos/repuesto";
import { formatearFechaHora } from "@/utilidades/fechas";
import { obtenerEtiquetaTipoMovimiento } from "@/validaciones/movimiento-stock";

/**
 * Tablas de resumen que ya traen todas sus filas: se ordenan en el navegador al hacer clic en el título de la columna
 * (sin pedir nada al servidor ni recargar). Los listados paginados ordenan en el servidor con `EncabezadoOrdenable`.
 */

const RANGO_PRIORIDAD: Record<string, number> = { baja: 1, media: 2, alta: 3 };
const RANGO_STOCK: Record<string, number> = { sin_stock: 0, bajo: 1, normal: 2 };

type ColumnaOrdenes = "id" | "cliente" | "activo" | "tecnico" | "prioridad" | "estado";

const VALORES_ORDENES = {
  id: (orden: OrdenTrabajo) => orden.id,
  cliente: (orden: OrdenTrabajo) => orden.nombreCliente,
  activo: (orden: OrdenTrabajo) => orden.nombreActivo,
  tecnico: (orden: OrdenTrabajo) => orden.nombreTecnico,
  prioridad: (orden: OrdenTrabajo) => RANGO_PRIORIDAD[orden.prioridad] ?? 0,
  estado: (orden: OrdenTrabajo) => obtenerEtiquetaEstadoOrdenTrabajo(orden.estado),
} satisfies Record<ColumnaOrdenes, (orden: OrdenTrabajo) => string | number | null>;

/** «Órdenes recientes» de Inicio y de Reportes. */
export function TablaOrdenesResumen(props: { ordenes: OrdenTrabajo[]; etiqueta: string }) {
  const { filasOrdenadas, orden, alternar } = useOrdenLocal(props.ordenes, VALORES_ORDENES);
  const encabezado = (columna: ColumnaOrdenes, etiqueta: string) => (
    <EncabezadoOrdenLocal alternar={alternar} columna={columna} etiqueta={etiqueta} orden={orden} />
  );

  return (
    <ContenedorTabla etiqueta={props.etiqueta}>
      <table>
        <thead>
          <tr>
            {encabezado("id", "N°")}
            {encabezado("cliente", "Cliente")}
            {encabezado("activo", "Activo")}
            {encabezado("tecnico", "Técnico")}
            {encabezado("prioridad", "Prioridad")}
            {encabezado("estado", "Estado")}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filasOrdenadas.map((fila) => (
            <tr key={fila.id}>
              <td className="celda-numerica"><strong>{fila.id}</strong></td>
              <td>{fila.nombreCliente}</td>
              <td>{fila.nombreActivo}</td>
              <td>{fila.nombreTecnico ?? "Sin asignar"}</td>
              <td>{fila.prioridad}</td>
              <td>{obtenerEtiquetaEstadoOrdenTrabajo(fila.estado)}</td>
              <td>
                <Link aria-label="Ver detalle" className="boton-icono" href={"/ordenes-trabajo/" + fila.id} title="Ver detalle">
                  <IconoOjo />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContenedorTabla>
  );
}

type ColumnaGrupos = "nombre" | "cantidad";

const VALORES_GRUPOS = {
  nombre: (grupo: CantidadPorGrupo) => grupo.nombre,
  cantidad: (grupo: CantidadPorGrupo) => grupo.cantidad,
} satisfies Record<ColumnaGrupos, (grupo: CantidadPorGrupo) => string | number | null>;

/** Cantidades por estado, prioridad, tipo, técnico o activo (tablero de Reportes). */
export function TablaCantidadesPorGrupo(props: { titulo: string; columna: string; grupos: CantidadPorGrupo[] }) {
  const { filasOrdenadas, orden, alternar } = useOrdenLocal(props.grupos, VALORES_GRUPOS);

  return (
    <ContenedorTabla etiqueta={props.titulo}>
      <table>
        <thead>
          <tr>
            <EncabezadoOrdenLocal alternar={alternar} columna="nombre" etiqueta={props.columna} orden={orden} />
            <EncabezadoOrdenLocal alternar={alternar} columna="cantidad" etiqueta="Cantidad" orden={orden} />
          </tr>
        </thead>
        <tbody>
          {filasOrdenadas.map((grupo) => (
            <tr key={grupo.nombre}>
              <td>{grupo.nombre}</td>
              <td className="celda-numerica">{grupo.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContenedorTabla>
  );
}

type ColumnaRepuestos = "codigo" | "nombre" | "cantidad" | "cantidadMinima" | "estado";

const VALORES_REPUESTOS = {
  codigo: (repuesto: Repuesto) => repuesto.codigo,
  nombre: (repuesto: Repuesto) => repuesto.nombre,
  cantidad: (repuesto: Repuesto) => repuesto.cantidad,
  cantidadMinima: (repuesto: Repuesto) => repuesto.cantidadMinima,
  estado: (repuesto: Repuesto) => RANGO_STOCK[repuesto.estadoStock] ?? 3,
} satisfies Record<ColumnaRepuestos, (repuesto: Repuesto) => string | number | null>;

/** «Repuestos con bajo stock» del tablero de Reportes. */
export function TablaRepuestosBajoStock(props: { repuestos: Repuesto[] }) {
  const { filasOrdenadas, orden, alternar } = useOrdenLocal(props.repuestos, VALORES_REPUESTOS);
  const encabezado = (columna: ColumnaRepuestos, etiqueta: string) => (
    <EncabezadoOrdenLocal alternar={alternar} columna={columna} etiqueta={etiqueta} orden={orden} />
  );

  return (
    <ContenedorTabla etiqueta="Repuestos con bajo stock">
      <table>
        <thead>
          <tr>
            {encabezado("codigo", "Código")}
            {encabezado("nombre", "Nombre")}
            {encabezado("cantidad", "Cantidad")}
            {encabezado("cantidadMinima", "Mínima")}
            {encabezado("estado", "Estado")}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filasOrdenadas.map((repuesto) => (
            <tr key={repuesto.id}>
              <td><strong>{repuesto.codigo}</strong></td>
              <td>{repuesto.nombre}</td>
              <td className="celda-numerica">{repuesto.cantidad}</td>
              <td className="celda-numerica">{repuesto.cantidadMinima}</td>
              <td><InsigniaStock estadoStock={repuesto.estadoStock} /></td>
              <td>
                <Link aria-label="Ver detalle" className="boton-icono" href={"/repuestos/" + repuesto.id} title="Ver detalle">
                  <IconoOjo />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContenedorTabla>
  );
}

type ColumnaMovimientos = "fecha" | "tipo" | "cantidad" | "stock" | "usuario" | "motivo";

const VALORES_MOVIMIENTOS = {
  fecha: (movimiento: MovimientoStock) => Date.parse(movimiento.fecha),
  tipo: (movimiento: MovimientoStock) => obtenerEtiquetaTipoMovimiento(movimiento.tipo),
  cantidad: (movimiento: MovimientoStock) => movimiento.cantidad,
  stock: (movimiento: MovimientoStock) => movimiento.stockPosterior,
  usuario: (movimiento: MovimientoStock) => movimiento.nombreUsuario,
  motivo: (movimiento: MovimientoStock) => movimiento.motivo,
} satisfies Record<ColumnaMovimientos, (movimiento: MovimientoStock) => string | number | null>;

/** Últimos movimientos de stock del detalle de un repuesto. */
export function TablaMovimientosRepuesto(props: { movimientos: MovimientoStock[] }) {
  const { filasOrdenadas, orden, alternar } = useOrdenLocal(props.movimientos, VALORES_MOVIMIENTOS);
  const encabezado = (columna: ColumnaMovimientos, etiqueta: string) => (
    <EncabezadoOrdenLocal alternar={alternar} columna={columna} etiqueta={etiqueta} orden={orden} />
  );

  return (
    <ContenedorTabla etiqueta="Historial de movimientos del repuesto">
      <table>
        <thead>
          <tr>
            {encabezado("fecha", "Fecha y hora")}
            {encabezado("tipo", "Tipo")}
            {encabezado("cantidad", "Cantidad")}
            {encabezado("stock", "Stock")}
            {encabezado("usuario", "Usuario")}
            {encabezado("motivo", "Motivo")}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filasOrdenadas.map((movimiento) => (
            <tr key={movimiento.id}>
              <td>{formatearFechaHora(movimiento.fecha)}</td>
              <td>{obtenerEtiquetaTipoMovimiento(movimiento.tipo)}</td>
              <td className="celda-numerica">{movimiento.cantidad}</td>
              <td className="celda-numerica">{movimiento.stockAnterior + " → " + movimiento.stockPosterior}</td>
              <td>{movimiento.nombreUsuario ?? "Sin registrar"}</td>
              <td>{movimiento.motivo}</td>
              <td>
                <Link aria-label="Ver detalle" className="boton-icono" href={"/repuestos/movimientos/" + movimiento.id} title="Ver detalle">
                  <IconoOjo />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContenedorTabla>
  );
}
