"use client";

import Link from "next/link";
import { IconoOjo } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import type { FiltrosMovimientosStock, MovimientoStock } from "@/tipos/movimiento-stock";
import { formatearFechaCorta } from "@/utilidades/fechas";
import { obtenerEtiquetaTipoMovimiento } from "@/validaciones/movimiento-stock";
import { urlOrdenMovimientos } from "./filtros";

/** Tabla del listado de movimientos de stock: se ordena al instante cuando todas las filas caben en una página. */
export function TablaMovimientos(props: { movimientos: MovimientoStock[]; filtros: FiltrosMovimientosStock; unaSolaPagina?: boolean }) {
  const { filtros } = props;
  const movimientos = props.movimientos;
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable columna={clave} etiqueta={etiqueta} orden={filtros} urlSiguiente={urlOrdenMovimientos(filtros, clave)} />
  );

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columna("fecha", "Fecha")}
            {columna("codigoRepuesto", "Código")}
            {columna("nombreRepuesto", "Repuesto")}
            {columna("tipo", "Tipo")}
            {columna("cantidad", "Cantidad")}
            {columna("ubicacion", "Ubicación")}
            {columna("nombreUsuario", "Usuario")}
            {columna("motivo", "Motivo")}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((movimiento) => (
            <tr key={movimiento.id}>
              <td>{formatearFechaCorta(movimiento.fecha)}</td>
              <td><strong>{movimiento.codigoRepuesto}</strong></td>
              <td>{movimiento.nombreRepuesto}</td>
              <td>{obtenerEtiquetaTipoMovimiento(movimiento.tipo)}</td>
              <td className="celda-numerica">{movimiento.cantidad}</td>
              <td>{movimiento.ubicacion}</td>
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
    </div>
  );
}
