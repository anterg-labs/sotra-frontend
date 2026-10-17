"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { obtenerTerminosVigentesAccion } from "@/app/terminos/acciones";
import { useAceptacionGuardada } from "@/hooks/use-aceptacion-terminos";
import { guardarAceptacion } from "@/utilidades/aceptacion-terminos";
import type { ResultadoTerminosVigentes } from "@/tipos/terminos";
import { DialogoTerminos } from "./dialogo-terminos";

const LecturaTerminos = dynamic(() => import("./lectura-terminos").then((modulo) => modulo.LecturaTerminos), {
  loading: () => <p role="status">Cargando el documento…</p>,
});

export const EVENTO_TERMINOS_PUBLICADOS = "sotra:terminos-publicados";

/** Consulta manual desde el footer: no solicita el documento ni abre el modal en segundo plano. */
export function BotonTerminos() {
  const aceptacion = useAceptacionGuardada();
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [resultado, setResultado] = useState<ResultadoTerminosVigentes | null>(null);
  const consultaActual = useRef(0);

  useEffect(() => () => { consultaActual.current += 1; }, []);

  async function consultar() {
    const consulta = ++consultaActual.current;
    setResultado(null);
    const respuesta = await obtenerTerminosVigentesAccion().catch((): ResultadoTerminosVigentes => ({ estado: "error" }));
    if (consulta === consultaActual.current) setResultado(respuesta);
  }

  function cerrar() {
    consultaActual.current += 1;
    setEstaAbierto(false);
  }

  const terminos = resultado?.estado === "listo" ? resultado.terminos : null;
  const requiereAceptacion = terminos !== null && (aceptacion?.terminosId !== terminos.id || aceptacion?.version !== terminos.version);

  async function aceptar() {
    if (!terminos) return;
    const consulta = ++consultaActual.current;
    const vigente = await obtenerTerminosVigentesAccion();
    if (consulta !== consultaActual.current) throw new Error("La versión debe comprobarse nuevamente.");
    if (vigente.estado !== "listo") throw new Error("No se pudo verificar la versión vigente.");
    setResultado(vigente);
    if (vigente.terminos.id !== terminos.id || vigente.terminos.version !== terminos.version) return;
    if (!guardarAceptacion({ terminosId: terminos.id, version: terminos.version, aceptadoEn: new Date().toISOString() })) throw new Error("Almacenamiento no disponible.");
    cerrar();
  }

  return <>
    <button className="app-pie-enlace" onClick={() => { setEstaAbierto(true); void consultar(); }} type="button">Términos y condiciones</button>
    <DialogoTerminos alCerrar={cerrar} estaAbierto={estaAbierto} obligatorio={requiereAceptacion}>
      {resultado === null ? <p aria-busy="true" role="status">Cargando los términos y condiciones…</p> : null}
      {resultado?.estado === "error" ? <div className="grid gap-3"><p className="form-error-banner" role="alert">No se pudieron obtener los términos y condiciones.</p><button className="secondary-button" onClick={() => { void consultar(); }} type="button">Reintentar</button></div> : null}
      {resultado?.estado === "vacio" ? <p className="empty-state">Todavía no hay términos publicados.</p> : null}
      {terminos ? <LecturaTerminos alAceptar={aceptar} key={terminos.id + ":" + terminos.version + ":" + requiereAceptacion} requiereAceptacion={requiereAceptacion} terminos={terminos} /> : null}
    </DialogoTerminos>
  </>;
}
