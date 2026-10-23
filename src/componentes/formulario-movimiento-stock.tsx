"use client";

import { useState } from "react";
import { registrarAjusteStockAccion, registrarEgresoStockAccion } from "@/app/repuestos/acciones";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import type { MovimientoStock } from "@/tipos/movimiento-stock";
import { obtenerErroresAjusteStock, obtenerErroresEgresoStock } from "@/validaciones/movimiento-stock";
import { AvisoEnLinea } from "@/componentes/aviso-en-linea";

type PropiedadesFormularioMovimientoStock = {
  tipo: "egreso" | "ajuste";
  repuestoId: number;
  stockDisponible: number;
  alRegistrar: (movimiento: MovimientoStock) => void;
  alCancelar: () => void;
};

type DatosMovimiento = { cantidad: number; motivo: string; observaciones: string };

const textos = {
  egreso: {
    etiquetaCantidad: "Cantidad a retirar",
    ayuda: "Indicá cuántas unidades salen del stock.",
    etiquetaMotivo: "Motivo del egreso",
    placeholderMotivo: "Por ejemplo: entrega al técnico para una orden",
    confirmar: "Confirmar egreso",
    error: "No se pudo registrar el egreso de stock.",
  },
  ajuste: {
    etiquetaCantidad: "Stock real contado",
    ayuda: "Indicá el stock que hay físicamente; el sistema calcula la diferencia.",
    etiquetaMotivo: "Motivo del ajuste",
    placeholderMotivo: "Por ejemplo: conteo físico del inventario",
    confirmar: "Confirmar ajuste",
    error: "No se pudo registrar el ajuste de stock.",
  },
} as const;

/** Formulario de egreso o de ajuste de stock de un repuesto, con errores junto al campo y foco en el primero. */
export function FormularioMovimientoStock(props: PropiedadesFormularioMovimientoStock) {
  const { tipo, repuestoId, stockDisponible, alRegistrar, alCancelar } = props;
  const textosTipo = textos[tipo];
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const idCantidad = "cantidad-" + tipo;
  const idMotivo = "motivo-" + tipo;

  const { errores: erroresServidor, errorGeneral, estaEnviando, enviar, referenciaErrorGeneral } = useFormularioAccion({
    validar: (datos: DatosMovimiento) =>
      tipo === "egreso"
        ? obtenerErroresEgresoStock({ cantidad: datos.cantidad, motivo: datos.motivo }, stockDisponible)
        : obtenerErroresAjusteStock({ cantidadReal: datos.cantidad, motivo: datos.motivo }),
    accion: (datos: DatosMovimiento) =>
      tipo === "egreso"
        ? registrarEgresoStockAccion(repuestoId, datos)
        : registrarAjusteStockAccion(repuestoId, { cantidadReal: datos.cantidad, motivo: datos.motivo, observaciones: datos.observaciones }),
    alExito: alRegistrar,
    mensajeGeneral: textosTipo.error,
    idCampo: (campo) => (campo === "motivo" ? idMotivo : idCantidad),
  });
  const errores = {
    cantidad: erroresServidor.cantidad ?? erroresServidor.cantidadReal,
    motivo: erroresServidor.motivo,
  };

  function confirmar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar({ cantidad: cantidad.trim() === "" ? Number.NaN : Number(cantidad), motivo, observaciones });
  }

  return (
    <form aria-label={textosTipo.confirmar} className="mt-4 rounded-lg border u-borde p-4" noValidate onSubmit={confirmar}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={idCantidad}>{textosTipo.etiquetaCantidad}</label>
          <input
            aria-describedby={errores.cantidad ? idCantidad + "-error" : idCantidad + "-ayuda"}
            aria-invalid={errores.cantidad ? true : undefined}
            id={idCantidad}
            inputMode="numeric"
            min={tipo === "egreso" ? 1 : 0}
            onChange={(evento) => setCantidad(evento.target.value)}
            required
            step={1}
            type="number"
            value={cantidad}
          />
          <p className="field-hint" id={idCantidad + "-ayuda"}>{textosTipo.ayuda + " Disponible: " + stockDisponible + "."}</p>
          {errores.cantidad ? <p className="field-error" id={idCantidad + "-error"} role="alert">{errores.cantidad}</p> : null}
        </div>
        <div className="form-field">
          <label htmlFor={idMotivo}>{textosTipo.etiquetaMotivo}</label>
          <input
            aria-describedby={errores.motivo ? idMotivo + "-error" : undefined}
            aria-invalid={errores.motivo ? true : undefined}
            id={idMotivo}
            maxLength={200}
            onChange={(evento) => setMotivo(evento.target.value)}
            placeholder={textosTipo.placeholderMotivo}
            required
            type="text"
            value={motivo}
          />
          {errores.motivo ? <p className="field-error" id={idMotivo + "-error"} role="alert">{errores.motivo}</p> : null}
        </div>
      </div>
      <div className="form-field form-field-full">
        <label htmlFor={"observaciones-" + tipo}>Observaciones adicionales</label>
        <textarea id={"observaciones-" + tipo} onChange={(evento) => setObservaciones(evento.target.value)} rows={2} value={observaciones} />
      </div>
      {errorGeneral ? <AvisoEnLinea ref={referenciaErrorGeneral}>{errorGeneral}</AvisoEnLinea> : null}
      <div className="form-actions">
        <button className="secondary-button" onClick={alCancelar} type="button">Cancelar</button>
        <button className="primary-button" disabled={estaEnviando} type="submit">
          {estaEnviando ? "Guardando…" : textosTipo.confirmar}
        </button>
      </div>
    </form>
  );
}
