"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CrearRepuestoInput, Repuesto } from "@/tipos/repuesto";

type PropiedadesFormularioRepuesto = {
  repuestoInicial?: Repuesto;
  etiquetaConfirmacion: string;
  alEnviar: (repuesto: CrearRepuestoInput) => Promise<Repuesto>;
};

export function FormularioRepuesto(props: PropiedadesFormularioRepuesto) {
  const repuestoInicial = props.repuestoInicial;
  const etiquetaConfirmacion = props.etiquetaConfirmacion;
  const alEnviar = props.alEnviar;

  let codigoInicial = "";
  let nombreInicial = "";
  let descripcionInicial = "";
  let marcaInicial = "";
  let ubicacionInicial = "";
  let cantidadInicial = "0";
  let cantidadMinimaInicial = "0";
  if (repuestoInicial) {
    codigoInicial = repuestoInicial.codigo;
    nombreInicial = repuestoInicial.nombre;
    descripcionInicial = repuestoInicial.descripcion;
    marcaInicial = repuestoInicial.marca;
    ubicacionInicial = repuestoInicial.ubicacion;
    cantidadInicial = String(repuestoInicial.cantidad);
    cantidadMinimaInicial = String(repuestoInicial.cantidadMinima);
  }

  const enrutador = useRouter();
  const [codigo, setCodigo] = useState(codigoInicial);
  const [nombre, setNombre] = useState(nombreInicial);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [marca, setMarca] = useState(marcaInicial);
  const [ubicacion, setUbicacion] = useState(ubicacionInicial);
  const [cantidad, setCantidad] = useState(cantidadInicial);
  const [cantidadMinima, setCantidadMinima] = useState(cantidadMinimaInicial);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");

  function cambiarCodigo(evento: React.ChangeEvent<HTMLInputElement>) {
    setCodigo(evento.target.value);
  }

  function cambiarNombre(evento: React.ChangeEvent<HTMLInputElement>) {
    setNombre(evento.target.value);
  }

  function cambiarDescripcion(evento: React.ChangeEvent<HTMLTextAreaElement>) {
    setDescripcion(evento.target.value);
  }

  function cambiarMarca(evento: React.ChangeEvent<HTMLInputElement>) {
    setMarca(evento.target.value);
  }

  function cambiarUbicacion(evento: React.ChangeEvent<HTMLInputElement>) {
    setUbicacion(evento.target.value);
  }

  function cambiarCantidad(evento: React.ChangeEvent<HTMLInputElement>) {
    setCantidad(evento.target.value);
  }

  function cambiarCantidadMinima(evento: React.ChangeEvent<HTMLInputElement>) {
    setCantidadMinima(evento.target.value);
  }

  async function enviarFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstaEnviando(true);
    setErrorGeneral("");

    const repuestoParaGuardar: CrearRepuestoInput = {
      codigo,
      nombre,
      descripcion,
      marca,
      ubicacion,
      cantidad: Number(cantidad),
      cantidadMinima: Number(cantidadMinima),
    };

    try {
      await alEnviar(repuestoParaGuardar);
      enrutador.push("/repuestos");
    } catch (error) {
      if (error instanceof Error) {
        setErrorGeneral(error.message);
      } else {
        setErrorGeneral("No se pudo guardar el repuesto.");
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

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="codigo">Código</label>
          <input id="codigo" maxLength={50} onChange={cambiarCodigo} required value={codigo} />
        </div>

        <div className="form-field">
          <label htmlFor="nombre">Nombre del repuesto</label>
          <input id="nombre" maxLength={120} onChange={cambiarNombre} required value={nombre} />
        </div>

        <div className="form-field">
          <label htmlFor="marca">Marca (opcional)</label>
          <input id="marca" maxLength={100} onChange={cambiarMarca} value={marca} />
        </div>

        <div className="form-field">
          <label htmlFor="ubicacion">Ubicación (opcional)</label>
          <input id="ubicacion" maxLength={120} onChange={cambiarUbicacion} value={ubicacion} />
        </div>

        <div className="form-field">
          <label htmlFor="cantidad">Cantidad en stock</label>
          <input id="cantidad" min={0} onChange={cambiarCantidad} required step={1} type="number" value={cantidad} />
        </div>

        <div className="form-field">
          <label htmlFor="cantidadMinima">Cantidad mínima</label>
          <input
            id="cantidadMinima"
            min={0}
            onChange={cambiarCantidadMinima}
            required
            step={1}
            type="number"
            value={cantidadMinima}
          />
        </div>
      </div>

      <div className="form-field form-field-full">
        <label htmlFor="descripcion">Descripción (opcional)</label>
        <textarea id="descripcion" onChange={cambiarDescripcion} rows={3} value={descripcion} />
      </div>

      <div className="form-actions">
        <Link className="secondary-button" href="/repuestos">
          Cancelar
        </Link>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {textoBoton}
        </button>
      </div>
    </form>
  );
}
