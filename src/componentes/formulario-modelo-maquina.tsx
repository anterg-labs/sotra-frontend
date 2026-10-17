"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Combobox } from "@/componentes/combobox";
import { InterruptorActivo } from "@/componentes/listado/interruptor-activo";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import { listarTiposMaquinaPaginados } from "@/servicios/servicio-tipos-maquina";
import type { GuardarModeloMaquinaInput, ModeloMaquina } from "@/tipos/modelo-maquina";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { TipoMaquina } from "@/tipos/tipo-maquina";
import { validarNombreCatalogo, validarTipoMaquinaSeleccionado } from "@/validaciones/maquinaria";

type PropiedadesFormularioModeloMaquina = {
  modeloMaquinaInicial?: ModeloMaquina;
  tiposMaquina: TipoMaquina[];
  etiquetaConfirmacion: string;
  /** Server Action que guarda el modelo (alta o modificación). */
  accion: (modeloMaquina: GuardarModeloMaquinaInput) => Promise<ResultadoGuardar<ModeloMaquina>>;
  /** Si se informa, el formulario no navega: avisa al guardar (por ejemplo, para cerrar un modal). */
  alGuardar?: (resultado: ModeloMaquina) => void;
  alCancelar?: () => void;
};

export function FormularioModeloMaquina(props: PropiedadesFormularioModeloMaquina) {
  const { modeloMaquinaInicial, tiposMaquina, etiquetaConfirmacion, accion, alGuardar, alCancelar } = props;
  const tipoMaquinaIdInicial = modeloMaquinaInicial ? String(modeloMaquinaInicial.tipoMaquinaId) : "";

  const enrutador = useRouter();
  const [nombre, setNombre] = useState(modeloMaquinaInicial?.nombre ?? "");
  const [tipoMaquinaId, setTipoMaquinaId] = useState(tipoMaquinaIdInicial);
  const [descripcion, setDescripcion] = useState(modeloMaquinaInicial?.descripcion ?? "");
  const [estaActivo, setEstaActivo] = useState((modeloMaquinaInicial?.estado ?? "activo") === "activo");

  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: (datos: GuardarModeloMaquinaInput) => {
      const errorNombre = validarNombreCatalogo(datos.nombre);
      const errorTipo = validarTipoMaquinaSeleccionado(datos.tipoMaquinaId > 0 ? String(datos.tipoMaquinaId) : "");
      return {
        ...(errorNombre ? { nombre: errorNombre } : {}),
        ...(errorTipo ? { tipoMaquinaId: errorTipo } : {}),
      };
    },
    accion,
    alExito: (modelo: ModeloMaquina) => {
      if (alGuardar) {
        alGuardar(modelo);
      } else {
        enrutador.push("/activos/modelos");
      }
    },
    mensajeGeneral: "No se pudo guardar el modelo de máquina.",
  });

  function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({
      nombre,
      tipoMaquinaId: Number(tipoMaquinaId),
      descripcion: descripcion.trim() === "" ? null : descripcion,
      estado: estaActivo ? "activo" : "inactivo",
    });
  }

  const tiposDisponibles = tiposMaquina.filter(
    (tipo) => tipo.estado === "activo" || String(tipo.id) === tipoMaquinaIdInicial,
  );

  return (
    <form aria-busy={estaEnviando} noValidate onSubmit={enviarFormulario}>
      {modeloMaquinaInicial ? <InterruptorActivo alCambiar={setEstaActivo} estaActivo={estaActivo} /> : null}

      {errorGeneral ? (
        <p className="form-error-banner" ref={referenciaErrorGeneral} role="alert" tabIndex={-1}>{errorGeneral}</p>
      ) : null}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nombre">Nombre del modelo</label>
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

        <div>
          <Combobox
            alCambiar={setTipoMaquinaId}
            buscarOpciones={async (consulta) => {
              const pagina = await listarTiposMaquinaPaginados({ buscar: consulta, estado: "activo", pagina: 1 });
              return pagina.elementos.map((tipo) => ({ valor: String(tipo.id), etiqueta: tipo.nombre }));
            }}
            etiqueta="Tipo de máquina"
            id="tipoMaquinaId"
            idError={errores.tipoMaquinaId ? "tipoMaquinaId-error" : undefined}
            opciones={tiposDisponibles.map((tipo) => ({ valor: String(tipo.id), etiqueta: tipo.nombre }))}
            requerido
            tieneError={Boolean(errores.tipoMaquinaId)}
            valor={tipoMaquinaId}
          />
          {errores.tipoMaquinaId ? (
            <p className="field-error" id="tipoMaquinaId-error" role="alert">
              {errores.tipoMaquinaId}
            </p>
          ) : null}
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción (opcional)</label>
        <textarea id="descripcion" onChange={(evento) => setDescripcion(evento.target.value)} rows={3} value={descripcion} />
      </div>

      <div className="form-actions">
        {alCancelar ? (
          <button className="secondary-button" onClick={alCancelar} type="button">
            Cancelar
          </button>
        ) : (
          <Link className="secondary-button" href="/activos/modelos">
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
