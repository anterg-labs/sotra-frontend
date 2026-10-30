"use client";

import { BotonCancelarFormulario, useSalidaDeFormulario } from "@/componentes/modal-de-ruta";
import { useRef, useState } from "react";
import { CamposEstadoFechasOrdenTrabajo } from "@/componentes/campos-estado-fechas-orden-trabajo";
import { CamposDatosOrden } from "@/componentes/campos-datos-orden";
import { CamposGeneralesOrdenTrabajo } from "@/componentes/campos-generales-orden-trabajo";
import { SelectorClienteActivoOrdenTrabajo } from "@/componentes/selector-cliente-activo-orden-trabajo";
import { EditorRepuestosOrden, obtenerErrorDeLineas, type LineaRepuestoOrden } from "@/componentes/editor-repuestos-orden";
import { SugerenciasOrdenTrabajo } from "@/componentes/sugerencias-orden-trabajo";
import { useTienePermiso } from "@/componentes/sesion/contexto-sesion";
import {
  borrarSugerenciasTemporales,
  crearSesionDeSugerencias,
  leerSugerenciasTemporales,
  obtenerErroresOrdenTrabajo,
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
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

type PropiedadesFormularioOrdenTrabajo = {
  ordenInicial?: OrdenTrabajo;
  clientes: Cliente[];
  activos: Activo[];
  tecnicos: Usuario[];
  repuestos: Repuesto[];
  etiquetaConfirmacion: string;
  alEnviar: (orden: CrearOrdenTrabajoInput) => Promise<OrdenTrabajo>;
};

/** Número escrito con punto o coma decimal; `undefined` si el campo está vacío y `NaN` si no es un número. */
function numeroOpcional(texto: string) {
  return texto.trim() === "" ? undefined : Number(texto.trim().replace(",", "."));
}

/** Si el catálogo no trae el repuesto de una orden, se muestra con lo que se sabe y sin margen para subir la cantidad. */
function repuestoSinStockConocido(repuesto: OrdenTrabajo["repuestos"][number]): Repuesto {
  return {
    id: repuesto.id, codigo: repuesto.codigo, nombre: repuesto.nombre, descripcion: "", marca: "", ubicacion: "", categoria: "", modeloCompatibilidad: "", unidadMedida: "unidad", observaciones: "",
    cantidad: repuesto.cantidad, cantidadMinima: 0, cantidadReservada: 0, cantidadEntregada: 0, cantidadDisponible: 0,
    estado: "activo", estadoStock: "normal",
  };
}

export function FormularioOrdenTrabajo(props: PropiedadesFormularioOrdenTrabajo) {
  const ordenInicial = props.ordenInicial;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let clienteIdInicial = "";
  let activoIdInicial = "";
  let tecnicoIdInicial = "";
  let tipoInicial = "preventivo";
  let prioridadInicial = "media";
  // En el alta el servidor asigna el estado inicial del catálogo; solo hay estado que mostrar al modificar.
  let estadoInicial = "";
  let descripcionInicial = "";
  let observacionesInicial = "";
  let fechaPrevistaInicial = "";
  let sugerenciasIniciales: string[] = [];
  let claveSugerenciasTemporales = "";
  const lineasRepuestosIniciales: LineaRepuestoOrden[] = [];
  const cantidadesDeLaOrden: Record<number, number> = {};
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
      lineasRepuestosIniciales.push({
        repuesto: props.repuestos.find((repuesto) => repuesto.id === repuestoDeLaOrden.id) ?? repuestoSinStockConocido(repuestoDeLaOrden),
        cantidad: repuestoDeLaOrden.cantidad,
      });
      // Lo reservado o entregado a esta orden cuenta como disponible para ella; lo ya descontado no.
      if (repuestoDeLaOrden.estado !== "descontado") cantidadesDeLaOrden[repuestoDeLaOrden.id] = repuestoDeLaOrden.cantidad;
    }

    estadosDisponibles.push(ordenInicial.estado);
    for (const transicion of ordenInicial.transiciones) {
      estadosDisponibles.push(transicion.estado);
    }
  }

  if (claveSugerenciasTemporales !== "") {
    const sugerenciasTemporales = leerSugerenciasTemporales(claveSugerenciasTemporales);
    if (sugerenciasTemporales !== null) {
      sugerenciasIniciales = sugerenciasTemporales;
    }
  }

  const { terminar } = useSalidaDeFormulario();
  const [estado, setEstado] = useState(estadoInicial);
  const estadoExigeMotivo = ordenInicial?.transiciones.some((transicion) => transicion.estado === estado && transicion.exigeMotivo) ?? false;
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [activoId, setActivoId] = useState(activoIdInicial);
  const [tecnicoId, setTecnicoId] = useState(tecnicoIdInicial);
  const [tipo, setTipo] = useState(tipoInicial);
  const [prioridad, setPrioridad] = useState(prioridadInicial);
  const [motivoEstado, setMotivoEstado] = useState("");
  const [sesionSugerencias] = useState(crearSesionDeSugerencias);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [observaciones, setObservaciones] = useState(observacionesInicial);
  const [fechaPrevistaEjecucion, setFechaPrevistaEjecucion] = useState(fechaPrevistaInicial);
  const [tiempoEstimado, setTiempoEstimado] = useState(ordenInicial?.tiempoEstimadoHoras ? String(ordenInicial.tiempoEstimadoHoras) : "");
  const [causaFallaId, setCausaFallaId] = useState(ordenInicial?.causaFallaId ? String(ordenInicial.causaFallaId) : "");
  const [lecturaUso, setLecturaUso] = useState(ordenInicial?.lecturaUso !== null && ordenInicial?.lecturaUso !== undefined ? String(ordenInicial.lecturaUso) : "");
  const [motivoCodigo, setMotivoCodigo] = useState("");
  const unidadUso = props.activos.find((activo) => String(activo.id) === activoId)?.unidadUso ?? ordenInicial?.unidadUso ?? "horas";
  const [sugerencias, setSugerencias] = useState(sugerenciasIniciales);
  const puedeGestionarRepuestos = useTienePermiso("ot.gestionar_repuestos");
  const [lineasRepuestos, setLineasRepuestos] = useState(lineasRepuestosIniciales);
  const [errorRepuestos, setErrorRepuestos] = useState("");
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errores, setErrores] = useState<ReturnType<typeof obtenerErroresOrdenTrabajo> & { motivoEstado?: string }>({});
  const referenciaErrorGeneral = useRef<HTMLDivElement>(null);

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
      repuestos: lineasRepuestos.map((linea) => ({ repuestoId: linea.repuesto.id, cantidad: linea.cantidad })),
      estado: estado,
      motivoEstado: motivoEstado,
      sesion: sesionSugerencias,
      ...(numeroOpcional(tiempoEstimado) === undefined ? {} : { tiempoEstimadoHoras: numeroOpcional(tiempoEstimado) }),
      ...(tipo === "correctivo" && causaFallaId !== "" ? { causaFallaId: Number(causaFallaId) } : {}),
      ...(numeroOpcional(lecturaUso) === undefined ? {} : { lecturaUso: numeroOpcional(lecturaUso) }),
      ...(estadoExigeMotivo && motivoCodigo !== "" ? { motivoCodigo } : {}),
    };

    const erroresDetectados: typeof errores = obtenerErroresOrdenTrabajo(ordenParaGuardar);
    if (estadoExigeMotivo && !motivoEstado.trim()) {
      erroresDetectados.motivoEstado = "Indicá el motivo del cambio de estado.";
    }
    setErrores(erroresDetectados);
    const errorDeRepuestos = puedeGestionarRepuestos ? obtenerErrorDeLineas(lineasRepuestos, cantidadesDeLaOrden) : "";
    setErrorRepuestos(errorDeRepuestos);
    const primerCampo = Object.keys(erroresDetectados)[0];
    if (primerCampo) {
      document.getElementById(primerCampo)?.focus();
      return;
    }
    if (errorDeRepuestos) {
      document.getElementById("repuestos-orden")?.focus();
      return;
    }
    setEstaEnviando(true);

    try {
      await alEnviar(ordenParaGuardar);
      borrarSugerenciasTemporales(claveSugerenciasTemporales);
      terminar("/ordenes-trabajo");
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
    mensajeError = <AvisoEnLinea ref={referenciaErrorGeneral}>{errorGeneral}</AvisoEnLinea>;
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
          clienteId={clienteId}
          clientes={props.clientes}
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
          necesitaMotivo={estadoExigeMotivo}
          permiteCambiarEstado={permiteCambiarEstado}
        />

        <CamposDatosOrden
          alCambiarCausaFalla={setCausaFallaId}
          alCambiarLecturaUso={setLecturaUso}
          alCambiarMotivo={setMotivoCodigo}
          alCambiarTiempoEstimado={setTiempoEstimado}
          causaFallaId={causaFallaId}
          errorLecturaUso={errores.lecturaUso}
          errorTiempoEstimado={errores.tiempoEstimadoHoras}
          lecturaUso={lecturaUso}
          motivoCodigo={motivoCodigo}
          mostrarMotivo={estadoExigeMotivo}
          tiempoEstimado={tiempoEstimado}
          tipo={tipo}
          unidadUso={unidadUso}
        />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción de la tarea</label>
        <textarea aria-describedby={errores.descripcion ? "descripcion-error" : undefined} aria-invalid={errores.descripcion ? true : undefined} id="descripcion" onChange={cambiarDescripcion} required rows={4} value={descripcion} />
        {errores.descripcion ? <p className="field-error" id="descripcion-error" role="alert">{errores.descripcion}</p> : null}
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales</label>
        <textarea aria-describedby={errores.observaciones ? "observaciones-error" : undefined} aria-invalid={errores.observaciones ? true : undefined} id="observaciones" onChange={cambiarObservaciones} rows={3} value={observaciones} />
        {errores.observaciones ? <p className="field-error" id="observaciones-error" role="alert">{errores.observaciones}</p> : null}
      </div>

      {puedeGestionarRepuestos ? (
        <EditorRepuestosOrden
          alCambiar={(lineas) => {
            setLineasRepuestos(lineas);
            setErrorRepuestos("");
          }}
          cantidadesDeLaOrden={cantidadesDeLaOrden}
          lineas={lineasRepuestos}
          mensajeError={errorRepuestos}
        />
      ) : ordenInicial && ordenInicial.repuestos.length > 0 ? (
        <div className="form-field form-field-full">
          <span>Repuestos</span>
          <ul>
            {ordenInicial.repuestos.map((repuesto) => (
              <li key={repuesto.id}>{`${repuesto.codigo} - ${repuesto.nombre} (${repuesto.cantidad})`}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <SugerenciasOrdenTrabajo
        activoId={activoId}
        alCambiarSugerencias={setSugerencias}
        claveSugerenciasTemporales={claveSugerenciasTemporales}
        descripcion={descripcion}
        sesion={sesionSugerencias}
        sugerencias={sugerencias}
      />

      {mensajeError}

      <div className="form-actions">
        <BotonCancelarFormulario href="/ordenes-trabajo" alHacerClic={descartarSugerenciasTemporales} />
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
    </>
  );
}
