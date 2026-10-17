"use client";

import { useEffect, useId, useRef, useState } from "react";

export type OpcionCombobox = { valor: string; etiqueta: string };

type PropiedadesCombobox = {
  id: string;
  etiqueta: string;
  opciones: OpcionCombobox[];
  valor: string;
  alCambiar: (valor: string) => void;
  textoVacio?: string;
  requerido?: boolean;
  deshabilitado?: boolean;
  idError?: string;
  tieneError?: boolean;
  buscarOpciones?: (consulta: string) => Promise<OpcionCombobox[]>;
};

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

export function Combobox(props: PropiedadesCombobox) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [opcionesRemotas, setOpcionesRemotas] = useState<OpcionCombobox[] | null>(null);
  const [opcionElegidaRemota, setOpcionElegidaRemota] = useState<OpcionCombobox | null>(null);
  const [estaCargando, setEstaCargando] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const referenciaEntrada = useRef<HTMLInputElement>(null);
  const idLista = useId();

  useEffect(() => {
    const buscarOpciones = props.buscarOpciones;
    if (!estaAbierto || props.deshabilitado || !buscarOpciones) return;

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
  }, [estaAbierto, consulta, props.buscarOpciones, props.deshabilitado]);

  const opcionesBase = props.buscarOpciones && opcionesRemotas !== null ? opcionesRemotas : props.opciones;
  const textoBuscado = normalizar(consulta.trim());
  const opcionesFiltradas = props.buscarOpciones && opcionesRemotas !== null
    ? opcionesBase
    : opcionesBase.filter((opcion) => normalizar(opcion.etiqueta).includes(textoBuscado));
  const opcionElegida = [...props.opciones, ...(opcionesRemotas ?? []), ...(opcionElegidaRemota ? [opcionElegidaRemota] : [])]
    .find((opcion) => opcion.valor === props.valor);
  const indiceVisible = Math.min(indiceActivo, opcionesFiltradas.length - 1);

  function elegir(opcion: OpcionCombobox) {
    props.alCambiar(opcion.valor);
    setOpcionElegidaRemota(opcion);
    setConsulta("");
    referenciaEntrada.current?.focus();
    setEstaAbierto(false);
  }

  function manejarTeclado(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();
      setEstaAbierto(true);
      setIndiceActivo((actual) => {
        const cantidad = opcionesFiltradas.length;
        if (cantidad === 0) return 0;
        return evento.key === "ArrowDown" ? (actual + 1) % cantidad : (actual - 1 + cantidad) % cantidad;
      });
    } else if (evento.key === "Enter" && estaAbierto) {
      evento.preventDefault();
      if (indiceVisible >= 0) elegir(opcionesFiltradas[indiceVisible]);
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
      <div className="combobox-entrada">
        <input
          aria-activedescendant={estaAbierto && indiceVisible >= 0 ? `${idLista}-${indiceVisible}` : undefined}
          aria-autocomplete="list"
          aria-controls={idLista}
          aria-describedby={props.idError}
          aria-expanded={estaAbierto}
          aria-haspopup="listbox"
          aria-invalid={props.tieneError || undefined}
          autoComplete="off"
          disabled={props.deshabilitado}
          id={props.id}
          onChange={(evento) => {
            setConsulta(evento.target.value);
            setOpcionesRemotas(null);
            setIndiceActivo(0);
            setEstaAbierto(true);
          }}
          onFocus={() => {
            setConsulta("");
            setOpcionesRemotas(null);
            setEstaAbierto(true);
            setIndiceActivo(0);
          }}
          onKeyDown={manejarTeclado}
          placeholder={props.deshabilitado ? "Seleccioná primero un cliente" : props.textoVacio ?? "Buscar o seleccionar"}
          ref={referenciaEntrada}
          required={props.requerido}
          role="combobox"
          type="text"
          value={estaAbierto ? consulta : opcionElegida?.etiqueta ?? ""}
        />
        {props.valor !== "" ? (
          <button aria-label={`Limpiar ${props.etiqueta}`} className="combobox-limpiar" onClick={() => {
            props.alCambiar("");
            setConsulta("");
            referenciaEntrada.current?.focus();
          }} type="button">×</button>
        ) : null}
      </div>
      {estaAbierto ? (
        <div className="combobox-panel" id={idLista} role="listbox">
          {estaCargando ? <p className="combobox-estado">Buscando…</p> : null}
          {!estaCargando && opcionesFiltradas.length === 0 ? <p className="combobox-estado">Sin resultados</p> : null}
          {!estaCargando && opcionesFiltradas.map((opcion, indice) => (
            <button
              aria-selected={opcion.valor === props.valor}
              className={indice === indiceVisible ? "combobox-opcion combobox-opcion-activa" : "combobox-opcion"}
              id={`${idLista}-${indice}`}
              key={opcion.valor}
              onClick={() => elegir(opcion)}
              onPointerDown={(evento) => { evento.preventDefault(); elegir(opcion); }}
              role="option"
              type="button"
            >{opcion.etiqueta}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
