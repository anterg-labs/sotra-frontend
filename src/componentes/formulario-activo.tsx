"use client";

import { BotonCancelarFormulario, useSalidaDeFormulario } from "@/componentes/modal-de-ruta";
import { useState } from "react";
import { Combobox } from "@/componentes/combobox";
import { InterruptorActivo } from "@/componentes/listado/interruptor-activo";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import { listarClientesPaginados } from "@/servicios/servicio-clientes";
import { listarModelosMaquinaPaginados } from "@/servicios/servicio-modelos-maquina";
import type { Activo, GuardarActivoInput } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import { validarActivo } from "@/validaciones/activo";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

type PropiedadesFormularioActivo = {
  activoInicial?: Activo;
  clientes: Cliente[];
  modelosMaquina: ModeloMaquina[];
  etiquetaConfirmacion: string;
  /** Server Action que guarda el activo (alta o modificación). */
  accion: (activo: GuardarActivoInput) => Promise<ResultadoGuardar<Activo>>;
  /** Si se informa, el formulario no navega: avisa al guardar (por ejemplo, para cerrar un modal). */
  alGuardar?: (resultado: Activo) => void;
  alCancelar?: () => void;
};

/** El campo del número de serie se llama `numSerie` en el contrato y `numeroSerie` en el formulario. */
function idDelCampo(campo: string) {
  return campo === "numSerie" ? "numeroSerie" : campo;
}

function textoOpcional(valor: string) {
  return valor.trim() === "" ? null : valor;
}

export function FormularioActivo(props: PropiedadesFormularioActivo) {
  const { activoInicial, clientes, modelosMaquina, etiquetaConfirmacion, accion, alGuardar, alCancelar } = props;
  const clienteIdInicial = activoInicial ? String(activoInicial.clienteId) : "";
  const modeloMaquinaIdInicial = activoInicial ? String(activoInicial.modeloMaquinaId) : "";

  const { terminar } = useSalidaDeFormulario();
  const [nombre, setNombre] = useState(activoInicial?.nombre ?? "");
  const [numSerie, setNumSerie] = useState(activoInicial?.numSerie ?? "");
  const [descripcion, setDescripcion] = useState(activoInicial?.descripcion ?? "");
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [modeloMaquinaId, setModeloMaquinaId] = useState(modeloMaquinaIdInicial);
  const [anioFabricacion, setAnioFabricacion] = useState(
    activoInicial?.anioFabricacion !== null && activoInicial?.anioFabricacion !== undefined ? String(activoInicial.anioFabricacion) : "",
  );
  const [ubicacion, setUbicacion] = useState(activoInicial?.ubicacion ?? "");
  const [unidadUso, setUnidadUso] = useState<"horas" | "kilometros">(activoInicial?.unidadUso ?? "horas");
  const [estaActivo, setEstaActivo] = useState((activoInicial?.estado ?? "activo") === "activo");

  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: (datos: GuardarActivoInput) =>
      validarActivo({
        nombre: datos.nombre ?? "",
        numSerie: datos.numSerie,
        clienteId: datos.clienteId > 0 ? String(datos.clienteId) : "",
        modeloMaquinaId: datos.modeloMaquinaId > 0 ? String(datos.modeloMaquinaId) : "",
        anioFabricacion: datos.anioFabricacion === null ? "" : String(datos.anioFabricacion),
        ubicacion: datos.ubicacion ?? "",
      }),
    accion,
    alExito: (activo: Activo) => {
      if (alGuardar) {
        alGuardar(activo);
      } else {
        terminar("/activos");
      }
    },
    idCampo: idDelCampo,
    mensajeGeneral: "No se pudo guardar la información del activo.",
  });

  function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({
      clienteId: Number(clienteId),
      numSerie,
      descripcion: textoOpcional(descripcion),
      modeloMaquinaId: Number(modeloMaquinaId),
      anioFabricacion: anioFabricacion ? Number(anioFabricacion) : null,
      nombre: textoOpcional(nombre),
      ubicacion: textoOpcional(ubicacion),
      ...(unidadUso === (activoInicial?.unidadUso ?? "horas") && !activoInicial?.unidadUso ? {} : { unidadUso }),
      estado: estaActivo ? "activo" : "inactivo",
    });
  }

  function mostrarError(idCampo: string, mensaje?: string) {
    if (!mensaje) return null;
    return (
      <p className="field-error" id={idCampo + "-error"} role="alert">
        {mensaje}
      </p>
    );
  }

  function atributosDeCampo(campo: string, idCampo: string) {
    return {
      "aria-describedby": errores[campo] ? idCampo + "-error" : undefined,
      "aria-invalid": errores[campo] ? true : undefined,
    };
  }

  const clientesDisponibles = clientes.filter((cliente) => cliente.estado === "activo" || String(cliente.id) === clienteIdInicial);
  const modelosDisponibles = modelosMaquina.filter(
    (modelo) => modelo.estado === "activo" || String(modelo.id) === modeloMaquinaIdInicial,
  );

  return (
    <form aria-busy={estaEnviando} noValidate onSubmit={enviarFormulario}>
      {activoInicial ? <InterruptorActivo alCambiar={setEstaActivo} estaActivo={estaActivo} /> : null}

      {errorGeneral ? (
        <AvisoEnLinea ref={referenciaErrorGeneral}>{errorGeneral}</AvisoEnLinea>
      ) : null}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nombre">Nombre del activo (opcional)</label>
          <input {...atributosDeCampo("nombre", "nombre")} id="nombre" onChange={(evento) => setNombre(evento.target.value)} value={nombre} />
          {mostrarError("nombre", errores.nombre)}
        </div>

        <div className="form-field">
          <label htmlFor="numeroSerie">Número de serie</label>
          <input
            {...atributosDeCampo("numSerie", "numeroSerie")}
            id="numeroSerie"
            onChange={(evento) => setNumSerie(evento.target.value)}
            required
            value={numSerie}
          />
          {mostrarError("numeroSerie", errores.numSerie)}
        </div>

        <div>
          <Combobox
            alCambiar={setClienteId}
            buscarOpciones={async (consulta) => {
              const pagina = await listarClientesPaginados({ buscar: consulta, estado: "activo", pagina: 1 });
              return pagina.elementos.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }));
            }}
            etiqueta="Cliente asociado"
            id="clienteId"
            idError={errores.clienteId ? "clienteId-error" : undefined}
            opciones={clientesDisponibles.map((cliente) => ({ valor: String(cliente.id), etiqueta: cliente.razonSocial }))}
            requerido
            tieneError={Boolean(errores.clienteId)}
            valor={clienteId}
          />
          {mostrarError("clienteId", errores.clienteId)}
        </div>

        <div>
          <Combobox
            alCambiar={setModeloMaquinaId}
            buscarOpciones={async (consulta) => {
              const pagina = await listarModelosMaquinaPaginados({ buscar: consulta, tipoMaquinaId: "", estado: "activo", pagina: 1 });
              return pagina.elementos.map((modelo) => ({ valor: String(modelo.id), etiqueta: modelo.nombre }));
            }}
            etiqueta="Modelo de máquina"
            id="modeloMaquinaId"
            idError={errores.modeloMaquinaId ? "modeloMaquinaId-error" : undefined}
            opciones={modelosDisponibles.map((modelo) => ({ valor: String(modelo.id), etiqueta: modelo.nombre }))}
            requerido
            tieneError={Boolean(errores.modeloMaquinaId)}
            valor={modeloMaquinaId}
          />
          {mostrarError("modeloMaquinaId", errores.modeloMaquinaId)}
        </div>

        <div className="form-field">
          <label htmlFor="anioFabricacion">Año de fabricación (opcional)</label>
          <input
            {...atributosDeCampo("anioFabricacion", "anioFabricacion")}
            id="anioFabricacion"
            onChange={(evento) => setAnioFabricacion(evento.target.value)}
            type="number"
            value={anioFabricacion}
          />
          {mostrarError("anioFabricacion", errores.anioFabricacion)}
        </div>

        <div className="form-field">
          <label htmlFor="ubicacion">Ubicación (opcional)</label>
          <input
            {...atributosDeCampo("ubicacion", "ubicacion")}
            id="ubicacion"
            onChange={(evento) => setUbicacion(evento.target.value)}
            value={ubicacion}
          />
          {mostrarError("ubicacion", errores.ubicacion)}
        </div>

        <div className="form-field">
          <label htmlFor="unidadUso">Cómo se mide el uso de la máquina</label>
          <select id="unidadUso" onChange={(evento) => setUnidadUso(evento.target.value as "horas" | "kilometros")} value={unidadUso}>
            <option value="horas">Horas (horómetro)</option>
            <option value="kilometros">Kilómetros (odómetro)</option>
          </select>
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción u observaciones técnicas (opcional)</label>
        <textarea id="descripcion" onChange={(evento) => setDescripcion(evento.target.value)} rows={4} value={descripcion} />
      </div>

      <div className="form-actions">
        {alCancelar ? (
          <button className="secondary-button" onClick={alCancelar} type="button">
            Cancelar
          </button>
        ) : (
          <BotonCancelarFormulario href="/activos" />
        )}
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {estaEnviando ? "Guardando…" : etiquetaConfirmacion}
        </button>
      </div>
    </form>
  );
}
