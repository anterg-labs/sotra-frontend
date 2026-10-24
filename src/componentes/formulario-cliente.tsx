"use client";

import { useAvisos } from "@/componentes/avisos";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { Cliente, CrearClienteInput } from "@/tipos/cliente";
import { validarCliente } from "@/validaciones/cliente";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

type PropiedadesFormularioCliente = {
  clienteInicial?: CrearClienteInput;
  etiquetaConfirmacion: string;
  /** Server Action que guarda el cliente (alta o modificación). */
  accion: (cliente: CrearClienteInput) => Promise<ResultadoGuardar<Cliente>>;
  /** Si se informa, el formulario no navega: avisa al guardar (por ejemplo, para cerrar un modal). */
  alGuardar?: (resultado: Cliente) => void;
  alCancelar?: () => void;
};

const clienteVacio: CrearClienteInput = {
  razonSocial: "",
  nombreContacto: "",
  correo: "",
  telefono: "",
  direccion: "",
  observaciones: "",
};

function textoOVacio(valor: string | null) {
  return valor ?? "";
}

function nullSiVacio(valor: string) {
  return valor.trim() === "" ? null : valor;
}

export function FormularioCliente(props: PropiedadesFormularioCliente) {
  const { accion, alGuardar, alCancelar, etiquetaConfirmacion } = props;
  const clienteInicial = props.clienteInicial ?? clienteVacio;
  const esModificacion = props.clienteInicial !== undefined;

  const enrutador = useRouter();
  const { mostrarAviso } = useAvisos();
  const [razonSocial, setRazonSocial] = useState(clienteInicial.razonSocial);
  const [nombreContacto, setNombreContacto] = useState(clienteInicial.nombreContacto);
  const [correo, setCorreo] = useState(textoOVacio(clienteInicial.correo));
  const [telefono, setTelefono] = useState(textoOVacio(clienteInicial.telefono));
  const [direccion, setDireccion] = useState(textoOVacio(clienteInicial.direccion));
  const [observaciones, setObservaciones] = useState(textoOVacio(clienteInicial.observaciones));
  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: (datos: CrearClienteInput) =>
      validarCliente({
        razonSocial: datos.razonSocial,
        nombreContacto: datos.nombreContacto,
        correo: datos.correo ?? "",
        telefono: datos.telefono ?? "",
        direccion: datos.direccion ?? "",
      }),
    accion,
    alExito: (cliente: Cliente) => {
      if (alGuardar) {
        alGuardar(cliente);
      } else {
        mostrarAviso("exito", esModificacion ? "Cliente actualizado." : "Cliente registrado.");
        enrutador.push("/clientes");
      }
    },
    mensajeGeneral: "No se pudo guardar la información del cliente.",
  });

  function mostrarError(campo: string, mensaje?: string) {
    if (!mensaje) return null;
    return (
      <p className="field-error" id={campo + "-error"} role="alert">
        {mensaje}
      </p>
    );
  }

  function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos: CrearClienteInput = {
      razonSocial,
      nombreContacto,
      correo: nullSiVacio(correo),
      telefono: nullSiVacio(telefono),
      direccion: nullSiVacio(direccion),
      observaciones: nullSiVacio(observaciones),
    };
    enviar(datos);
  }

  let mensajeError = null;
  if (errorGeneral) {
    mensajeError = <AvisoEnLinea ref={referenciaErrorGeneral}>{errorGeneral}</AvisoEnLinea>;
  }

  let textoBoton = etiquetaConfirmacion;
  if (estaEnviando) {
    textoBoton = "Guardando…";
  }

  return (
    <form noValidate aria-busy={estaEnviando} onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="razonSocial">Nombre o razón social</label>
          <input
            aria-describedby={errores.razonSocial ? "razonSocial-error" : undefined}
            aria-invalid={errores.razonSocial ? true : undefined}
            id="razonSocial"
            onChange={(evento) => setRazonSocial(evento.target.value)}
            required
            value={razonSocial}
          />
          {mostrarError("razonSocial", errores.razonSocial)}
        </div>

        <div className="form-field">
          <label htmlFor="nombreContacto">Nombre de contacto</label>
          <input
            aria-describedby={errores.nombreContacto ? "nombreContacto-error" : undefined}
            aria-invalid={errores.nombreContacto ? true : undefined}
            id="nombreContacto"
            onChange={(evento) => setNombreContacto(evento.target.value)}
            required
            value={nombreContacto}
          />
          {mostrarError("nombreContacto", errores.nombreContacto)}
        </div>

        <div className="form-field">
          <label htmlFor="correo">Correo electrónico (opcional)</label>
          <input
            aria-describedby={errores.correo ? "correo-error" : undefined}
            aria-invalid={errores.correo ? true : undefined}
            id="correo"
            onChange={(evento) => setCorreo(evento.target.value)}
            type="email"
            value={correo}
          />
          {mostrarError("correo", errores.correo)}
        </div>

        <div className="form-field">
          <label htmlFor="telefono">Número telefónico (opcional)</label>
          <input
            aria-describedby={errores.telefono ? "telefono-error" : undefined}
            aria-invalid={errores.telefono ? true : undefined}
            autoComplete="tel-national"
            id="telefono"
            inputMode="numeric"
            onChange={(evento) => setTelefono(evento.target.value)}
            placeholder="099123456"
            type="tel"
            value={telefono}
          />
          {mostrarError("telefono", errores.telefono)}
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="direccion">Dirección (opcional)</label>
        <input
            aria-describedby={errores.direccion ? "direccion-error" : undefined}
            aria-invalid={errores.direccion ? true : undefined}
            id="direccion"
            onChange={(evento) => setDireccion(evento.target.value)}
            value={direccion}
          />
          {mostrarError("direccion", errores.direccion)}
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales (opcional)</label>
        <textarea id="observaciones" onChange={(evento) => setObservaciones(evento.target.value)} rows={4} value={observaciones} />
      </div>

      <div className="form-actions">
        {alCancelar ? (
          <button className="secondary-button" onClick={alCancelar} type="button">
            Cancelar
          </button>
        ) : (
          <Link className="secondary-button" href="/clientes">
            Cancelar
          </Link>
        )}
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
