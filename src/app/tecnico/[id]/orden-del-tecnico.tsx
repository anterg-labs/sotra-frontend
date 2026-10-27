"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { EvidenciasOrdenTrabajo } from "@/componentes/evidencias-orden-trabajo";
import { ModalConfirmacion } from "@/componentes/modal-confirmacion";
import {
  cambiarEstadoOrdenTrabajo,
  formatearFechaPrevista,
} from "@/servicios/servicio-ordenes-trabajo";
import { EtiquetaEstadoOrden, useEtiquetaEstadoOrden } from "@/componentes/estados-orden";
import type { OrdenTrabajo, TransicionOrden } from "@/tipos/orden-trabajo";
import { formatearFechaHora } from "@/utilidades/fechas";

/** Orden del técnico: los datos llegan del servidor; el cambio de estado y las evidencias (cámara incluida) siguen en el navegador. */
export function OrdenDelTecnico(props: { ordenInicial: OrdenTrabajo }) {
  const etiquetaEstado = useEtiquetaEstadoOrden();
  const [orden, setOrden] = useState<OrdenTrabajo>(props.ordenInicial);
  const [transicionPendiente, setTransicionPendiente] = useState<TransicionOrden | null>(null);
  const [motivo, setMotivo] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");
  const [estaGuardando, setEstaGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const referenciaMotivo = useRef<HTMLTextAreaElement>(null);

  function pedirCambio(transicion: TransicionOrden) {
    setMotivo("");
    setErrorMotivo("");
    setMensaje("");
    setTransicionPendiente(transicion);
  }

  async function confirmarCambio() {
    if (transicionPendiente === null) return;
    if (transicionPendiente.exigeMotivo && motivo.trim() === "") {
      setErrorMotivo("Indicá el motivo del cambio de estado.");
      referenciaMotivo.current?.focus();
      return;
    }

    setEstaGuardando(true);
    try {
      setOrden(await cambiarEstadoOrdenTrabajo(orden.id, transicionPendiente.estado, motivo, transicionPendiente.exigeMotivo));
      setMensaje("Estado actualizado: " + etiquetaEstado(transicionPendiente.estado) + ".");
      setTransicionPendiente(null);
    } catch (falla) {
      setErrorMotivo(falla instanceof Error ? falla.message : "No se pudo cambiar el estado.");
    } finally {
      setEstaGuardando(false);
    }
  }

  // Qué puede hacer el técnico lo dicta la base (`transicion_estado_ot`); un estado sin salidas es final.
  const acciones = orden.transiciones.filter((transicion) => transicion.puedeTecnico);
  const puedeRegistrarEvidencias = orden.transiciones.length > 0;
  const nombreDeLaAccion = (transicion: TransicionOrden) => transicion.accion ?? etiquetaEstado(transicion.estado);

  return (
    <article className="grid gap-4" style={{ paddingBottom: acciones.length > 0 ? 72 : 0 }}>
      <Link className="text-link" href="/tecnico">← Volver a mi trabajo</Link>

      <header className="tecnico-tarjeta">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <h1 style={{ fontSize: "1.25rem" }}>{"Orden #" + orden.id}</h1>
          <EtiquetaEstadoOrden estado={orden.estado} />
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
              <strong>{etiquetaEstado(cambio.estado)}</strong>
              {" · " + formatearFechaHora(cambio.fechaHora) + (cambio.nombreUsuario ? " · " + cambio.nombreUsuario : "")}
              {cambio.observacion ? <small>{" — " + cambio.observacion}</small> : null}
            </li>
          ))}
        </ol>
      </section>

      {acciones.length > 0 ? (
        <div aria-label="Acciones de la orden" className="tecnico-acciones" role="group">
          {acciones.map((transicion) => (
            <button className={transicion.principal ? "primary-button" : "secondary-button"} key={transicion.estado} onClick={() => pedirCambio(transicion)} type="button">
              {nombreDeLaAccion(transicion)}
            </button>
          ))}
        </div>
      ) : null}

      {transicionPendiente?.exigeMotivo ? (
        <div className="modal-overlay" role="presentation">
          <div aria-labelledby="titulo-pausa" aria-modal="true" className="modal-panel" role="dialog">
            <h2 id="titulo-pausa">{nombreDeLaAccion(transicionPendiente) + " la orden"}</h2>
            <div className="form-field mt-3">
              <label htmlFor="motivoCambio">Motivo del cambio de estado</label>
              <textarea
                aria-describedby={errorMotivo ? "motivoCambio-error" : undefined}
                aria-invalid={errorMotivo ? true : undefined}
                id="motivoCambio"
                onChange={(evento) => setMotivo(evento.target.value)}
                ref={referenciaMotivo}
                required
                rows={3}
                value={motivo}
              />
              {errorMotivo ? <p className="field-error" id="motivoCambio-error" role="alert">{errorMotivo}</p> : null}
            </div>
            <div className="form-actions">
              <button className="secondary-button" onClick={() => setTransicionPendiente(null)} type="button">Cancelar</button>
              <button className="primary-button" disabled={estaGuardando} onClick={confirmarCambio} type="button">
                {estaGuardando ? "Guardando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {transicionPendiente !== null && !transicionPendiente.exigeMotivo ? (
        <ModalConfirmacion
          descripcion={"La orden pasará a «" + etiquetaEstado(transicionPendiente.estado) + "». ¿Querés continuar?"}
          estaConfirmando={estaGuardando}
          etiquetaConfirmar={nombreDeLaAccion(transicionPendiente)}
          onCancelar={() => setTransicionPendiente(null)}
          onConfirmar={confirmarCambio}
          titulo={nombreDeLaAccion(transicionPendiente) + " la orden"}
        />
      ) : null}
    </article>
  );
}
