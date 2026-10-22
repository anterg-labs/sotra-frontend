"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { FormularioCliente } from "@/componentes/formulario-cliente";
import { Modal } from "@/componentes/modal";
import { CamposEstadoFechasOrdenTrabajo } from "@/componentes/campos-estado-fechas-orden-trabajo";
import { CamposGeneralesOrdenTrabajo } from "@/componentes/campos-generales-orden-trabajo";
import { SelectorClienteActivoOrdenTrabajo } from "@/componentes/selector-cliente-activo-orden-trabajo";
import { SelectorRepuestosOrdenTrabajo } from "@/componentes/selector-repuestos-orden-trabajo";
import { SugerenciasOrdenTrabajo } from "@/componentes/sugerencias-orden-trabajo";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import {
  borrarSugerenciasTemporales,
  crearSesionDeSugerencias,
  estadoNecesitaMotivo,
  leerSugerenciasTemporales,
  obtenerErroresOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import { crearClienteAccion } from "@/app/clientes/acciones";
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
  // El jefe crea y edita órdenes pero no ve repuestos (la API le responde 403): conserva los que ya tenía la orden.
  const puedeVerRepuestos = useTienePermiso("stock.consultar");
  const [idsRepuestos, setIdsRepuestos] = useState(idsRepuestosIniciales);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errores, setErrores] = useState<ReturnType<typeof obtenerErroresOrdenTrabajo> & { motivoEstado?: string }>({});
  const referenciaErrorGeneral = useRef<HTMLParagraphElement>(null);
  const [estaAltaClienteAbierta, setEstaAltaClienteAbierta] = useState(false);
  const [clientesAgregados, setClientesAgregados] = useState<Cliente[]>([]);
  const { mostrarAviso } = useAvisos();

  function guardarClienteNuevo(cliente: Cliente) {
    setClientesAgregados((actuales) => [...actuales, cliente]);
    setClienteId(String(cliente.id));
    setActivoId("");
    setEstaAltaClienteAbierta(false);
    mostrarAviso("exito", "Cliente registrado y seleccionado.");
  }

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

    const erroresDetectados: typeof errores = obtenerErroresOrdenTrabajo(ordenParaGuardar);
    if (estadoNecesitaMotivo(estadoInicial, estado) && !motivoEstado.trim()) {
      erroresDetectados.motivoEstado = "Indicá el motivo del cambio de estado.";
    }
    setErrores(erroresDetectados);
    const primerCampo = Object.keys(erroresDetectados)[0];
    if (primerCampo) {
      document.getElementById(primerCampo)?.focus();
      return;
    }
    setEstaEnviando(true);

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
      window.requestAnimationFrame(() => referenciaErrorGeneral.current?.focus());
    } finally {
      setEstaEnviando(false);
    }
  }

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner" ref={referenciaErrorGeneral} role="alert" tabIndex={-1}>{errorGeneral}</p>;
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
    <>
    <form noValidate onSubmit={enviarFormulario}>

      <div className="form-grid">
        <SelectorClienteActivoOrdenTrabajo
          activoId={activoId}
          activoIdInicial={activoIdInicial}
          activos={props.activos}
          alCambiarActivo={setActivoId}
          alCambiarCliente={cambiarCliente}
          alRegistrarCliente={() => setEstaAltaClienteAbierta(true)}
          clienteId={clienteId}
          clientes={[...props.clientes, ...clientesAgregados]}
          errores={{ clienteId: errores.clienteId, activoId: errores.activoId }}
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
          errorFechaPrevista={errores.fechaPrevistaEjecucion}
          errorMotivo={errores.motivoEstado}
          necesitaMotivo={estadoNecesitaMotivo(estadoInicial, estado)}
          permiteCambiarEstado={permiteCambiarEstado}
        />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción de la tarea</label>
        <textarea aria-describedby={errores.descripcion ? "descripcion-error" : undefined} aria-invalid={errores.descripcion ? true : undefined} id="descripcion" onChange={cambiarDescripcion} required rows={4} value={descripcion} />
        {errores.descripcion ? <p className="field-error" id="descripcion-error" role="alert">{errores.descripcion}</p> : null}
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales</label>
        <textarea id="observaciones" onChange={cambiarObservaciones} rows={3} value={observaciones} />
      </div>

      {puedeVerRepuestos ? (
        <SelectorRepuestosOrdenTrabajo
          alCambiarIdsRepuestos={setIdsRepuestos}
          idsRepuestos={idsRepuestos}
          repuestos={props.repuestos}
        />
      ) : ordenInicial && ordenInicial.repuestos.length > 0 ? (
        <div className="form-field form-field-full">
          <span>Repuestos</span>
          <ul>
            {ordenInicial.repuestos.map((repuesto) => (
              <li key={repuesto.id}>{repuesto.codigo + " - " + repuesto.nombre}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <SugerenciasOrdenTrabajo
        alCambiarSugerencias={setSugerencias}
        claveSugerenciasTemporales={claveSugerenciasTemporales}
        descripcion={descripcion}
        sesion={sesionSugerencias}
        sugerencias={sugerencias}
      />

      {mensajeError}

      <div className="form-actions">
        <Link className="secondary-button" href="/ordenes-trabajo" onClick={descartarSugerenciasTemporales}>
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
    <Modal alCerrar={() => setEstaAltaClienteAbierta(false)} estaAbierto={estaAltaClienteAbierta} titulo="Registrar nuevo cliente">
      <div className="form-panel">
        <FormularioCliente alCancelar={() => setEstaAltaClienteAbierta(false)} accion={crearClienteAccion} alGuardar={guardarClienteNuevo} etiquetaConfirmacion="Registrar cliente" />
      </div>
    </Modal>
    </>
  );
}
