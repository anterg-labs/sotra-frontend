"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { EvidenciasOrdenTrabajo } from "@/componentes/evidencias-orden-trabajo";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import {
  cambiarEstadoOrdenTrabajo,
  formatearFechaPrevista,
  obtenerEtiquetaEstadoOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import type { EstadoOrdenTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";
import { formatearFechaHora } from "@/utilidades/fechas";

/** Estados a los que puede llevar la orden un técnico; no cancela ni cierra (eso es del jefe de mantenimiento). */
const accionesDelTecnico: Partial<Record<EstadoOrdenTrabajo, { etiqueta: string; principal: boolean }>> = {
  en_ejecucion: { etiqueta: "Iniciar", principal: true },
  pausada: { etiqueta: "Pausar", principal: false },
  finalizada: { etiqueta: "Finalizar", principal: true },
};

/** Orden del técnico: los datos llegan del servidor; el cambio de estado y las evidencias (cámara incluida) siguen en el navegador. */
export function OrdenDelTecnico(props: { ordenInicial: OrdenTrabajo }) {
  const [orden, setOrden] = useState<OrdenTrabajo>(props.ordenInicial);
  const [estadoPendiente, setEstadoPendiente] = useState<EstadoOrdenTrabajo | null>(null);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");
  const [estaGuardando, setEstaGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const referenciaMotivo = useRef<HTMLTextAreaElement>(null);

  function pedirCambio(estado: EstadoOrdenTrabajo) {
    setMotivo("");
    setErrorMotivo("");
    setMensaje("");
    setEstadoPendiente(estado);
  }

  async function confirmarCambio() {
    if (estadoPendiente === null) return;
    if (estadoPendiente === "pausada" && motivo.trim() === "") {
      setErrorMotivo("Indicá por qué pausás la orden.");
      referenciaMotivo.current?.focus();
      return;
    }

    setEstaGuardando(true);
    try {
      setOrden(await cambiarEstadoOrdenTrabajo(orden.id, orden.estado, estadoPendiente, motivo));
      setMensaje("Estado actualizado: " + obtenerEtiquetaEstadoOrdenTrabajo(estadoPendiente) + ".");
      setEstadoPendiente(null);
    } catch (falla) {
      setErrorMotivo(falla instanceof Error ? falla.message : "No se pudo cambiar el estado.");
    } finally {
      setEstaGuardando(false);
    }
  }

  const acciones = orden.estadosSiguientes.filter((estado) => estado in accionesDelTecnico);
  const puedeRegistrarEvidencias = orden.estado !== "cerrada" && orden.estado !== "cancelada";

  return (
    <article className="grid gap-4" style={{ paddingBottom: acciones.length > 0 ? 72 : 0 }}>
      <Link className="text-link" href="/tecnico">← Volver a mi trabajo</Link>

      <header className="tecnico-tarjeta">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <h1 style={{ fontSize: "1.25rem" }}>{"Orden #" + orden.id}</h1>
          <span className={"status status-" + orden.estado}>{obtenerEtiquetaEstadoOrdenTrabajo(orden.estado)}</span>
        </span>
        <strong>{orden.nombreActivo}</strong>
        <small>{orden.nombreCliente + " · prioridad " + orden.prioridad + " · " + orden.tipo}</small>
        <small>{"Fecha prevista: " + formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</small>
      </header>

      {mensaje ? <p className="rounded-lg u-fondo-exito p-3 text-sm" role="status">{mensaje}</p> : null}

      <section aria-labelledby="titulo-descripcion" className="tecnico-tarjeta">
        <h2 id="titulo-descripcion">Qué hay que hacer</h2>
        <p>{orden.descripcion}</p>
        {orden.observaciones ? <small>{orden.observaciones}</small> : null}
      </section>

      {orden.repuestos.length > 0 ? (
        <section aria-labelledby="titulo-repuestos" className="tecnico-tarjeta">
          <h2 id="titulo-repuestos">Repuestos</h2>
          <ul>
            {orden.repuestos.map((repuesto) => (
              <li key={repuesto.id}>{repuesto.codigo + " · " + repuesto.nombre}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {orden.sugerencias.length > 0 ? (
        <section aria-labelledby="titulo-sugerencias" className="tecnico-tarjeta">
          <h2 id="titulo-sugerencias">Sugerencias de la IA</h2>
          {orden.sugerencias.map((sugerencia, indice) => (
            <p key={indice} style={{ whiteSpace: "pre-wrap" }}>{sugerencia}</p>
          ))}
        </section>
      ) : null}

      <section aria-label="Evidencias" className="tecnico-tarjeta">
        <EvidenciasOrdenTrabajo ordenTrabajoId={orden.id} permiteRegistrar={puedeRegistrarEvidencias} />
      </section>

      <section aria-labelledby="titulo-historial" className="tecnico-tarjeta">
        <h2 id="titulo-historial">Historial</h2>
        <ol>
          {[...orden.historialEstados].reverse().map((cambio, indice) => (
            <li key={indice}>
              <strong>{obtenerEtiquetaEstadoOrdenTrabajo(cambio.estado)}</strong>
              {" · " + formatearFechaHora(cambio.fechaHora)}
              {cambio.observacion ? <small>{" — " + cambio.observacion}</small> : null}
            </li>
          ))}
        </ol>
      </section>

      {acciones.length > 0 ? (
        <div aria-label="Acciones de la orden" className="tecnico-acciones" role="group">
          {acciones.map((estado) => {
            const accion = accionesDelTecnico[estado]!;
            const etiqueta = estado === "en_ejecucion" && orden.estado === "pausada" ? "Reanudar" : accion.etiqueta;
            return (
              <button className={accion.principal ? "primary-button" : "secondary-button"} key={estado} onClick={() => pedirCambio(estado)} type="button">
                {etiqueta}
              </button>
            );
          })}
        </div>
      ) : null}

      {estadoPendiente === "pausada" ? (
        <div className="modal-overlay" role="presentation">
          <div aria-labelledby="titulo-pausa" aria-modal="true" className="modal-panel" role="dialog">
            <h2 id="titulo-pausa">Pausar la orden</h2>
            <div className="form-field mt-3">
              <label htmlFor="motivoPausa">Motivo de la pausa</label>
              <textarea
                aria-describedby={errorMotivo ? "motivoPausa-error" : undefined}
                aria-invalid={errorMotivo ? true : undefined}
                id="motivoPausa"
                onChange={(evento) => setMotivo(evento.target.value)}
                ref={referenciaMotivo}
                rows={3}
                value={motivo}
              />
              {errorMotivo ? <p className="field-error" id="motivoPausa-error" role="alert">{errorMotivo}</p> : null}
            </div>
            <div className="form-actions">
              <button className="secondary-button" onClick={() => setEstadoPendiente(null)} type="button">Cancelar</button>
              <button className="primary-button" disabled={estaGuardando} onClick={confirmarCambio} type="button">
                {estaGuardando ? "Guardando…" : "Confirmar pausa"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {estadoPendiente === "finalizada" || estadoPendiente === "en_ejecucion" ? (
        <ModalConfirmacion
          descripcion={estadoPendiente === "finalizada"
            ? "¿Confirmás que el trabajo está terminado? El jefe de mantenimiento lo va a validar."
            : orden.estado === "pausada" ? "¿Querés reanudar el trabajo de esta orden?" : "¿Querés iniciar el trabajo de esta orden?"}
          estaConfirmando={estaGuardando}
          etiquetaConfirmar={estadoPendiente === "finalizada" ? "Finalizar" : orden.estado === "pausada" ? "Reanudar" : "Iniciar"}
          onCancelar={() => setEstadoPendiente(null)}
          onConfirmar={confirmarCambio}
          titulo={estadoPendiente === "finalizada" ? "Finalizar la orden" : orden.estado === "pausada" ? "Reanudar la orden" : "Iniciar la orden"}
        />
      ) : null}
    </article>
  );
}
