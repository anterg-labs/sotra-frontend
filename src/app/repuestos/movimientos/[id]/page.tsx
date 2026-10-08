"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { obtenerDetalleMovimientoStock, obtenerEtiquetaTipoMovimiento } from "@/servicios/servicio-movimientos-stock";
import type { MovimientoStock } from "@/tipos/movimiento-stock";

export default function PaginaDetalleMovimientoStock() {
  const parametros = useParams<{ id: string }>();
  const movimientoId = Number(parametros.id);
  const [movimiento, setMovimiento] = useState<MovimientoStock | null>(null);
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    async function cargarMovimiento() {
      try {
        const movimientoObtenido = await obtenerDetalleMovimientoStock(movimientoId);
        setMovimiento(movimientoObtenido);
      } catch {
        setErrorCarga("No se pudo obtener la información del movimiento solicitado.");
      }
    }

    cargarMovimiento();
  }, [movimientoId]);

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let mensajeCargando = null;
  if (movimiento === null && !errorCarga) {
    mensajeCargando = <p className="empty-state">Cargando información del movimiento…</p>;
  }

  let contenido = null;
  if (movimiento !== null) {
    let nombreUsuario = "Sin registrar (todavía no hay login)";
    if (movimiento.nombreUsuario !== null) {
      nombreUsuario = movimiento.nombreUsuario;
    }

    let variacion = "Sin datos";
    if (movimiento.stockAnterior !== null && movimiento.stockPosterior !== null) {
      variacion = "De " + movimiento.stockAnterior + " a " + movimiento.stockPosterior + " unidades";
    }

    let observaciones = "Sin observaciones";
    if (movimiento.observaciones !== "") {
      observaciones = movimiento.observaciones;
    }

    contenido = (
      <section className="panel detail-panel">
        <dl className="detail-list">
          <div>
            <dt>Repuesto</dt>
            <dd>
              <Link className="text-link" href={"/repuestos/" + movimiento.repuestoId}>
                {movimiento.codigoRepuesto + " - " + movimiento.nombreRepuesto}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Tipo de movimiento</dt>
            <dd>{obtenerEtiquetaTipoMovimiento(movimiento.tipo)}</dd>
          </div>
          <div>
            <dt>Cantidad</dt>
            <dd>{movimiento.cantidad}</dd>
          </div>
          <div>
            <dt>Variación del stock</dt>
            <dd>{variacion}</dd>
          </div>
          <div>
            <dt>Fecha del movimiento</dt>
            <dd>{new Date(movimiento.fecha).toLocaleString("es-UY")}</dd>
          </div>
          <div>
            <dt>Ubicación o depósito</dt>
            <dd>{movimiento.ubicacion}</dd>
          </div>
          <div>
            <dt>Usuario responsable</dt>
            <dd>{nombreUsuario}</dd>
          </div>
          <div>
            <dt>Motivo</dt>
            <dd>{movimiento.motivo}</dd>
          </div>
          <div>
            <dt>Observaciones</dt>
            <dd>{observaciones}</dd>
          </div>
        </dl>
      </section>
    );
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Movimientos de stock</p>
          <h1>{"Movimiento N° " + movimientoId}</h1>
        </div>
        <Link className="secondary-button" href="/repuestos/movimientos">
          Volver a movimientos
        </Link>
      </header>

      {mensajeError}
      {mensajeCargando}
      {contenido}
    </main>
  );
}
