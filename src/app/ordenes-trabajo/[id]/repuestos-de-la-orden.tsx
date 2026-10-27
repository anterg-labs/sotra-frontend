"use client";

import { useState } from "react";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";
import { EditorRepuestosOrden, obtenerErrorDeLineas, type LineaRepuestoOrden } from "@/componentes/editor-repuestos-orden";
import { actualizarRepuestosOrdenTrabajo } from "@/servicios/servicio-ordenes-trabajo";
import { obtenerDetalleRepuesto } from "@/servicios/servicio-repuestos";
import type { AccionRepuestoOrden, EstadoRepuestoDeOrden, OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Repuesto } from "@/tipos/repuesto";
import { formatearFechaHora } from "@/utilidades/fechas";

export const ETIQUETAS_ESTADO_REPUESTO: Record<EstadoRepuestoDeOrden, string> = {
  reservado: "Reservado",
  entregado: "Entregado",
  descontado: "Descontado",
};

const ETIQUETAS_ACCION: Record<AccionRepuestoOrden, string> = {
  reservar: "Reservó",
  modificar: "Cambió la cantidad de",
  entregar: "Entregó",
  descontar: "Descontó del stock",
  liberar: "Liberó",
};

type PropiedadesRepuestosDeLaOrden = {
  orden: OrdenTrabajo;
  /** Repuestos de la orden con su stock actual; solo los trae el servidor si el rol puede gestionarlos. */
  repuestosIniciales: Repuesto[];
  puedeGestionar: boolean;
  alActualizar: (orden: OrdenTrabajo) => void;
};

function crearLineas(orden: OrdenTrabajo, repuestos: Repuesto[]): LineaRepuestoOrden[] {
  return orden.repuestos.map((repuestoDeLaOrden) => ({
    repuesto: repuestos.find((repuesto) => repuesto.id === repuestoDeLaOrden.id) ?? {
      id: repuestoDeLaOrden.id, codigo: repuestoDeLaOrden.codigo, nombre: repuestoDeLaOrden.nombre, descripcion: "", marca: "",
      ubicacion: "", cantidad: repuestoDeLaOrden.cantidad, cantidadMinima: 0, cantidadReservada: 0, cantidadEntregada: 0,
      cantidadDisponible: 0, estado: "activo", estadoStock: "normal",
    },
    cantidad: repuestoDeLaOrden.cantidad,
  }));
}

function crearCantidadesDeLaOrden(orden: OrdenTrabajo) {
  const cantidades: Record<number, number> = {};
  for (const repuesto of orden.repuestos) {
    if (repuesto.estado !== "descontado") cantidades[repuesto.id] = repuesto.cantidad;
  }
  return cantidades;
}

/**
 * Repuestos de la orden con su cantidad y su estado (reservado, entregado o descontado), el historial de quién hizo qué
 * y, para quien puede gestionarlos (administrador, jefe y pañolero), el editor con un selector numérico por repuesto.
 */
export function RepuestosDeLaOrden(props: PropiedadesRepuestosDeLaOrden) {
  const { orden } = props;
  const [lineas, setLineas] = useState(() => crearLineas(orden, props.repuestosIniciales));
  const [estaGuardando, setEstaGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const cantidadesDeLaOrden = crearCantidadesDeLaOrden(orden);
  // Una orden sin transiciones de salida (cerrada o eliminada) queda solo para consulta.
  const puedeEditar = props.puedeGestionar && orden.transiciones.length > 0;
  const hayCambios = JSON.stringify(lineas.map((linea) => [linea.repuesto.id, linea.cantidad]).sort())
    !== JSON.stringify(orden.repuestos.map((repuesto) => [repuesto.id, repuesto.cantidad]).sort());

  async function guardar() {
    if (estaGuardando) return;
    const errorDeLineas = obtenerErrorDeLineas(lineas, cantidadesDeLaOrden);
    if (errorDeLineas) {
      setError(errorDeLineas);
      return;
    }
    setError("");
    setExito("");
    setEstaGuardando(true);
    try {
      const ordenActualizada = await actualizarRepuestosOrdenTrabajo(
        orden.id,
        lineas.map((linea) => ({ repuestoId: linea.repuesto.id, cantidad: linea.cantidad })),
      );
      // El stock cambió: se vuelve a leer el de cada repuesto para que el selector refleje lo disponible.
      const actualizados = await Promise.all(
        ordenActualizada.repuestos.map((repuesto) => obtenerDetalleRepuesto(repuesto.id).catch(() => null)),
      );
      const vigentes = actualizados.filter((repuesto): repuesto is Repuesto => repuesto !== null);
      setLineas(crearLineas(ordenActualizada, vigentes));
      props.alActualizar(ordenActualizada);
      setExito("Repuestos actualizados correctamente.");
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudieron actualizar los repuestos de la orden de trabajo.");
    } finally {
      setEstaGuardando(false);
    }
  }

  function cambiarLineas(nuevas: LineaRepuestoOrden[]) {
    setLineas(nuevas);
    setError("");
    setExito("");
  }

  return (
    <section aria-labelledby="titulo-repuestos-orden" className="panel detail-panel">
      <h2 id="titulo-repuestos-orden">Repuestos de la orden</h2>
      {orden.repuestos.length === 0 ? (
        <p className="empty-state">La orden no tiene repuestos asignados.</p>
      ) : (
        <table aria-label="Repuestos de la orden" className="mt-3">
          <thead>
            <tr>
              <th>Repuesto</th>
              <th>Cantidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {orden.repuestos.map((repuesto) => (
              <tr key={repuesto.id}>
                <td>{repuesto.codigo + " - " + repuesto.nombre}</td>
                <td className="celda-numerica">{repuesto.cantidad}</td>
                <td>{ETIQUETAS_ESTADO_REPUESTO[repuesto.estado]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-2 text-xs texto-tenue">
        Reservado: ninguna otra orden puede usar esas unidades. Entregado: la orden ya empezó. El stock baja recién cuando la orden se cierra.
      </p>

      {puedeEditar ? (
        <div className="mt-4">
          <h3 className="mb-2">Cambiar repuestos y cantidades</h3>
          {error ? <AvisoEnLinea>{error}</AvisoEnLinea> : null}
          {exito ? <p className="mb-3 rounded-lg u-fondo-exito p-3 text-sm">{exito}</p> : null}
          <EditorRepuestosOrden
            alCambiar={cambiarLineas}
            cantidadesDeLaOrden={cantidadesDeLaOrden}
            deshabilitado={estaGuardando}
            lineas={lineas}
          />
          <div className="form-actions">
            <button className="primary-button" disabled={estaGuardando || !hayCambios} onClick={guardar} type="button">
              {estaGuardando ? "Guardando…" : "Guardar repuestos"}
            </button>
          </div>
        </div>
      ) : null}

      {orden.historialRepuestos.length > 0 ? (
        <div className="mt-5">
          <h3>Historial de repuestos</h3>
          <ul aria-label="Historial de repuestos" className="mt-3 grid gap-3">
            {[...orden.historialRepuestos].reverse().map((cambio, indice) => (
              <li className="border-b u-borde pb-3 text-sm" key={indice}>
                <strong>
                  {ETIQUETAS_ACCION[cambio.accion]} {cambio.codigo} - {cambio.nombre}
                </strong>
                <span className="block">
                  {cambio.cantidadAnterior !== null && cambio.cantidadAnterior !== cambio.cantidadNueva
                    ? `${cambio.cantidadAnterior} → ${cambio.cantidadNueva} unidades`
                    : `${cambio.cantidadNueva} unidades`}
                  {" · "}
                  {cambio.estadoAnterior && cambio.estadoAnterior !== cambio.estadoNuevo
                    ? `${cambio.estadoAnterior} → ${cambio.estadoNuevo}`
                    : cambio.estadoNuevo}
                </span>
                <span className="block text-xs texto-tenue">
                  {formatearFechaHora(cambio.fechaHora)}
                  {cambio.nombreUsuario ? " · " + cambio.nombreUsuario : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
