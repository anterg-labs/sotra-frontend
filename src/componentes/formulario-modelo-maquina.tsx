"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CrearModeloMaquinaInput, ModeloMaquina } from "@/tipos/modelo-maquina";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

type PropiedadesFormularioModeloMaquina = {
  modeloMaquinaInicial?: ModeloMaquina;
  tiposMaquina: TipoMaquina[];
  etiquetaConfirmacion: string;
  alEnviar: (modeloMaquina: CrearModeloMaquinaInput) => Promise<ModeloMaquina>;
};

export function FormularioModeloMaquina(props: PropiedadesFormularioModeloMaquina) {
  const modeloMaquinaInicial = props.modeloMaquinaInicial;
  const tiposMaquina = props.tiposMaquina;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let nombreInicial = "";
  let tipoMaquinaIdInicial = "";
  let descripcionInicial = "";
  if (modeloMaquinaInicial) {
    nombreInicial = modeloMaquinaInicial.nombre;
    tipoMaquinaIdInicial = String(modeloMaquinaInicial.tipoMaquinaId);
    if (modeloMaquinaInicial.descripcion !== null) {
      descripcionInicial = modeloMaquinaInicial.descripcion;
    }
  }

  const enrutador = useRouter();
  const [nombre, setNombre] = useState(nombreInicial);
  const [tipoMaquinaId, setTipoMaquinaId] = useState(tipoMaquinaIdInicial);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  function cambiarNombre(evento: React.ChangeEvent<HTMLInputElement>) {
    setNombre(evento.target.value);
  }

  function cambiarTipoMaquina(evento: React.ChangeEvent<HTMLSelectElement>) {
    setTipoMaquinaId(evento.target.value);
  }

  function cambiarDescripcion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setDescripcion(evento.target.value);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviando(true);
    setErrorGeneral("");

    let descripcionParaGuardar: string | null = descripcion;
    if (!descripcion.trim()) {
      descripcionParaGuardar = null;
    }

    const modeloMaquinaParaGuardar: CrearModeloMaquinaInput = {
      nombre: nombre,
      tipoMaquinaId: Number(tipoMaquinaId),
      descripcion: descripcionParaGuardar,
    };

    try {
      await alEnviar(modeloMaquinaParaGuardar);
      enrutador.push("/activos?seccion=modelos");
    } catch (error) {
      if (error instanceof Error) {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral("No se pudo guardar el modelo de máquina.");
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

  const tiposDisponibles: TipoMaquina[] = [];
  for (const tipoMaquina of tiposMaquina) {
    if (tipoMaquina.estado === "activo" || String(tipoMaquina.id) === tipoMaquinaIdInicial) {
      tiposDisponibles.push(tipoMaquina);
    }
  }

  return (
    <form onSubmit={enviarFormulario}>
      {mensajeError}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nombre">Nombre del modelo</label>
          <input id="nombre" maxLength={60} onChange={cambiarNombre} required value={nombre} />
        </div>

        <div className="form-field">
          <label htmlFor="tipoMaquinaId">Tipo de máquina</label>
          <select id="tipoMaquinaId" onChange={cambiarTipoMaquina} required value={tipoMaquinaId}>
            <option disabled value="">Seleccioná un tipo</option>
            {tiposDisponibles.map((tipoMaquina) => (
              <option key={tipoMaquina.id} value={tipoMaquina.id}>{tipoMaquina.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción (opcional)</label>
        <textarea id="descripcion" onChange={cambiarDescripcion} rows={3} value={descripcion} />
      </div>

      <div className="form-actions">
        <Link className="secondary-button" href="/activos?seccion=modelos">
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
