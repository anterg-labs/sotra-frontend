"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { OpcionCombobox } from "./combobox";

type PropiedadesComboboxMultiple = {
  id: string;
  etiqueta: string;
  opciones: OpcionCombobox[];
  valores: string[];
  alCambiar: (valores: string[]) => void;
  textoVacio?: string;
  buscarOpciones?: (consulta: string) => Promise<OpcionCombobox[]>;
};

export function ComboboxMultiple(props: PropiedadesComboboxMultiple) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [opcionesRemotas, setOpcionesRemotas] = useState<OpcionCombobox[] | null>(null);
  const [opcionesRecordadas, setOpcionesRecordadas] = useState<OpcionCombobox[]>([]);
  const [estaCargando, setEstaCargando] = useState(false);
  const referenciaEntrada = useRef<HTMLInputElement>(null);
  const idLista = useId();
  const textoBuscado = consulta.trim().normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
  useEffect(() => {
    const buscarOpciones = props.buscarOpciones;
    if (!estaAbierto || !buscarOpciones) return;

    let estaVigente = true;
    const temporizador = window.setTimeout(async () => {
      setEstaCargando(true);
      try {
        const resultados = await buscarOpciones(consulta);
        if (estaVigente) setOpcionesRemotas(resultados);
      } catch {
        if (estaVigente) setOpcionesRemotas([]);
      } finally {
        if (estaVigente) setEstaCargando(false);
      }
    }, 250);

    return () => {
      estaVigente = false;
      window.clearTimeout(temporizador);
    };
  }, [estaAbierto, consulta, props.buscarOpciones]);

  const opcionesBase = props.buscarOpciones && opcionesRemotas !== null ? opcionesRemotas : props.opciones;
  const opcionesFiltradas = props.buscarOpciones && opcionesRemotas !== null
    ? opcionesBase
    : opcionesBase.filter((opcion) =>
      opcion.etiqueta.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").includes(textoBuscado),
    );
  const indiceVisible = Math.min(indiceActivo, opcionesFiltradas.length - 1);

  function alternar(opcion: OpcionCombobox) {
    const valor = opcion.valor;
    setOpcionesRecordadas((actuales) => actuales.some((actual) => actual.valor === valor) ? actuales : [...actuales, opcion]);
    const estaSeleccionado = props.valores.includes(valor);
    props.alCambiar(estaSeleccionado
      ? props.valores.filter((seleccionado) => seleccionado !== valor)
      : [...props.valores, valor]);
    setConsulta("");
    referenciaEntrada.current?.focus();
    setEstaAbierto(true);
  }

  function manejarTeclado(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      setEstaAbierto(true);
      setIndiceActivo((actual) => opcionesFiltradas.length === 0 ? 0 :
        evento.key === "ArrowDown"
          ? (actual + 1) % opcionesFiltradas.length
          : (actual - 1 + opcionesFiltradas.length) % opcionesFiltradas.length);
    } else if (evento.key === "Enter" && estaAbierto) {
      evento.preventDefault();
      if (indiceVisible >= 0) alternar(opcionesFiltradas[indiceVisible]);
    } else if (evento.key === "Escape") {
      setEstaAbierto(false);
      setConsulta("");
    }
  }

  return (
    <div className="form-field combobox" onBlur={(evento) => {
      if (!evento.currentTarget.contains(evento.relatedTarget)) {
        setEstaAbierto(false);
        setConsulta("");
      }
    }}>
      <label htmlFor={props.id}>{props.etiqueta}</label>
      {props.valores.length > 0 ? (
        <ul aria-label={`${props.etiqueta} seleccionados`} className="combobox-etiquetas">
          {props.valores.map((valor) => {
            const opcion = [...props.opciones, ...opcionesRecordadas].find((actual) => actual.valor === valor);
            return opcion ? (
              <li className="combobox-etiqueta" key={valor}>
                {opcion.etiqueta}
                <button aria-label={`Quitar ${opcion.etiqueta}`} onClick={() => alternar(opcion)} type="button">×</button>
              </li>
            ) : null;
          })}
        </ul>
      ) : null}
      <input
        aria-activedescendant={estaAbierto && indiceVisible >= 0 ? `${idLista}-${indiceVisible}` : undefined}
        aria-autocomplete="list"
        aria-controls={idLista}
        aria-expanded={estaAbierto}
        aria-haspopup="listbox"
        autoComplete="off"
        id={props.id}
        onChange={(evento) => {
          setConsulta(evento.target.value);
          setIndiceActivo(0);
          setEstaAbierto(true);
        }}
        onFocus={() => {
          setOpcionesRemotas(null);
          setEstaAbierto(true);
        }}
        onKeyDown={manejarTeclado}
        placeholder={props.textoVacio ?? "Buscar y seleccionar"}
        ref={referenciaEntrada}
        role="combobox"
        type="text"
        value={consulta}
      />
      {estaAbierto ? (
        <div aria-multiselectable="true" className="combobox-panel" id={idLista} role="listbox">
          {estaCargando ? <p className="combobox-estado">Buscando…</p> : null}
          {!estaCargando && opcionesFiltradas.length === 0 ? <p className="combobox-estado">Sin resultados</p> : null}
          {!estaCargando && opcionesFiltradas.map((opcion, indice) => (
            <button
              aria-selected={props.valores.includes(opcion.valor)}
              className={indice === indiceVisible ? "combobox-opcion combobox-opcion-activa" : "combobox-opcion"}
              id={`${idLista}-${indice}`}
              key={opcion.valor}
              onClick={() => alternar(opcion)}
              role="option"
              type="button"
            >{props.valores.includes(opcion.valor) ? "✓ " : ""}{opcion.etiqueta}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
