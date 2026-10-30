"use client";

import { BotonCancelarFormulario, useSalidaDeFormulario } from "@/componentes/modal-de-ruta";
import { useState } from "react";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import type { ResultadoGuardar } from "@/tipos/resultado-accion";
import type { CrearRepuestoInput, Repuesto } from "@/tipos/repuesto";
import { obtenerErroresRepuesto } from "@/validaciones/repuesto";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

type PropiedadesFormularioRepuesto = {
  repuestoInicial?: Repuesto;
  etiquetaConfirmacion: string;
  /** Server Action que guarda el repuesto (alta o modificación). */
  accion: (repuesto: CrearRepuestoInput) => Promise<ResultadoGuardar<Repuesto>>;
  /** Si se informa, el formulario no navega: avisa al guardar (por ejemplo, para cerrar un modal). */
  alGuardar?: (resultado: Repuesto) => void;
  alCancelar?: () => void;
};

function numeroODesconocido(texto: string) {
  return texto.trim() === "" ? Number.NaN : Number(texto);
}

export function FormularioRepuesto(props: PropiedadesFormularioRepuesto) {
  const { repuestoInicial, etiquetaConfirmacion, accion, alGuardar, alCancelar } = props;

  const { terminar } = useSalidaDeFormulario();
  const [codigo, setCodigo] = useState(repuestoInicial?.codigo ?? "");
  const [nombre, setNombre] = useState(repuestoInicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(repuestoInicial?.descripcion ?? "");
  const [marca, setMarca] = useState(repuestoInicial?.marca ?? "");
  const [ubicacion, setUbicacion] = useState(repuestoInicial?.ubicacion ?? "");
  const [categoria, setCategoria] = useState(repuestoInicial?.categoria ?? "");
  const [modeloCompatibilidad, setModeloCompatibilidad] = useState(repuestoInicial?.modeloCompatibilidad ?? "");
  const [unidadMedida, setUnidadMedida] = useState(repuestoInicial?.unidadMedida ?? "unidad");
  const [observaciones, setObservaciones] = useState(repuestoInicial?.observaciones ?? "");
  const [cantidad, setCantidad] = useState(String(repuestoInicial?.cantidad ?? 0));
  const [cantidadMinima, setCantidadMinima] = useState(String(repuestoInicial?.cantidadMinima ?? 0));

  const { errores, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: obtenerErroresRepuesto,
    accion,
    alExito: (repuesto: Repuesto) => {
      if (alGuardar) {
        alGuardar(repuesto);
      } else {
        terminar("/repuestos");
      }
    },
    mensajeGeneral: "No se pudo guardar el repuesto.",
  });

  function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({
      codigo,
      nombre,
      descripcion: descripcion.trim() === "" ? null : descripcion,
      marca: marca.trim() === "" ? null : marca,
      ubicacion: ubicacion.trim() === "" ? null : ubicacion,
      categoria: categoria.trim() === "" ? null : categoria,
      modeloCompatibilidad: modeloCompatibilidad.trim() === "" ? null : modeloCompatibilidad,
      unidadMedida: unidadMedida.trim() === "" ? null : unidadMedida,
      observaciones: observaciones.trim() === "" ? null : observaciones,
      cantidad: numeroODesconocido(cantidad),
      cantidadMinima: numeroODesconocido(cantidadMinima),
    });
  }

  function mostrarError(campo: string) {
    const mensaje = errores[campo];
    return mensaje ? <p className="field-error" id={`${campo}-error`} role="alert">{mensaje}</p> : null;
  }

  function atributosDeCampo(campo: string) {
    return { "aria-describedby": errores[campo] ? `${campo}-error` : undefined, "aria-invalid": errores[campo] ? true : undefined };
  }

  return (
    <form aria-busy={estaEnviando} noValidate onSubmit={enviarFormulario}>
      {errorGeneral ? (
        <AvisoEnLinea ref={referenciaErrorGeneral}>{errorGeneral}</AvisoEnLinea>
      ) : null}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="codigo">Código</label>
          <input {...atributosDeCampo("codigo")} id="codigo" onChange={(evento) => setCodigo(evento.target.value)} required value={codigo} />
          {mostrarError("codigo")}
        </div>

        <div className="form-field">
          <label htmlFor="nombre">Nombre del repuesto</label>
          <input {...atributosDeCampo("nombre")} id="nombre" onChange={(evento) => setNombre(evento.target.value)} required value={nombre} />
          {mostrarError("nombre")}
        </div>

        <div className="form-field">
          <label htmlFor="marca">Marca (opcional)</label>
          <input {...atributosDeCampo("marca")} id="marca" onChange={(evento) => setMarca(evento.target.value)} value={marca} />
          {mostrarError("marca")}
        </div>

        <div className="form-field">
          <label htmlFor="ubicacion">Ubicación (opcional)</label>
          <input {...atributosDeCampo("ubicacion")} id="ubicacion" onChange={(evento) => setUbicacion(evento.target.value)} value={ubicacion} />
          {mostrarError("ubicacion")}
        </div>

        <div className="form-field">
          <label htmlFor="categoria">Categoría o tipo (opcional)</label>
          <input {...atributosDeCampo("categoria")} id="categoria" onChange={(evento) => setCategoria(evento.target.value)} value={categoria} />
          {mostrarError("categoria")}
        </div>

        <div className="form-field">
          <label htmlFor="modeloCompatibilidad">Modelo o compatibilidad (opcional)</label>
          <input
            {...atributosDeCampo("modeloCompatibilidad")}
            id="modeloCompatibilidad"
            onChange={(evento) => setModeloCompatibilidad(evento.target.value)}
            value={modeloCompatibilidad}
          />
          {mostrarError("modeloCompatibilidad")}
        </div>

        <div className="form-field">
          <label htmlFor="unidadMedida">Unidad de medida</label>
          <input
            {...atributosDeCampo("unidadMedida")}
            id="unidadMedida"
            onChange={(evento) => setUnidadMedida(evento.target.value)}
            placeholder="unidad, litro, metro…"
            value={unidadMedida}
          />
          {mostrarError("unidadMedida")}
        </div>

        <div className="form-field">
          <label htmlFor="cantidad">Cantidad en stock</label>
          <input
            {...atributosDeCampo("cantidad")}
            id="cantidad"
            min={0}
            onChange={(evento) => setCantidad(evento.target.value)}
            readOnly={repuestoInicial !== undefined}
            required
            step={1}
            type="number"
            value={cantidad}
          />
          {repuestoInicial !== undefined ? (
            <p className="field-hint">Para cambiar el stock registrá un ingreso, un egreso o un ajuste desde el detalle del repuesto.</p>
          ) : null}
          {mostrarError("cantidad")}
        </div>

        <div className="form-field">
          <label htmlFor="cantidadMinima">Cantidad mínima</label>
          <input
            {...atributosDeCampo("cantidadMinima")}
            id="cantidadMinima"
            min={0}
            onChange={(evento) => setCantidadMinima(evento.target.value)}
            required
            step={1}
            type="number"
            value={cantidadMinima}
          />
          {mostrarError("cantidadMinima")}
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción (opcional)</label>
        <textarea id="descripcion" onChange={(evento) => setDescripcion(evento.target.value)} rows={3} value={descripcion} />
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="observaciones">Observaciones adicionales (opcional)</label>
        <textarea
          {...atributosDeCampo("observaciones")}
          id="observaciones"
          onChange={(evento) => setObservaciones(evento.target.value)}
          rows={3}
          value={observaciones}
        />
        {mostrarError("observaciones")}
      </div>

      <div className="form-actions">
        {alCancelar ? (
          <button className="secondary-button" onClick={alCancelar} type="button">
            Cancelar
          </button>
        ) : (
          <BotonCancelarFormulario href="/repuestos" />
        )}
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {estaEnviando ? "Guardando…" : etiquetaConfirmacion}
        </button>
      </div>
    </form>
  );
}
