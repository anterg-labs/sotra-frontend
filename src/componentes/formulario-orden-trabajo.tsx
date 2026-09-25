"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type {
  CrearOrdenTrabajoInput,
  OrdenTrabajo,
  PrioridadOrdenTrabajo,
  TipoOrdenTrabajo,
} from "@/tipos/orden-trabajo";
import type { Usuario } from "@/tipos/usuario";

type PropiedadesFormularioOrdenTrabajo = {
  ordenInicial?: OrdenTrabajo;
  clientes: Cliente[];
  activos: Activo[];
  tecnicos: Usuario[];
  etiquetaConfirmacion: string;
  alEnviar: (orden: CrearOrdenTrabajoInput) => Promise<OrdenTrabajo>;
};

export function FormularioOrdenTrabajo(props: PropiedadesFormularioOrdenTrabajo) {
  const ordenInicial = props.ordenInicial;
  const clientes = props.clientes;
  const activos = props.activos;
  const tecnicos = props.tecnicos;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let clienteIdInicial = "";
  let activoIdInicial = "";
  let tecnicoIdInicial = "";
  let tipoInicial = "preventivo";
  let prioridadInicial = "media";
  let descripcionInicial = "";
  let observacionesInicial = "";
  let fechaPrevistaInicial = "";
  if (ordenInicial) {
    clienteIdInicial = String(ordenInicial.clienteId);
    activoIdInicial = String(ordenInicial.activoId);
    if (ordenInicial.tecnicoId !== null) {
      tecnicoIdInicial = String(ordenInicial.tecnicoId);
    }
    tipoInicial = ordenInicial.tipo;
    prioridadInicial = ordenInicial.prioridad;
    descripcionInicial = ordenInicial.descripcion;
    observacionesInicial = ordenInicial.observaciones;
    fechaPrevistaInicial = ordenInicial.fechaPrevistaEjecucion;
  }

  const enrutador = useRouter();
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [activoId, setActivoId] = useState(activoIdInicial);
  const [tecnicoId, setTecnicoId] = useState(tecnicoIdInicial);
  const [tipo, setTipo] = useState(tipoInicial);
  const [prioridad, setPrioridad] = useState(prioridadInicial);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [observaciones, setObservaciones] = useState(observacionesInicial);
  const [fechaPrevistaEjecucion, setFechaPrevistaEjecucion] = useState(fechaPrevistaInicial);
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

  function cambiarDescripcion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setDescripcion(evento.target.value);
  }

  function cambiarObservaciones(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setObservaciones(evento.target.value);
  }

  function cambiarFechaPrevista(evento: React.ChangeEvent<HTMLInputElement>) {
    setFechaPrevistaEjecucion(evento.target.value);
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
    };

    try {
      await alEnviar(ordenParaGuardar);
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

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner">{errorGeneral}</p>;
  }

  let textoBoton = etiquetaConfirmacion;
  if (estaEnviando) {
    textoBoton = "Guardando…";
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
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción de la tarea</label>
        <textarea id="descripcion" onChange={cambiarDescripcion} required rows={4} value={descripcion} />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales</label>
        <textarea id="observaciones" onChange={cambiarObservaciones} rows={3} value={observaciones} />
      </div>

      <div className="form-actions">
        <Link className="secondary-button" href="/ordenes-trabajo">
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
