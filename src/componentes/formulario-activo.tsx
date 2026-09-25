"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Activo, CrearActivoInput } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";

type PropiedadesFormularioActivo = {
  activoInicial?: Activo;
  clientes: Cliente[];
  etiquetaConfirmacion: string;
  alEnviar: (activo: CrearActivoInput) => Promise<Activo>;
};

export function FormularioActivo(props: PropiedadesFormularioActivo) {
  const activoInicial = props.activoInicial;
  const clientes = props.clientes;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let nombreInicial = "";
  let numeroSerieInicial = "";
  let descripcionInicial = "";
  let clienteIdInicial = "";
  if (activoInicial) {
    nombreInicial = activoInicial.nombre;
    numeroSerieInicial = activoInicial.numeroSerie;
    descripcionInicial = activoInicial.descripcion;
    clienteIdInicial = String(activoInicial.clienteId);
  }

  const enrutador = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [numeroSerie, setNumeroSerie] = useState(numeroSerieInicial);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  function cambiarNombre(evento: React.ChangeEvent<HTMLInputElement>) {
    setNombre(evento.target.value);
  }

  function cambiarNumeroSerie(evento: React.ChangeEvent<HTMLInputElement>) {
    setNumeroSerie(evento.target.value);
  }

  function cambiarDescripcion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setDescripcion(evento.target.value);
  }

  function cambiarCliente(evento: React.ChangeEvent<HTMLSelectElement>) {
    setClienteId(evento.target.value);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviando(true);
    setErrorGeneral("");

    const activoParaGuardar: CrearActivoInput = {
      nombre,
      numeroSerie,
      descripcion,
      clienteId: Number(clienteId),
    };

    try {
      await alEnviar(activoParaGuardar);
      enrutador.push("/activos");
    } catch {
      setErrorGeneral("No se pudo guardar la información del activo.");
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
          <label htmlFor="nombre">Nombre del activo</label>
          <input id="nombre" maxLength={100} onChange={cambiarNombre} required value={nombre} />
        </div>

        <div className="form-field">
          <label htmlFor="numeroSerie">Número de serie</label>
          <input id="numeroSerie" maxLength={100} onChange={cambiarNumeroSerie} required value={numeroSerie} />
        </div>

        <div className="form-field">
          <label htmlFor="clienteId">Cliente asociado</label>
          <select id="clienteId" onChange={cambiarCliente} required value={clienteId}>
            <option disabled value="">Seleccioná un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.razonSocial}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción u observaciones técnicas</label>
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
