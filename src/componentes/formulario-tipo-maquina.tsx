"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CrearTipoMaquinaInput, TipoMaquina } from "@/tipos/tipo-maquina";

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

  function cambiarNombre(evento: React.ChangeEvent<HTMLInputElement>) {
    setNombre(evento.target.value);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviando(true);
    setErrorGeneral("");

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
    <form onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-field form-field-full">
        <label htmlFor="nombre">Nombre del tipo de máquina</label>
        <input id="nombre" maxLength={60} onChange={cambiarNombre} required value={nombre} />
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
