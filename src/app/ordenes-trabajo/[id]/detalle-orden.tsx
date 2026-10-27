"use client";

import Link from "next/link";
import { useState } from "react";
import { EvidenciasOrdenTrabajo } from "@/componentes/evidencias-orden-trabajo";
import { Combobox } from "@/componentes/combobox";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import {
  asignarTecnicoOrdenTrabajo,
  cambiarEstadoOrdenTrabajo,
  formatearFechaPrevista,
  listarTecnicosPaginados,
} from "@/servicios/servicio-ordenes-trabajo";
import { EtiquetaEstadoOrden, useEtiquetaEstadoOrden } from "@/componentes/estados-orden";
import type { HistorialEstadoOrdenTrabajo, OrdenTrabajo } from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";
import { formatearFechaCorta, formatearFechaHora } from "@/utilidades/fechas";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";
import { EnlaceVolver } from "@/componentes/enlace-volver";

type PropiedadesDetalleOrden = {
  ordenInicial: OrdenTrabajo;
  tecnicosIniciales: Usuario[];
  /** La orden se cargó en el servidor; si falló la lista de técnicos, se informa pero el detalle sigue disponible. */
  huboErrorTecnicos: boolean;
};

/** Detalle de la orden: los datos llegan del servidor; el cambio de estado, la asignación y las evidencias siguen en el navegador. */
export function DetalleOrdenTrabajo(props: PropiedadesDetalleOrden) {
  const ordenTrabajoId = props.ordenInicial.id;
  const etiquetaEstado = useEtiquetaEstadoOrden();
  const [orden, setOrden] = useState<OrdenTrabajo | null>(props.ordenInicial);
  const puedeEditar = useTienePermiso("ot.editar");
  const puedeAsignarTecnico = useTienePermiso("ot.asignar_tecnico");
  const puedeRegistrarAvance = useTienePermiso("ot.registrar_avance");
  const errorCarga = puedeAsignarTecnico && props.huboErrorTecnicos ? "No se pudo obtener el listado de técnicos." : "";
  const tecnicos = props.tecnicosIniciales;
  const [tecnicoSeleccionadoId, setTecnicoSeleccionadoId] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [motivoEstado, setMotivoEstado] = useState("");
  const [estaGuardandoTecnico, setEstaGuardandoTecnico] = useState(false);
  const [estaGuardandoEstado, setEstaGuardandoEstado] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  function cambiarMotivoEstado(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setMotivoEstado(evento.target.value);
    setErrorMotivo("");
  }

  async function confirmarTecnico() {
    if (orden === null || estaGuardandoTecnico) return;
    if (tecnicoSeleccionadoId === String(orden.tecnicoId)) {
      setErrorAccion("El técnico ya está asignado a esta orden de trabajo.");
      return;
    }
    setErrorAccion("");
    setMensajeExito("");
    setEstaGuardandoTecnico(true);

    try {
      const ordenActualizada = await asignarTecnicoOrdenTrabajo(ordenTrabajoId, tecnicoSeleccionadoId);
      setOrden(ordenActualizada);
      setTecnicoSeleccionadoId("");
      setMensajeExito("Técnico asignado correctamente.");
    } catch (error) {
      let mensaje = "No se pudo asignar el técnico a la orden de trabajo.";
      if (error instanceof Error) {
        mensaje = error.message;
      }
      setErrorAccion(mensaje);
    } finally {
      setEstaGuardandoTecnico(false);
    }
  }

  async function confirmarEstado() {
    if (orden === null) {
      return;
    }

    setErrorAccion("");
    setMensajeExito("");
    const exigeMotivo = orden.transiciones.find((transicion) => transicion.estado === estadoSeleccionado)?.exigeMotivo ?? false;
    if (exigeMotivo && motivoEstado.trim() === "") {
      setErrorMotivo("Indicá el motivo u observación del cambio de estado.");
      document.getElementById("motivoCambioEstado")?.focus();
      return;
    }
    setEstaGuardandoEstado(true);

    try {
      const ordenActualizada = await cambiarEstadoOrdenTrabajo(ordenTrabajoId, estadoSeleccionado, motivoEstado, exigeMotivo);
      setOrden(ordenActualizada);
      setEstadoSeleccionado("");
      setMotivoEstado("");
      setErrorMotivo("");
      setMensajeExito("Estado actualizado correctamente.");
    } catch (error) {
      let mensaje = "No se pudo cambiar el estado de la orden de trabajo.";
      if (error instanceof Error) {
        mensaje = error.message;
      }
      setErrorAccion(mensaje);
    } finally {
      setEstaGuardandoEstado(false);
    }
  }

  let mensajeError = null;
  if (errorCarga) {
    mensajeError = <p className="form-error-banner">{errorCarga}</p>;
  }

  let contenidoOrden = null;
  if (orden !== null) {
    let nombreTecnico = "Sin asignar";
    if (orden.nombreTecnico) {
      nombreTecnico = orden.nombreTecnico;
    }

    let textoObservaciones = "Sin observaciones";
    if (orden.observaciones) {
      textoObservaciones = orden.observaciones;
    }

    let textoRepuestos = <span>Sin repuestos asociados</span>;
    if (orden.repuestos.length > 0) {
      textoRepuestos = (
        <ul>
          {orden.repuestos.map((repuestoDeLaOrden) => (
            <li key={repuestoDeLaOrden.id}>{repuestoDeLaOrden.codigo + " - " + repuestoDeLaOrden.nombre}</li>
          ))}
        </ul>
      );
    }

    let textoSugerencias = <span>Sin sugerencias</span>;
    if (orden.sugerencias.length > 0) {
      textoSugerencias = (
        <div className="flex flex-col gap-3">
          {orden.sugerencias.map((textoSugerencia, indice) => (
            <p className="whitespace-pre-wrap rounded-lg border u-borde u-fondo-suave p-4 text-sm" key={indice}>
              {textoSugerencia}
            </p>
          ))}
        </div>
      );
    }

    const fechaCreacion = formatearFechaCorta(orden.creadoEn);

    // Un estado sin transiciones de salida es final (cerrado o eliminado): la orden queda solo para consulta.
    const ordenEstaTerminada = orden.transiciones.length === 0;

    let enlaceModificar = null;
    if (!ordenEstaTerminada && puedeEditar) {
      enlaceModificar = (
        <Link className="primary-button" href={"/ordenes-trabajo/" + orden.id + "/editar"}>
          Modificar
        </Link>
      );
    }

    let mensajeAccionError = null;
    if (errorAccion) {
      mensajeAccionError = <AvisoEnLinea>{errorAccion}</AvisoEnLinea>;
    }

    let mensajeAccionExito = null;
    if (mensajeExito) {
      mensajeAccionExito = <p className="mb-4 rounded-lg u-fondo-exito p-3 text-sm">{mensajeExito}</p>;
    }

    let seccionTecnico: React.ReactNode = (
      <p className="empty-state">La orden está cerrada o eliminada y solo queda disponible para consulta.</p>
    );
    if (!puedeAsignarTecnico) {
      seccionTecnico = null;
    } else if (!ordenEstaTerminada) {
      let textoBotonTecnico = "Confirmar técnico";
      if (estaGuardandoTecnico) {
        textoBotonTecnico = "Guardando…";
      }

      seccionTecnico = (
        <div>
          <Combobox
            alCambiar={setTecnicoSeleccionadoId}
            buscarOpciones={async (consulta) => {
              const pagina = await listarTecnicosPaginados(consulta);
              return pagina.filter((tecnico) => tecnico.id !== orden.tecnicoId)
                .map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }));
            }}
            etiqueta="Asignar o modificar técnico"
            id="tecnicoAsignado"
            opciones={tecnicos.filter((tecnico) => tecnico.id !== orden.tecnicoId)
              .map((tecnico) => ({ valor: String(tecnico.id), etiqueta: `${tecnico.nombre} ${tecnico.apellido}` }))}
            textoVacio="Seleccioná un técnico"
            valor={tecnicoSeleccionadoId}
          />
          <div className="form-actions">
            <button
              className="primary-button"
              disabled={estaGuardandoTecnico || tecnicoSeleccionadoId === "" || tecnicoSeleccionadoId === String(orden.tecnicoId)}
              onClick={confirmarTecnico}
              type="button"
            >
              {textoBotonTecnico}
            </button>
          </div>
        </div>
      );
    }

    let seccionEstado = <p className="empty-state">No hay cambios de estado disponibles para esta orden.</p>;
    if (!puedeRegistrarAvance) {
      seccionEstado = <p className="empty-state">{"Estado actual: " + etiquetaEstado(orden.estado) + "."}</p>;
    } else if (orden.transiciones.length > 0) {
      let campoMotivo = null;
      if (orden.transiciones.some((transicion) => transicion.estado === estadoSeleccionado && transicion.exigeMotivo)) {
        campoMotivo = (
          <div className="form-field">
            <label htmlFor="motivoCambioEstado">Motivo u observación</label>
            <textarea
              aria-describedby={errorMotivo ? "motivoCambioEstado-error" : undefined}
              aria-invalid={errorMotivo ? true : undefined}
              id="motivoCambioEstado"
              onChange={cambiarMotivoEstado}
              required
              rows={3}
              value={motivoEstado}
            />
            {errorMotivo ? <p className="field-error" id="motivoCambioEstado-error" role="alert">{errorMotivo}</p> : null}
          </div>
        );
      }

      let textoBotonEstado = "Confirmar estado";
      if (estaGuardandoEstado) {
        textoBotonEstado = "Guardando…";
      }

      seccionEstado = (
        <div className="grid gap-4">
          <Combobox
            alCambiar={(estado) => {
              setEstadoSeleccionado(estado);
              setErrorMotivo("");
            }}
            etiqueta="Actualizar estado"
            id="nuevoEstado"
            opciones={orden.transiciones.map((transicion) => ({ valor: transicion.estado, etiqueta: etiquetaEstado(transicion.estado) }))}
            textoVacio="Seleccioná el nuevo estado"
            valor={estadoSeleccionado}
          />
          {campoMotivo}
          <div className="form-actions">
            <button
              className="primary-button"
              disabled={estaGuardandoEstado || estadoSeleccionado === ""}
              onClick={confirmarEstado}
              type="button"
            >
              {textoBotonEstado}
            </button>
          </div>
        </div>
      );
    }

    const historialMasNuevoPrimero: HistorialEstadoOrdenTrabajo[] = [];
    for (let indice = orden.historialEstados.length - 1; indice >= 0; indice = indice - 1) {
      historialMasNuevoPrimero.push(orden.historialEstados[indice]);
    }

    contenidoOrden = (
      <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid gap-6">
      <section className="panel detail-panel">
        <dl className="detail-list">
          <div>
            <dt>Cliente</dt>
            <dd>{orden.nombreCliente}</dd>
          </div>
          <div>
            <dt>Activo</dt>
            <dd>
              <Link className="text-link" href={"/activos/" + orden.activoId}>{orden.nombreActivo}</Link>
            </dd>
          </div>
          <div>
            <dt>Tipo de mantenimiento</dt>
            <dd>{orden.tipo}</dd>
          </div>
          <div>
            <dt>Prioridad</dt>
            <dd>{orden.prioridad}</dd>
          </div>
          <div>
            <dt>Técnico responsable</dt>
            <dd>{nombreTecnico}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd><EtiquetaEstadoOrden estado={orden.estado} /></dd>
          </div>
          <div>
            <dt>Fecha de creación</dt>
            <dd>{fechaCreacion}</dd>
          </div>
          <div>
            <dt>Fecha prevista de ejecución</dt>
            <dd>{formatearFechaPrevista(orden.fechaPrevistaEjecucion)}</dd>
          </div>
          <div className="detail-wide">
            <dt>Descripción de la tarea</dt>
            <dd>{orden.descripcion}</dd>
          </div>
          <div className="detail-wide">
            <dt>Observaciones</dt>
            <dd>{textoObservaciones}</dd>
          </div>
          <div className="detail-wide">
            <dt>Repuestos</dt>
            <dd>{textoRepuestos}</dd>
          </div>
          <div className="detail-wide">
            <dt>Sugerencias</dt>
            <dd>{textoSugerencias}</dd>
          </div>
        </dl>
        <div className="form-actions">{enlaceModificar}</div>
      </section>

      <EvidenciasOrdenTrabajo ordenTrabajoId={orden.id} permiteRegistrar={!ordenEstaTerminada && puedeRegistrarAvance} />
      </div>

      <div className="grid gap-6">
        <section className="panel detail-panel">
          {mensajeAccionError}
          {mensajeAccionExito}
          <h2>Técnico responsable</h2>
          <p className="mb-4 mt-1 text-sm texto-tenue">{nombreTecnico}</p>
          {seccionTecnico}
        </section>

        <section className="panel detail-panel">
          <h2>Estado de la orden</h2>
          <p className="mb-4 mt-2">
            <EtiquetaEstadoOrden estado={orden.estado} />
          </p>
          {seccionEstado}
        </section>

        <section className="panel detail-panel">
          <h2>Historial de estados</h2>
          <ul className="mt-4 grid gap-3">
            {historialMasNuevoPrimero.map((cambio, indice) => (
              <li className="border-b u-borde pb-3 text-sm" key={indice}>
                <strong>
                  {cambio.estadoAnterior ? etiquetaEstado(cambio.estadoAnterior) + " → " : ""}
                  {etiquetaEstado(cambio.estado)}
                </strong>
                <span className="block text-xs texto-tenue">
                  {formatearFechaHora(cambio.fechaHora)}
                  {cambio.nombreUsuario ? " · " + cambio.nombreUsuario : ""}
                </span>
                <span className="block">{cambio.observacion}</span>
              </li>
            ))}
          </ul>
        </section>

        {orden.historialTecnicos.length > 0 ? (
          <section className="panel detail-panel">
            <h2>Historial de técnicos</h2>
            <ul className="mt-4 grid gap-3">
              {[...orden.historialTecnicos].reverse().map((cambio, indice) => (
                <li className="border-b u-borde pb-3 text-sm" key={indice}>
                  <strong>
                    {cambio.nombreTecnicoAnterior ? cambio.nombreTecnicoAnterior + " → " : "Asignado a "}
                    {cambio.nombreTecnico ?? "técnico sin identificar"}
                  </strong>
                  <span className="block text-xs texto-tenue">
                    {formatearFechaHora(cambio.fechaHora)}
                    {cambio.nombreUsuario ? " · " + cambio.nombreUsuario : ""}
                  </span>
                  {cambio.observacion ? <span className="block">{cambio.observacion}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
      </div>
    );
  }

  let titulo = "Orden de trabajo";
  if (orden !== null) {
    titulo = "Orden de trabajo N° " + orden.id;
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div className="encabezado-volver">
          <EnlaceVolver etiqueta="Volver al listado" href="/ordenes-trabajo" />
          <div>
            <p className="eyebrow">Órdenes de trabajo</p>
            <h1>{titulo}</h1>
          </div>
        </div>
      </header>

      {mensajeError}
      {contenidoOrden}
    </main>
  );
}
