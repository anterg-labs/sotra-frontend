"use client";

import Link from "next/link";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { IconoOjo } from "@/componentes/iconos";
import { EncabezadoOrdenable } from "@/componentes/listado/encabezado-ordenable";
import { useFilasConOrdenInstantaneo } from "@/componentes/listado/orden-instantaneo";
import type { ValorOrdenable } from "@/componentes/listado/orden-local";
import type { FiltrosMovimientosStock, MovimientoStock } from "@/tipos/movimiento-stock";
import { formatearFechaCorta } from "@/utilidades/fechas";
import { obtenerEtiquetaTipoMovimiento } from "@/validaciones/movimiento-stock";
import { urlOrdenMovimientos } from "./filtros";

/** Cómo ordenar las filas que ya están en pantalla (misma clave que `ordenarPor` de la API). */
const VALORES_ORDEN = {
  fecha: (fila: MovimientoStock): ValorOrdenable => Date.parse(fila.fecha),
  codigoRepuesto: (fila: MovimientoStock): ValorOrdenable => fila.codigoRepuesto,
  nombreRepuesto: (fila: MovimientoStock): ValorOrdenable => fila.nombreRepuesto,
  tipo: (fila: MovimientoStock): ValorOrdenable => fila.tipo,
  cantidad: (fila: MovimientoStock): ValorOrdenable => fila.cantidad,
  ubicacion: (fila: MovimientoStock): ValorOrdenable => fila.ubicacion,
  nombreUsuario: (fila: MovimientoStock): ValorOrdenable => fila.nombreUsuario,
  motivo: (fila: MovimientoStock): ValorOrdenable => fila.motivo,
};

/** Tabla del listado de movimientos de stock: se ordena al instante cuando todas las filas caben en una página. */
export function TablaMovimientos(props: { movimientos: MovimientoStock[]; filtros: FiltrosMovimientosStock; unaSolaPagina?: boolean }) {
  const { filtros } = props;
  const movimientos = useFilasConOrdenInstantaneo(props.movimientos, VALORES_ORDEN, props.unaSolaPagina ?? false);
  const columna = (clave: string, etiqueta: string) => (
    <EncabezadoOrdenable columna={clave} etiqueta={etiqueta} orden={filtros} urlSiguiente={urlOrdenMovimientos(filtros, clave)} />
  );

  return (
    <ContenedorTabla etiqueta="Listado de movimientos de stock">
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
    </ContenedorTabla>
  );
}
