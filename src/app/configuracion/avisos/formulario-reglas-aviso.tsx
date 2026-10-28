"use client";

import { useState } from "react";
import { apiActualizarReglaAviso } from "@/servicios/api/api-reportes";
import type { ReglaAviso } from "@/tipos/reporte";

export type BorradorDeRegla = {
  activa: boolean;
  umbral: string;
  umbralCritico: string;
  ventanaDias: string;
  ventanaCriticaDias: string;
  minimoDatos: string;
};

function aBorrador(regla: ReglaAviso): BorradorDeRegla {
  return {
    activa: regla.activa,
    umbral: String(regla.umbral),
    umbralCritico: regla.umbralCritico === null ? "" : String(regla.umbralCritico),
    ventanaDias: regla.ventanaDias === null ? "" : String(regla.ventanaDias),
    ventanaCriticaDias: regla.ventanaCriticaDias === null ? "" : String(regla.ventanaCriticaDias),
    minimoDatos: String(regla.minimoDatos),
  };
}

const numero = (texto: string) => Number(texto.trim().replace(",", "."));
const opcional = (texto: string) => (texto.trim() === "" ? null : numero(texto));

/** Valida el borrador como el servidor: umbrales numéricos (sin límites fijos), ventanas enteras mayores que cero y mínimo de datos entero. */
export function validarBorrador(borrador: BorradorDeRegla): string {
  if (borrador.umbral.trim() === "" || !Number.isFinite(numero(borrador.umbral))) return "El umbral debe ser un número.";
  const critico = opcional(borrador.umbralCritico);
  if (critico !== null && !Number.isFinite(critico)) return "El umbral crítico debe ser un número.";
  const ventanas = [
    [borrador.ventanaDias, "La ventana"],
    [borrador.ventanaCriticaDias, "La ventana crítica"],
  ] as const;
  for (const [texto, nombre] of ventanas) {
    const valor = opcional(texto);
    if (valor !== null && (!Number.isInteger(valor) || valor <= 0)) return nombre + " debe ser un número entero de días mayor que cero.";
  }
  const minimo = numero(borrador.minimoDatos);
  if (borrador.minimoDatos.trim() === "" || !Number.isInteger(minimo) || minimo < 0) {
    return "El mínimo de datos debe ser un número entero de cero en adelante.";
  }
  return "";
}

function FilaRegla({ regla }: { regla: ReglaAviso }) {
  const [borrador, setBorrador] = useState(aBorrador(regla));
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const id = "regla-" + regla.codigo;

  function cambiar(cambios: Partial<BorradorDeRegla>) {
    setBorrador((actual) => ({ ...actual, ...cambios }));
    setMensaje("");
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const error = validarBorrador(borrador);
    if (error) {
      setMensaje(error);
      setEsError(true);
      return;
    }
    setGuardando(true);
    try {
      const guardada = await apiActualizarReglaAviso(regla.codigo, {
        activa: borrador.activa,
        umbral: numero(borrador.umbral),
        umbralCritico: opcional(borrador.umbralCritico),
        ventanaDias: opcional(borrador.ventanaDias),
        ventanaCriticaDias: opcional(borrador.ventanaCriticaDias),
        minimoDatos: numero(borrador.minimoDatos),
      });
      setBorrador(aBorrador(guardada));
      setMensaje("Regla guardada.");
      setEsError(false);
    } catch (excepcion) {
      setMensaje(excepcion instanceof Error ? excepcion.message : "No se pudo guardar la regla de aviso.");
      setEsError(true);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form aria-labelledby={id + "-titulo"} className="panel regla-aviso" noValidate onSubmit={guardar}>
      <h2 id={id + "-titulo"}>{regla.codigo + " · " + regla.nombre}</h2>
      <div className="form-grid">
        <label className="calendario-casilla" htmlFor={id + "-activa"}>
          <input checked={borrador.activa} id={id + "-activa"} onChange={(evento) => cambiar({ activa: evento.target.checked })} type="checkbox" />
          Regla encendida
        </label>
        <div className="form-field">
          <label htmlFor={id + "-umbral"}>Umbral de atención</label>
          <input id={id + "-umbral"} inputMode="decimal" onChange={(evento) => cambiar({ umbral: evento.target.value })} value={borrador.umbral} />
        </div>
        <div className="form-field">
          <label htmlFor={id + "-critico"}>Umbral crítico (opcional)</label>
          <input id={id + "-critico"} inputMode="decimal" onChange={(evento) => cambiar({ umbralCritico: evento.target.value })} value={borrador.umbralCritico} />
        </div>
        <div className="form-field">
          <label htmlFor={id + "-ventana"}>Ventana en días (opcional)</label>
          <input id={id + "-ventana"} inputMode="numeric" onChange={(evento) => cambiar({ ventanaDias: evento.target.value })} value={borrador.ventanaDias} />
        </div>
        <div className="form-field">
          <label htmlFor={id + "-ventana-critica"}>Ventana crítica en días (opcional)</label>
          <input id={id + "-ventana-critica"} inputMode="numeric" onChange={(evento) => cambiar({ ventanaCriticaDias: evento.target.value })} value={borrador.ventanaCriticaDias} />
        </div>
        <div className="form-field">
          <label htmlFor={id + "-minimo"}>Mínimo de datos</label>
          <input id={id + "-minimo"} inputMode="numeric" onChange={(evento) => cambiar({ minimoDatos: evento.target.value })} value={borrador.minimoDatos} />
        </div>
      </div>
      {mensaje ? <p className={esError ? "field-error" : "texto-tenue"} role={esError ? "alert" : "status"}>{mensaje}</p> : null}
      <div className="form-actions">
        <button className="primary-button" disabled={guardando} type="submit">{guardando ? "Guardando…" : "Guardar"}</button>
      </div>
    </form>
  );
}

export function FormularioReglasAviso({ reglas }: { reglas: ReglaAviso[] }) {
  return (
    <div className="grid gap-4">
      {reglas.map((regla) => <FilaRegla key={regla.codigo} regla={regla} />)}
    </div>
  );
}
