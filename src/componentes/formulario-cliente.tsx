"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CrearClienteInput } from "@/tipos/cliente";

type PropiedadesFormularioCliente = {
  clienteInicial?: CrearClienteInput;
  etiquetaConfirmacion: string;
  alEnviar: (cliente: CrearClienteInput) => Promise<{ id: number }>;
};

const clienteVacio: CrearClienteInput = {
  razonSocial: "",
  nombreContacto: "",
  correo: "",
  telefono: "",
  direccion: "",
  observaciones: "",
};

export function FormularioCliente(props: PropiedadesFormularioCliente) {
  let clienteInicial = props.clienteInicial;
  if (!clienteInicial) {
    clienteInicial = clienteVacio;
  }
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let correoInicial = "";
  if (clienteInicial.correo !== null) {
    correoInicial = clienteInicial.correo;
  }

  let telefonoInicial = "";
  if (clienteInicial.telefono !== null) {
    telefonoInicial = clienteInicial.telefono;
  }

  let direccionInicial = "";
  if (clienteInicial.direccion !== null) {
    direccionInicial = clienteInicial.direccion;
  }

  let observacionesIniciales = "";
  if (clienteInicial.observaciones !== null) {
    observacionesIniciales = clienteInicial.observaciones;
  }

  const enrutador = useRouter();
  const [razonSocial, setRazonSocial] = useState(clienteInicial.razonSocial);
  const [nombreContacto, setNombreContacto] = useState(clienteInicial.nombreContacto);
  const [correo, setCorreo] = useState(correoInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [direccion, setDireccion] = useState(direccionInicial);
  const [observaciones, setObservaciones] = useState(observacionesIniciales);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  function cambiarRazonSocial(evento: React.ChangeEvent<HTMLInputElement>) {
    setRazonSocial(evento.target.value);
  }

  function cambiarNombreContacto(evento: React.ChangeEvent<HTMLInputElement>) {
    setNombreContacto(evento.target.value);
  }

  function cambiarCorreo(evento: React.ChangeEvent<HTMLInputElement>) {
    setCorreo(evento.target.value);
  }

  function cambiarTelefono(evento: React.ChangeEvent<HTMLInputElement>) {
    setTelefono(evento.target.value);
  }

  function cambiarDireccion(evento: React.ChangeEvent<HTMLInputElement>) {
    setDireccion(evento.target.value);
  }

  function cambiarObservaciones(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setObservaciones(evento.target.value);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviando(true);
    setErrorGeneral("");

    let correoParaGuardar: string | null = correo;
    if (!correo.trim()) {
      correoParaGuardar = null;
    }

    let telefonoParaGuardar: string | null = telefono;
    if (!telefono.trim()) {
      telefonoParaGuardar = null;
    }

    let direccionParaGuardar: string | null = direccion;
    if (!direccion.trim()) {
      direccionParaGuardar = null;
    }

    let observacionesParaGuardar: string | null = observaciones;
    if (!observaciones.trim()) {
      observacionesParaGuardar = null;
    }

    const clienteParaGuardar: CrearClienteInput = {
      razonSocial,
      nombreContacto,
      correo: correoParaGuardar,
      telefono: telefonoParaGuardar,
      direccion: direccionParaGuardar,
      observaciones: observacionesParaGuardar,
    };

    try {
      await alEnviar(clienteParaGuardar);
      enrutador.push("/clientes");
    } catch {
      setErrorGeneral("No se pudo guardar la información del cliente.");
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

  return (
    <form onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="razonSocial">Nombre o razón social</label>
          <input id="razonSocial" onChange={cambiarRazonSocial} required value={razonSocial} />
        </div>

        <div className="form-field">
          <label htmlFor="nombreContacto">Nombre de contacto</label>
          <input id="nombreContacto" onChange={cambiarNombreContacto} required value={nombreContacto} />
        </div>

        <div className="form-field">
          <label htmlFor="correo">Correo electrónico (opcional)</label>
          <input id="correo" onChange={cambiarCorreo} type="email" value={correo} />
        </div>

        <div className="form-field">
          <label htmlFor="telefono">Número telefónico (opcional)</label>
          <input id="telefono" onChange={cambiarTelefono} type="tel" value={telefono} />
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="direccion">Dirección (opcional)</label>
        <input id="direccion" onChange={cambiarDireccion} value={direccion} />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales (opcional)</label>
        <textarea id="observaciones" onChange={cambiarObservaciones} rows={4} value={observaciones} />
      </div>

      <div className="form-actions">
        <Link className="secondary-button" href="/clientes">
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
