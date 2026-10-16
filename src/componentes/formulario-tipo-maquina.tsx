"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CrearTipoMaquinaInput, TipoMaquina } from "@/tipos/tipo-maquina";
import { validarNombreCatalogo } from "@/validaciones/maquinaria";

type PropiedadesFormularioTipoMaquina = {
  tipoMaquinaInicial?: TipoMaquina;
  etiquetaConfirmacion: string;
  alEnviar: (tipoMaquina: CrearTipoMaquinaInput) => Promise<TipoMaquina>;
};

export function FormularioTipoMaquina(props: PropiedadesFormularioTipoMaquina) {
  const tipoMaquinaInicial = props.tipoMaquinaInicial;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let nombreInicial = "";
  if (tipoMaquinaInicial) {
    nombreInicial = tipoMaquinaInicial.nombre;
  }

  const enrutador = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [errorNombre, setErrorNombre] = useState<string | undefined>();

  function mostrarError(campo: string, mensaje?: string) {
    if (!mensaje) return null;
    return (
      <p className="field-error" id={campo + "-error"} role="alert">
        {mensaje}
      </p>
    );
  }

  function cambiarNombre(evento: React.ChangeEvent<HTMLInputElement>) {
    setNombre(evento.target.value);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral("");

    const errorDetectado = validarNombreCatalogo(nombre);
    setErrorNombre(errorDetectado);
    if (errorDetectado) {
      return;
    }

    setEstaEnviando(true);

    const tipoMaquinaParaGuardar: CrearTipoMaquinaInput = {
      nombre: nombre,
    };

    try {
      await alEnviar(tipoMaquinaParaGuardar);
      enrutador.push("/activos?seccion=tipos");
    } catch (error) {
      if (error instanceof Error) {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral("No se pudo guardar el tipo de máquina.");
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

  return (
    <form noValidate onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-field form-field-full">
        <label htmlFor="nombre">Nombre del tipo de máquina</label>
        <input
          aria-describedby={errorNombre ? "nombre-error" : undefined}
          aria-invalid={errorNombre ? true : undefined}
          id="nombre"
          onChange={cambiarNombre}
          required
          value={nombre}
        />
        {mostrarError("nombre", errorNombre)}
      </div>

      <div className="form-actions">
        <Link className="secondary-button" href="/activos?seccion=tipos">
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
