"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CamposEstadoFechasOrdenTrabajo } from "@/componentes/campos-estado-fechas-orden-trabajo";
import { CamposGeneralesOrdenTrabajo } from "@/componentes/campos-generales-orden-trabajo";
import { SelectorClienteActivoOrdenTrabajo } from "@/componentes/selector-cliente-activo-orden-trabajo";
import { SelectorRepuestosOrdenTrabajo } from "@/componentes/selector-repuestos-orden-trabajo";
import { SugerenciasOrdenTrabajo } from "@/componentes/sugerencias-orden-trabajo";
import {
  borrarSugerenciasTemporales,
  crearSesionDeSugerencias,
  estadoNecesitaMotivo,
  leerSugerenciasTemporales,
} from "@/servicios/servicio-ordenes-trabajo";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type {
  CrearOrdenTrabajoInput,
  EstadoOrdenTrabajo,
  OrdenTrabajo,
  PrioridadOrdenTrabajo,
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
  let claveSugerenciasTemporales = "";
  const idsRepuestosIniciales: number[] = [];
  const estadosDisponibles: EstadoOrdenTrabajo[] = [];

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

    estadosDisponibles.push(ordenInicial.estado);
    for (const estadoSiguiente of ordenInicial.estadosSiguientes) {
      estadosDisponibles.push(estadoSiguiente);
    }
  }

  if (claveSugerenciasTemporales !== "") {
    const sugerenciasTemporales = leerSugerenciasTemporales(claveSugerenciasTemporales);
    if (sugerenciasTemporales !== null) {
      sugerenciasIniciales = sugerenciasTemporales;
    }
  }

  const enrutador = useRouter();
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [activoId, setActivoId] = useState(activoIdInicial);
  const [tecnicoId, setTecnicoId] = useState(tecnicoIdInicial);
  const [tipo, setTipo] = useState(tipoInicial);
  const [prioridad, setPrioridad] = useState(prioridadInicial);
  const [estado, setEstado] = useState(estadoInicial);
  const [motivoEstado, setMotivoEstado] = useState("");
  const [sesionSugerencias] = useState(crearSesionDeSugerencias);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [observaciones, setObservaciones] = useState(observacionesInicial);
  const [fechaPrevistaEjecucion, setFechaPrevistaEjecucion] = useState(fechaPrevistaInicial);
  const [sugerencias, setSugerencias] = useState(sugerenciasIniciales);
  const [idsRepuestos, setIdsRepuestos] = useState(idsRepuestosIniciales);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  function cambiarCliente(clienteIdNuevo: string) {
    setClienteId(clienteIdNuevo);
    setActivoId("");
  }

  function cambiarDescripcion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setDescripcion(evento.target.value);
  }

  function cambiarObservaciones(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setObservaciones(evento.target.value);
  }

  function descartarSugerenciasTemporales() {
    borrarSugerenciasTemporales(claveSugerenciasTemporales);
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
      motivoEstado: motivoEstado,
      sesion: sesionSugerencias,
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

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner">{errorGeneral}</p>;
  }

  let textoBoton = etiquetaConfirmacion;
  if (estaEnviando) {
    textoBoton = "Guardando…";
  }

  let permiteCambiarEstado = false;
  if (ordenInicial) {
    permiteCambiarEstado = true;
  }

  return (
    <form onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <SelectorClienteActivoOrdenTrabajo
          activoId={activoId}
          activoIdInicial={activoIdInicial}
          activos={props.activos}
          alCambiarActivo={setActivoId}
          alCambiarCliente={cambiarCliente}
          clienteId={clienteId}
          clientes={props.clientes}
        />

        <CamposGeneralesOrdenTrabajo
          alCambiarPrioridad={setPrioridad}
          alCambiarTecnico={setTecnicoId}
          alCambiarTipo={setTipo}
          prioridad={prioridad}
          tecnicoId={tecnicoId}
          tecnicos={props.tecnicos}
          tipo={tipo}
        />

        <CamposEstadoFechasOrdenTrabajo
          alCambiarEstado={setEstado}
          alCambiarFechaPrevista={setFechaPrevistaEjecucion}
          alCambiarMotivo={setMotivoEstado}
          estado={estado}
          estadosDisponibles={estadosDisponibles}
          fechaPrevistaEjecucion={fechaPrevistaEjecucion}
          motivoEstado={motivoEstado}
          necesitaMotivo={estadoNecesitaMotivo(estadoInicial, estado)}
          permiteCambiarEstado={permiteCambiarEstado}
        />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción de la tarea</label>
        <textarea id="descripcion" onChange={cambiarDescripcion} required rows={4} value={descripcion} />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales</label>
        <textarea id="observaciones" onChange={cambiarObservaciones} rows={3} value={observaciones} />
      </div>

      <SelectorRepuestosOrdenTrabajo
        alCambiarIdsRepuestos={setIdsRepuestos}
        idsRepuestos={idsRepuestos}
        repuestos={props.repuestos}
      />

      <SugerenciasOrdenTrabajo
        alCambiarErrorGeneral={setErrorGeneral}
        alCambiarSugerencias={setSugerencias}
        claveSugerenciasTemporales={claveSugerenciasTemporales}
        descripcion={descripcion}
        sesion={sesionSugerencias}
        sugerencias={sugerencias}
      />

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
