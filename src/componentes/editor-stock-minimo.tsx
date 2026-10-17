"use client";

import { useState } from "react";
import { actualizarStockMinimoAccion } from "@/app/repuestos/acciones";
import { useFormularioAccion } from "@/componentes/use-formulario-accion";
import type { Repuesto } from "@/tipos/repuesto";
import { obtenerErrorStockMinimo } from "@/validaciones/repuesto";

type PropiedadesEditorStockMinimo = {
  repuestoId: number;
  cantidadMinima: number;
  alActualizar: (repuesto: Repuesto) => void;
};

/** Edición rápida del stock mínimo: solo cambia ese dato, sin pasar por el formulario completo del repuesto. */
export function EditorStockMinimo({ repuestoId, cantidadMinima, alActualizar }: PropiedadesEditorStockMinimo) {
  const [estaEditando, setEstaEditando] = useState(false);
  const [valor, setValor] = useState(String(cantidadMinima));

  const { errores, errorGeneral, estaEnviando, enviar } = useFormularioAccion({
    validar: (numero: number) => {
      const error = obtenerErrorStockMinimo(numero);
      return error ? { cantidadMinima: error } : {};
    },
    accion: (numero: number) => actualizarStockMinimoAccion(repuestoId, numero),
    alExito: (repuesto: Repuesto) => {
      alActualizar(repuesto);
      setEstaEditando(false);
    },
    mensajeGeneral: "No se pudo actualizar el stock mínimo.",
    idCampo: () => "stockMinimoEdicion",
  });
  const error = errores.cantidadMinima ?? errorGeneral;

  function abrir() {
    setValor(String(cantidadMinima));
    setEstaEditando(true);
    window.requestAnimationFrame(() => document.getElementById("stockMinimoEdicion")?.focus());
  }

  function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    enviar(valor.trim() === "" ? Number.NaN : Number(valor));
  }

  if (!estaEditando) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        {cantidadMinima}
        <button className="text-link" onClick={abrir} type="button">Cambiar mínimo</button>
      </span>
    );
  }

  return (
    <form className="flex flex-wrap items-start gap-2" noValidate onSubmit={guardar}>
      <span className="form-field">
        <label className="sr-only" htmlFor="stockMinimoEdicion">Stock mínimo</label>
        <input
          aria-describedby={error ? "stockMinimoEdicion-error" : undefined}
          aria-invalid={error ? true : undefined}
          id="stockMinimoEdicion"
          inputMode="numeric"
          min={0}
          onChange={(evento) => setValor(evento.target.value)}
          step={1}
          type="number"
          value={valor}
        />
        {error ? <span className="field-error" id="stockMinimoEdicion-error" role="alert">{error}</span> : null}
      </span>
      <button className="primary-button" disabled={estaEnviando} type="submit">{estaEnviando ? "Guardando…" : "Guardar"}</button>
      <button className="secondary-button" onClick={() => setEstaEditando(false)} type="button">Cancelar</button>
    </form>
  );
}
