"use client";

import { useRef, useState } from "react";
import { BloqueDeDatos, useDatos } from "@/componentes/use-datos";
import { apiGuardarUmbralEtapa, apiObtenerUmbralesEtapa } from "@/servicios/api/api-demoras-etapas";
import { NOMBRES_ETAPA, type UmbralEtapa } from "@/tipos/demoras-etapas";

function FilaUmbral({ datos }: { datos: UmbralEtapa }) {
  const [texto, setTexto] = useState(datos.umbralHoras === null ? "" : String(datos.umbralHoras));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [hayError, setHayError] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const id = "umbral-" + datos.etapa;
  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const valor = texto.trim() === "" ? null : Number(texto.trim().replace(",", "."));
    if (valor !== null && (!Number.isFinite(valor) || valor < 0)) {
      setMensaje("Ingresá un número de horas no negativo o dejá vacío para usar el promedio histórico.");
      setHayError(true); entrada.current?.focus(); return;
    }
    setGuardando(true); setMensaje("");
    try {
      const guardado = await apiGuardarUmbralEtapa(datos.etapa, valor);
      setTexto(guardado.umbralHoras === null ? "" : String(guardado.umbralHoras));
      setHayError(false); setMensaje(guardado.umbralHoras === null ? "Guardado. Se usará el promedio histórico." : "Umbral guardado.");
    } catch (error) {
      setHayError(true); setMensaje(error instanceof Error ? error.message : "No se pudo guardar el umbral.");
    } finally { setGuardando(false); }
  }
  return <form className="panel regla-aviso" aria-label={NOMBRES_ETAPA[datos.etapa]} onSubmit={guardar} noValidate>
    <h2>{NOMBRES_ETAPA[datos.etapa]}</h2><div className="form-field"><label htmlFor={id}>Umbral en horas — {NOMBRES_ETAPA[datos.etapa]}</label>
      <input aria-describedby={id + "-ayuda"} aria-invalid={hayError || undefined} disabled={guardando} id={id} inputMode="decimal" ref={entrada} value={texto} onChange={evento => { setTexto(evento.target.value); setMensaje(""); setHayError(false); }} />
      <small id={id + "-ayuda"}>Vacío: promedio histórico. Podés ingresar fracciones de hora; 24 horas equivalen a un día.</small>
    </div>
    {mensaje ? <p role={hayError ? "alert" : "status"} className={hayError ? "field-error" : "texto-tenue"}>{mensaje}</p> : null}
    <div className="form-actions"><button className="primary-button" disabled={guardando} type="submit">{guardando ? "Guardando…" : "Guardar"}</button></div>
  </form>;
}

export function FormularioUmbralesEtapa() {
  const consulta = useDatos(apiObtenerUmbralesEtapa, "umbrales-etapa");
  return <BloqueDeDatos cargando="Cargando los umbrales…" {...consulta}>{datos => <div className="grid gap-4">{datos.map(item => <FilaUmbral datos={item} key={item.etapa} />)}</div>}</BloqueDeDatos>;
}
