"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ContenedorTabla } from "@/componentes/contenedor-tabla";
import { EtiquetaEstadoOrden } from "@/componentes/estados-orden";
import { Modal } from "@/componentes/modal";
import { formatearFechaPrevista } from "@/servicios/servicio-ordenes-trabajo";
import { listarOrdenesComprometidas } from "@/servicios/servicio-repuestos";
import type { OrdenComprometida } from "@/tipos/repuesto";
import { formatearFechaNumerica } from "@/utilidades/fechas";

const MENSAJE_ERROR = "No se pudieron obtener las órdenes que tienen reservado este repuesto.";

type Carga = { estado: "cargando" } | { estado: "error" } | { estado: "listo"; ordenes: OrdenComprometida[] };

/**
 * Órdenes que tienen unidades del repuesto reservadas (todavía no empezaron). El modal solo monta su contenido mientras
 * está abierto, así que cada apertura consulta lo que hay en ese momento.
 */
export function ModalOrdenesReservadas(props: { repuestoId: number; estaAbierto: boolean; alCerrar: () => void }) {
  return (
    <Modal
      alCerrar={props.alCerrar}
      descripcion="Unidades apartadas para órdenes que todavía no empezaron. Pasan a entregadas cuando la orden empieza y se descuentan del stock al cerrarla."
      estaAbierto={props.estaAbierto}
      tamano="amplio"
      titulo="Órdenes con este repuesto reservado"
    >
      <ListaOrdenesReservadas repuestoId={props.repuestoId} />
    </Modal>
  );
}

function ListaOrdenesReservadas(props: { repuestoId: number }) {
  const { repuestoId } = props;
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });

  useEffect(() => {
    let vigente = true;
    listarOrdenesComprometidas(repuestoId, "reservado")
      .then((ordenes) => {
        if (vigente) setCarga({ estado: "listo", ordenes });
      })
      .catch(() => {
        if (vigente) setCarga({ estado: "error" });
      });
    return () => {
      vigente = false;
    };
  }, [repuestoId]);

  if (carga.estado === "cargando") return <p className="empty-state">Cargando órdenes…</p>;
  if (carga.estado === "error") return <p className="form-error-banner">{MENSAJE_ERROR}</p>;
  if (carga.ordenes.length === 0) return <p className="empty-state">Ninguna orden tiene este repuesto reservado.</p>;

  return (
    <ContenedorTabla etiqueta="Órdenes con el repuesto reservado">
      <table>
        <thead>
          <tr>
            <th>Orden</th>
            <th>Cantidad</th>
            <th>Estado de la orden</th>
            <th>Cliente y activo</th>
            <th>Técnico</th>
            <th>Fecha prevista</th>
            <th>Reservado desde</th>
          </tr>
        </thead>
        <tbody>
          {carga.ordenes.map((orden) => (
            <tr key={orden.ordenId}>
              <td className="celda-numerica whitespace-nowrap">
                <Link aria-label={"Ver la orden " + orden.ordenId} className="text-link" href={"/ordenes-trabajo/" + orden.ordenId}>
                  {"N° " + orden.ordenId}
                </Link>
              </td>
              <td className="celda-numerica">{orden.cantidad}</td>
              <td><EtiquetaEstadoOrden estado={orden.estadoOrden} /></td>
              <td>
                {orden.nombreCliente}
                <small className="block texto-tenue">{orden.nombreActivo}</small>
              </td>
              <td>{orden.nombreTecnico ?? "Sin asignar"}</td>
              <td className="whitespace-nowrap">{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</td>
              <td className="whitespace-nowrap">{orden.desde ? formatearFechaNumerica(orden.desde) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ContenedorTabla>
  );
}
