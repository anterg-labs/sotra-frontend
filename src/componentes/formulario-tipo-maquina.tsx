"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InterruptorActivo } from "@/componentes/listado/interruptor-activo";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { GuardarTipoMaquinaInput, TipoMaquina } from "@/tipos/tipo-maquina";
import { validarNombreCatalogo } from "@/validaciones/maquinaria";

type PropiedadesFormularioTipoMaquina = {
  tipoMaquinaInicial?: TipoMaquina;
  etiquetaConfirmacion: string;
  /** Server Action que guarda el tipo (alta o modificación). */
  accion: (tipoMaquina: GuardarTipoMaquinaInput) => Promise<ResultadoGuardar<TipoMaquina>>;
  /** Si se informa, el formulario no navega: avisa al guardar (por ejemplo, para cerrar un modal). */
  alGuardar?: (resultado: TipoMaquina) => void;
  alCancelar?: () => void;
};

export function FormularioTipoMaquina(props: PropiedadesFormularioTipoMaquina) {
  const { tipoMaquinaInicial, etiquetaConfirmacion, accion, alGuardar, alCancelar } = props;

  const enrutador = useRouter();
  const [nombre, setNombre] = useState(tipoMaquinaInicial?.nombre ?? "");
  const [estaActivo, setEstaActivo] = useState((tipoMaquinaInicial?.estado ?? "activo") === "activo");

  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: (datos: GuardarTipoMaquinaInput) => {
      const error = validarNombreCatalogo(datos.nombre);
      return error ? { nombre: error } : {};
    },
    accion,
    alExito: (tipoMaquina: TipoMaquina) => {
      if (alGuardar) {
        alGuardar(tipoMaquina);
      } else {
        enrutador.push("/activos/tipos");
      }
    },
    mensajeGeneral: "No se pudo guardar el tipo de máquina.",
  });

  function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({ nombre, estado: estaActivo ? "activo" : "inactivo" });
  }

  return (
    <form aria-busy={estaEnviando} noValidate onSubmit={enviarFormulario}>
      {tipoMaquinaInicial ? <InterruptorActivo alCambiar={setEstaActivo} estaActivo={estaActivo} /> : null}

      {errorGeneral ? (
        <p className="form-error-banner" ref={referenciaErrorGeneral} role="alert" tabIndex={-1}>{errorGeneral}</p>
      ) : null}

      <div className="form-field form-field-full">
        <label htmlFor="nombre">Nombre del tipo de máquina</label>
        <input
          aria-describedby={errores.nombre ? "nombre-error" : undefined}
          aria-invalid={errores.nombre ? true : undefined}
          id="nombre"
          onChange={(evento) => setNombre(evento.target.value)}
          required
          value={nombre}
        />
        {errores.nombre ? (
          <p className="field-error" id="nombre-error" role="alert">
            {errores.nombre}
          </p>
        ) : null}
      </div>

      <div className="form-actions">
        {alCancelar ? (
          <button className="secondary-button" onClick={alCancelar} type="button">
            Cancelar
          </button>
        ) : (
          <Link className="secondary-button" href="/activos/tipos">
            Cancelar
          </Link>
        )}
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {estaEnviando ? "Guardando…" : etiquetaConfirmacion}
        </button>
      </div>
    </form>
  );
}
