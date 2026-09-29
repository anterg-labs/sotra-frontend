"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Activo, CrearActivoInput } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";

type PropiedadesFormularioActivo = {
  activoInicial?: Activo;
  clientes: Cliente[];
  modelosMaquina: ModeloMaquina[];
  etiquetaConfirmacion: string;
  alEnviar: (activo: CrearActivoInput) => Promise<Activo>;
};

export function FormularioActivo(props: PropiedadesFormularioActivo) {
  const activoInicial = props.activoInicial;
  const clientes = props.clientes;
  const modelosMaquina = props.modelosMaquina;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let nombreInicial = "";
  let numSerieInicial = "";
  let descripcionInicial = "";
  let clienteIdInicial = "";
  let modeloMaquinaIdInicial = "";
  let anioFabricacionInicial = "";
  let ubicacionInicial = "";
  if (activoInicial) {
    if (activoInicial.nombre !== null) {
      nombreInicial = activoInicial.nombre;
    }
    numSerieInicial = activoInicial.numSerie;
    if (activoInicial.descripcion !== null) {
      descripcionInicial = activoInicial.descripcion;
    }
    clienteIdInicial = String(activoInicial.clienteId);
    modeloMaquinaIdInicial = String(activoInicial.modeloMaquinaId);
    if (activoInicial.anioFabricacion !== null) {
      anioFabricacionInicial = String(activoInicial.anioFabricacion);
    }
    if (activoInicial.ubicacion !== null) {
      ubicacionInicial = activoInicial.ubicacion;
    }
  }

  const enrutador = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [numSerie, setNumSerie] = useState(numSerieInicial);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [modeloMaquinaId, setModeloMaquinaId] = useState(modeloMaquinaIdInicial);
  const [anioFabricacion, setAnioFabricacion] = useState(anioFabricacionInicial);
  const [ubicacion, setUbicacion] = useState(ubicacionInicial);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  function cambiarNombre(evento: React.ChangeEvent<HTMLInputElement>) {
    setNombre(evento.target.value);
  }

  function cambiarNumeroSerie(evento: React.ChangeEvent<HTMLInputElement>) {
    setNumSerie(evento.target.value);
  }

  function cambiarDescripcion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setDescripcion(evento.target.value);
  }

  function cambiarCliente(evento: React.ChangeEvent<HTMLSelectElement>) {
    setClienteId(evento.target.value);
  }

  function cambiarModeloMaquina(evento: React.ChangeEvent<HTMLSelectElement>) {
    setModeloMaquinaId(evento.target.value);
  }

  function cambiarAnioFabricacion(evento: React.ChangeEvent<HTMLInputElement>) {
    setAnioFabricacion(evento.target.value);
  }

  function cambiarUbicacion(evento: React.ChangeEvent<HTMLInputElement>) {
    setUbicacion(evento.target.value);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviando(true);
    setErrorGeneral("");

    let nombreParaGuardar: string | null = nombre;
    if (!nombre.trim()) {
      nombreParaGuardar = null;
    }

    let descripcionParaGuardar: string | null = descripcion;
    if (!descripcion.trim()) {
      descripcionParaGuardar = null;
    }

    let anioFabricacionParaGuardar: number | null = null;
    if (anioFabricacion) {
      anioFabricacionParaGuardar = Number(anioFabricacion);
    }

    let ubicacionParaGuardar: string | null = ubicacion;
    if (!ubicacion.trim()) {
      ubicacionParaGuardar = null;
    }

    const activoParaGuardar: CrearActivoInput = {
      clienteId: Number(clienteId),
      numSerie,
      descripcion: descripcionParaGuardar,
      modeloMaquinaId: Number(modeloMaquinaId),
      anioFabricacion: anioFabricacionParaGuardar,
      nombre: nombreParaGuardar,
      ubicacion: ubicacionParaGuardar,
    };

    try {
      await alEnviar(activoParaGuardar);
      enrutador.push("/activos");
    } catch (error) {
      if (error instanceof Error) {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral("No se pudo guardar la información del activo.");
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

  const clientesDisponibles: Cliente[] = [];
  for (const cliente of clientes) {
    if (cliente.estado === "activo" || String(cliente.id) === clienteIdInicial) {
      clientesDisponibles.push(cliente);
    }
  }

  const modelosDisponibles: ModeloMaquina[] = [];
  for (const modeloMaquina of modelosMaquina) {
    if (modeloMaquina.estado === "activo" || String(modeloMaquina.id) === modeloMaquinaIdInicial) {
      modelosDisponibles.push(modeloMaquina);
    }
  }

  return (
    <form onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nombre">Nombre del activo (opcional)</label>
          <input id="nombre" maxLength={100} onChange={cambiarNombre} value={nombre} />
        </div>

        <div className="form-field">
          <label htmlFor="numeroSerie">Número de serie</label>
          <input id="numeroSerie" maxLength={100} onChange={cambiarNumeroSerie} required value={numSerie} />
        </div>

        <div className="form-field">
          <label htmlFor="clienteId">Cliente asociado</label>
          <select id="clienteId" onChange={cambiarCliente} required value={clienteId}>
            <option disabled value="">Seleccioná un cliente</option>
            {clientesDisponibles.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="modeloMaquinaId">Modelo de máquina</label>
          <select id="modeloMaquinaId" onChange={cambiarModeloMaquina} required value={modeloMaquinaId}>
            <option disabled value="">Seleccioná un modelo</option>
            {modelosDisponibles.map((modeloMaquina) => (
              <option key={modeloMaquina.id} value={modeloMaquina.id}>{modeloMaquina.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="anioFabricacion">Año de fabricación (opcional)</label>
          <input id="anioFabricacion" onChange={cambiarAnioFabricacion} type="number" value={anioFabricacion} />
        </div>

        <div className="form-field">
          <label htmlFor="ubicacion">Ubicación (opcional)</label>
          <input id="ubicacion" maxLength={150} onChange={cambiarUbicacion} value={ubicacion} />
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción u observaciones técnicas (opcional)</label>
        <textarea id="descripcion" onChange={cambiarDescripcion} rows={4} value={descripcion} />
      </div>

      <div className="form-actions">
        <Link className="secondary-button" href="/activos">
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
