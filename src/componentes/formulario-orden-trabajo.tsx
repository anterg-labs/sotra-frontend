"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  borrarSugerenciasTemporales,
  guardarSugerenciasTemporales,
  leerSugerenciasTemporales,
  obtenerEtiquetaEstadoOrdenTrabajo,
  solicitarSugerenciaOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { estadosOrdenTrabajo } from "@/tipos/orden-trabajo";
import type {
  CrearOrdenTrabajoInput,
  EstadoOrdenTrabajo,
  OrdenTrabajo,
  PrioridadOrdenTrabajo,
  SolicitarSugerenciaInput,
  TipoOrdenTrabajo,
} from "@/tipos/orden-trabajo";
import type { Repuesto } from "@/tipos/repuesto";
import type { Usuario } from "@/tipos/usuario";

type PropiedadesFormularioOrdenTrabajo = {
  ordenInicial?: OrdenTrabajo;
  clientes: Cliente[];
  activos: Activo[];
  tecnicos: Usuario[];
  repuestos: Repuesto[];
  etiquetaConfirmacion: string;
  alEnviar: (orden: CrearOrdenTrabajoInput) => Promise<OrdenTrabajo>;
};

export function FormularioOrdenTrabajo(props: PropiedadesFormularioOrdenTrabajo) {
  const ordenInicial = props.ordenInicial;
  const clientes = props.clientes;
  const activos = props.activos;
  const tecnicos = props.tecnicos;
  const repuestos = props.repuestos;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let clienteIdInicial = "";
  let activoIdInicial = "";
  let tecnicoIdInicial = "";
  let tipoInicial = "preventivo";
  let prioridadInicial = "media";
  let estadoInicial = "creada";
  let descripcionInicial = "";
  let observacionesInicial = "";
  let fechaPrevistaInicial = "";
  let sugerenciasIniciales: string[] = [];
  let claveSugerenciasTemporales = "sugerencias-orden-nueva";
  const idsRepuestosIniciales: number[] = [];
  if (ordenInicial) {
    clienteIdInicial = String(ordenInicial.clienteId);
    activoIdInicial = String(ordenInicial.activoId);
    if (ordenInicial.tecnicoId !== null) {
      tecnicoIdInicial = String(ordenInicial.tecnicoId);
    }
    tipoInicial = ordenInicial.tipo;
    prioridadInicial = ordenInicial.prioridad;
    estadoInicial = ordenInicial.estado;
    descripcionInicial = ordenInicial.descripcion;
    observacionesInicial = ordenInicial.observaciones;
    fechaPrevistaInicial = ordenInicial.fechaPrevistaEjecucion;
    claveSugerenciasTemporales = "sugerencias-orden-" + ordenInicial.id;
    for (const textoSugerencia of ordenInicial.sugerencias) {
      sugerenciasIniciales.push(textoSugerencia);
    }
    for (const repuestoDeLaOrden of ordenInicial.repuestos) {
      idsRepuestosIniciales.push(repuestoDeLaOrden.id);
    }
  }

  const sugerenciasTemporales = leerSugerenciasTemporales(claveSugerenciasTemporales);
  if (sugerenciasTemporales !== null) {
    sugerenciasIniciales = sugerenciasTemporales;
  }

  const enrutador = useRouter();
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [activoId, setActivoId] = useState(activoIdInicial);
  const [tecnicoId, setTecnicoId] = useState(tecnicoIdInicial);
  const [tipo, setTipo] = useState(tipoInicial);
  const [prioridad, setPrioridad] = useState(prioridadInicial);
  const [estado, setEstado] = useState(estadoInicial);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [observaciones, setObservaciones] = useState(observacionesInicial);
  const [fechaPrevistaEjecucion, setFechaPrevistaEjecucion] = useState(fechaPrevistaInicial);
  const [sugerencias, setSugerencias] = useState(sugerenciasIniciales);
  const [idsRepuestos, setIdsRepuestos] = useState(idsRepuestosIniciales);
  const [repuestoParaAgregarId, setRepuestoParaAgregarId] = useState("");
  const [cantidadSolicitudes, setCantidadSolicitudes] = useState(sugerenciasIniciales.length);
  const [estaSolicitandoSugerencia, setEstaSolicitandoSugerencia] = useState(false);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  function cambiarCliente(evento: React.ChangeEvent<HTMLSelectElement>) {
    setClienteId(evento.target.value);
    setActivoId("");
  }

  function cambiarActivo(evento: React.ChangeEvent<HTMLSelectElement>) {
    setActivoId(evento.target.value);
  }

  function cambiarTecnico(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTecnicoId(evento.target.value);
  }

  function cambiarTipo(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTipo(evento.target.value);
  }

  function cambiarPrioridad(evento: React.ChangeEvent<HTMLSelectElement>) {
    setPrioridad(evento.target.value);
  }

  function cambiarEstado(evento: React.ChangeEvent<HTMLSelectElement>) {
    setEstado(evento.target.value);
  }

  function cambiarDescripcion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setDescripcion(evento.target.value);
  }

  function cambiarObservaciones(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setObservaciones(evento.target.value);
  }

  function cambiarFechaPrevista(evento: React.ChangeEvent<HTMLInputElement>) {
    setFechaPrevistaEjecucion(evento.target.value);
  }

  function actualizarSugerencias(nuevasSugerencias: string[]) {
    setSugerencias(nuevasSugerencias);
    guardarSugerenciasTemporales(claveSugerenciasTemporales, nuevasSugerencias);
  }

  function descartarSugerenciasTemporales() {
    borrarSugerenciasTemporales(claveSugerenciasTemporales);
  }

  function cambiarRepuestoParaAgregar(evento: React.ChangeEvent<HTMLSelectElement>) {
    setRepuestoParaAgregarId(evento.target.value);
  }

  function agregarRepuesto() {
    if (repuestoParaAgregarId === "") {
      return;
    }

    const nuevosIdsRepuestos: number[] = [];
    for (const idRepuesto of idsRepuestos) {
      nuevosIdsRepuestos.push(idRepuesto);
    }
    nuevosIdsRepuestos.push(Number(repuestoParaAgregarId));

    setIdsRepuestos(nuevosIdsRepuestos);
    setRepuestoParaAgregarId("");
  }

  function quitarRepuesto(repuestoId: number) {
    const nuevosIdsRepuestos: number[] = [];
    for (const idRepuesto of idsRepuestos) {
      if (idRepuesto !== repuestoId) {
        nuevosIdsRepuestos.push(idRepuesto);
      }
    }

    setIdsRepuestos(nuevosIdsRepuestos);
  }

  async function obtenerTextoSugerencia() {
    const datosSugerencia: SolicitarSugerenciaInput = {
      descripcion,
      numero: cantidadSolicitudes + 1,
    };

    const textoObtenido = await solicitarSugerenciaOrdenTrabajo(datosSugerencia);
    setCantidadSolicitudes(cantidadSolicitudes + 1);
    return textoObtenido;
  }

  function mostrarErrorSugerencia(error: unknown) {
    if (error instanceof Error) {
      setErrorGeneral(error.message);
    } else {
      setErrorGeneral("No se pudo obtener la sugerencia.");
    }
  }

  async function pedirSugerencia() {
    setEstaSolicitandoSugerencia(true);
    setErrorGeneral("");

    try {
      const textoObtenido = await obtenerTextoSugerencia();
      const nuevasSugerencias: string[] = [];
      for (const textoSugerencia of sugerencias) {
        nuevasSugerencias.push(textoSugerencia);
      }
      nuevasSugerencias.push(textoObtenido);
      actualizarSugerencias(nuevasSugerencias);
    } catch (error) {
      mostrarErrorSugerencia(error);
    } finally {
      setEstaSolicitandoSugerencia(false);
    }
  }

  async function volverAPedirSugerencia(indiceSugerencia: number) {
    setEstaSolicitandoSugerencia(true);
    setErrorGeneral("");

    try {
      const textoObtenido = await obtenerTextoSugerencia();
      const nuevasSugerencias: string[] = [];
      for (let indice = 0; indice < sugerencias.length; indice++) {
        if (indice === indiceSugerencia) {
          nuevasSugerencias.push(textoObtenido);
        } else {
          nuevasSugerencias.push(sugerencias[indice]);
        }
      }
      actualizarSugerencias(nuevasSugerencias);
    } catch (error) {
      mostrarErrorSugerencia(error);
    } finally {
      setEstaSolicitandoSugerencia(false);
    }
  }

  function cambiarTextoSugerencia(indiceSugerencia: number, textoNuevo: string) {
    const nuevasSugerencias: string[] = [];
    for (let indice = 0; indice < sugerencias.length; indice++) {
      if (indice === indiceSugerencia) {
        nuevasSugerencias.push(textoNuevo);
      } else {
        nuevasSugerencias.push(sugerencias[indice]);
      }
    }

    actualizarSugerencias(nuevasSugerencias);
  }

  function quitarSugerencia(indiceSugerencia: number) {
    const nuevasSugerencias: string[] = [];
    for (let indice = 0; indice < sugerencias.length; indice++) {
      if (indice !== indiceSugerencia) {
        nuevasSugerencias.push(sugerencias[indice]);
      }
    }

    actualizarSugerencias(nuevasSugerencias);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviando(true);
    setErrorGeneral("");

    let tecnicoIdParaGuardar: number | null = null;
    if (tecnicoId !== "") {
      tecnicoIdParaGuardar = Number(tecnicoId);
    }

    const ordenParaGuardar: CrearOrdenTrabajoInput = {
      clienteId: Number(clienteId),
      activoId: Number(activoId),
      tecnicoId: tecnicoIdParaGuardar,
      tipo: tipo as TipoOrdenTrabajo,
      prioridad: prioridad as PrioridadOrdenTrabajo,
      descripcion,
      observaciones,
      fechaPrevistaEjecucion,
      sugerencias,
      repuestosIds: idsRepuestos,
      estado: estado as EstadoOrdenTrabajo,
    };

    try {
      await alEnviar(ordenParaGuardar);
      borrarSugerenciasTemporales(claveSugerenciasTemporales);
      enrutador.push("/ordenes-trabajo");
    } catch (error) {
      if (error instanceof Error) {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral("No se pudo guardar la orden de trabajo.");
      }
    } finally {
      setEstaEnviando(false);
    }
  }

  const activosDelCliente: Activo[] = [];
  for (const activo of activos) {
    const perteneceAlCliente = String(activo.clienteId) === clienteId;
    const estaDisponible = activo.estado === "activo" || String(activo.id) === activoIdInicial;
    if (perteneceAlCliente && estaDisponible) {
      activosDelCliente.push(activo);
    }
  }

  const repuestosSeleccionados: Repuesto[] = [];
  const repuestosDisponibles: Repuesto[] = [];
  for (const repuesto of repuestos) {
    let estaSeleccionado = false;
    for (const idRepuesto of idsRepuestos) {
      if (idRepuesto === repuesto.id) {
        estaSeleccionado = true;
      }
    }

    if (estaSeleccionado) {
      repuestosSeleccionados.push(repuesto);
    } else if (repuesto.estado === "activo") {
      repuestosDisponibles.push(repuesto);
    }
  }

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner">{errorGeneral}</p>;
  }

  let textoBotonSugerencia = "Solicitar sugerencia";
  if (estaSolicitandoSugerencia) {
    textoBotonSugerencia = "Solicitando…";
  }

  let textoBoton = etiquetaConfirmacion;
  if (estaEnviando) {
    textoBoton = "Guardando…";
  }

  let campoEstado = null;
  if (ordenInicial) {
    campoEstado = (
      <div className="form-field">
        <label htmlFor="estado">Estado</label>
        <select id="estado" onChange={cambiarEstado} value={estado}>
          {estadosOrdenTrabajo.map((estadoDisponible) => (
            <option key={estadoDisponible} value={estadoDisponible}>
              {obtenerEtiquetaEstadoOrdenTrabajo(estadoDisponible)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  let mensajeBuscandoSugerencia = null;
  if (estaSolicitandoSugerencia) {
    mensajeBuscandoSugerencia = (
      <p className="empty-state">
        El sistema está buscando la sugerencia en la documentación técnica. Puede tardar unos segundos…
      </p>
    );
  }

  let botonAgregarDeshabilitado = false;
  if (repuestoParaAgregarId === "") {
    botonAgregarDeshabilitado = true;
  }

  return (
    <form onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="clienteId">Cliente</label>
          <select id="clienteId" onChange={cambiarCliente} required value={clienteId}>
            <option disabled value="">Seleccioná un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="activoId">Activo</label>
          <select id="activoId" onChange={cambiarActivo} required value={activoId}>
            <option disabled value="">Seleccioná un activo</option>
            {activosDelCliente.map((activo) => (
              <option key={activo.id} value={activo.id}>{activo.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="tipo">Tipo de mantenimiento</label>
          <select id="tipo" onChange={cambiarTipo} value={tipo}>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="prioridad">Prioridad</label>
          <select id="prioridad" onChange={cambiarPrioridad} value={prioridad}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="tecnicoId">Técnico responsable (opcional)</label>
          <select id="tecnicoId" onChange={cambiarTecnico} value={tecnicoId}>
            <option value="">Sin técnico asignado</option>
            {tecnicos.map((tecnico) => (
              <option key={tecnico.id} value={tecnico.id}>{tecnico.nombre + " " + tecnico.apellido}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="fechaPrevistaEjecucion">Fecha prevista de ejecución</label>
          <input
            id="fechaPrevistaEjecucion"
            onChange={cambiarFechaPrevista}
            required
            type="date"
            value={fechaPrevistaEjecucion}
          />
        </div>

        {campoEstado}
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción de la tarea</label>
        <textarea id="descripcion" onChange={cambiarDescripcion} required rows={4} value={descripcion} />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales</label>
        <textarea id="observaciones" onChange={cambiarObservaciones} rows={3} value={observaciones} />
      </div>

      <div className="form-field form-field-full">
        <label>Repuestos</label>
        <ul className="flex flex-col gap-2 text-sm">
          {repuestosSeleccionados.map((repuesto) => (
            <li className="flex items-center gap-4" key={repuesto.id}>
              <span>{repuesto.codigo + " - " + repuesto.nombre}</span>
              <button
                className="table-action-link table-action-link-danger"
                onClick={() => quitarRepuesto(repuesto.id)}
                type="button"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
        <select aria-label="Repuesto para agregar" onChange={cambiarRepuestoParaAgregar} value={repuestoParaAgregarId}>
          <option value="">Seleccioná un repuesto</option>
          {repuestosDisponibles.map((repuesto) => (
            <option key={repuesto.id} value={repuesto.id}>{repuesto.codigo + " - " + repuesto.nombre}</option>
          ))}
        </select>
        <div>
          <button
            className="secondary-button"
            disabled={botonAgregarDeshabilitado}
            onClick={agregarRepuesto}
            type="button"
          >
            Agregar repuesto
          </button>
        </div>
      </div>

      <div className="form-field form-field-full">
        <label>Sugerencias</label>
        <div>
          <button
            className="secondary-button"
            disabled={estaSolicitandoSugerencia}
            onClick={pedirSugerencia}
            type="button"
          >
            {textoBotonSugerencia}
          </button>
        </div>
        {mensajeBuscandoSugerencia}
      </div>

      {sugerencias.map((textoSugerencia, indice) => (
        <div className="form-field form-field-full" key={indice}>
          <label htmlFor={"sugerencia-" + indice}>{"Sugerencia " + (indice + 1)}</label>
          <textarea
            id={"sugerencia-" + indice}
            onChange={(evento) => cambiarTextoSugerencia(indice, evento.target.value)}
            rows={9}
            value={textoSugerencia}
          />
          <div className="flex gap-4">
            <button
              className="table-action-link"
              disabled={estaSolicitandoSugerencia}
              onClick={() => volverAPedirSugerencia(indice)}
              type="button"
            >
              Volver a solicitar
            </button>
            <button
              className="table-action-link table-action-link-danger"
              onClick={() => quitarSugerencia(indice)}
              type="button"
            >
              Quitar sugerencia
            </button>
          </div>
        </div>
      ))}

      <div className="form-actions">
        <Link className="secondary-button" href="/ordenes-trabajo" onClick={descartarSugerenciasTemporales}>
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
