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

  const enrutador = useRouter();
  const [razonSocial, setRazonSocial] = useState(clienteInicial.razonSocial);
  const [nombreContacto, setNombreContacto] = useState(clienteInicial.nombreContacto);
  const [correo, setCorreo] = useState(clienteInicial.correo);
  const [telefono, setTelefono] = useState(clienteInicial.telefono);
  const [direccion, setDireccion] = useState(clienteInicial.direccion);
  const [observaciones, setObservaciones] = useState(clienteInicial.observaciones);
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

    const clienteParaGuardar: CrearClienteInput = {
      razonSocial,
      nombreContacto,
      correo,
      telefono,
      direccion,
      observaciones,
    };

    try {
      const clienteGuardado = await alEnviar(clienteParaGuardar);
      enrutador.push("/clientes/" + clienteGuardado.id);
    } catch {
      setErrorGeneral("No se pudo guardar la información del cliente.");
    } finally {
      setEstaEnviando(false);
    }
  }

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <p className="form-error-banner !mx-0 !mt-0 !mb-5">{errorGeneral}</p>;
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
          <label htmlFor="correo">Correo electrónico</label>
          <input id="correo" onChange={cambiarCorreo} required type="email" value={correo} />
        </div>

        <div className="form-field">
          <label htmlFor="telefono">Número telefónico</label>
          <input id="telefono" onChange={cambiarTelefono} required type="tel" value={telefono} />
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="direccion">Dirección</label>
        <input id="direccion" onChange={cambiarDireccion} required value={direccion} />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales</label>
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
