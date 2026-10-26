"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Una opción `deshabilitada` se ve, pero no se puede elegir; el `motivo` explica por qué. */
export type OpcionCombobox = { valor: string; etiqueta: string; deshabilitada?: boolean; motivo?: string };

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
  const [respuestaRemota, setRespuestaRemota] = useState<{
    consulta: string;
    buscar: PropiedadesCombobox["buscarOpciones"];
    opciones: OpcionCombobox[];
    fallo: boolean;
  } | null>(null);
  const [opcionElegidaRemota, setOpcionElegidaRemota] = useState<OpcionCombobox | null>(null);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const referenciaEntrada = useRef<HTMLInputElement>(null);
  const idLista = useId();

  useEffect(() => {
    const buscarOpciones = props.buscarOpciones;
    if (!estaAbierto || props.deshabilitado || !buscarOpciones) return;

    let estaVigente = true;
    const temporizador = window.setTimeout(async () => {
      try {
        const resultados = await buscarOpciones(consulta);
        if (estaVigente) setRespuestaRemota({ consulta, buscar: buscarOpciones, opciones: resultados, fallo: false });
      } catch {
        if (estaVigente) setRespuestaRemota({ consulta, buscar: buscarOpciones, opciones: [], fallo: true });
      }
    }, 250);

    return () => {
      estaVigente = false;
      window.clearTimeout(temporizador);
    };
  }, [estaAbierto, consulta, props.buscarOpciones, props.deshabilitado]);

  const respuestaVigente = respuestaRemota?.consulta === consulta && respuestaRemota.buscar === props.buscarOpciones
    ? respuestaRemota : null;
  const opcionesRemotas = respuestaVigente?.opciones ?? null;
  const estaCargando = Boolean(props.buscarOpciones && !respuestaVigente && (consulta !== "" || respuestaRemota !== null));
  const falloBusqueda = respuestaVigente?.fallo ?? false;
  const opcionesBase = estaCargando ? [] : opcionesRemotas ?? props.opciones;
  const textoBuscado = normalizar(consulta.trim());
  const opcionesFiltradas = props.buscarOpciones && opcionesRemotas !== null
    ? opcionesBase
    : opcionesBase.filter((opcion) => normalizar(opcion.etiqueta).includes(textoBuscado));
  const opcionElegida = [...props.opciones, ...(opcionesRemotas ?? []), ...(opcionElegidaRemota ? [opcionElegidaRemota] : [])]
    .find((opcion) => opcion.valor === props.valor);
  const indiceVisible = Math.min(indiceActivo, opcionesFiltradas.length - 1);

  function elegir(opcion: OpcionCombobox) {
    if (opcion.deshabilitada) return;
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
        const paso = evento.key === "ArrowDown" ? 1 : -1;
        let siguiente = actual;
        for (let intento = 0; intento < cantidad; intento += 1) {
          siguiente = (siguiente + paso + cantidad) % cantidad;
          if (!opcionesFiltradas[siguiente].deshabilitada) return siguiente;
        }
        return actual;
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
            setRespuestaRemota(null);
            setIndiceActivo(0);
            setEstaAbierto(true);
          }}
          onFocus={() => {
            setConsulta("");
            setRespuestaRemota(null);
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
          {falloBusqueda ? <p className="combobox-estado" role="alert">No se pudieron cargar las opciones. Volvé a intentar la búsqueda.</p> : null}
          {!estaCargando && !falloBusqueda && opcionesFiltradas.length === 0 ? <p className="combobox-estado">Sin resultados</p> : null}
          {!estaCargando && opcionesFiltradas.map((opcion, indice) => (
            <button
              aria-describedby={opcion.motivo ? `${idLista}-${indice}-motivo` : undefined}
              aria-disabled={opcion.deshabilitada || undefined}
              aria-label={opcion.motivo ? opcion.etiqueta : undefined}
              aria-selected={opcion.valor === props.valor}
              className={[
                "combobox-opcion",
                indice === indiceVisible && !opcion.deshabilitada ? "combobox-opcion-activa" : "",
                opcion.deshabilitada ? "combobox-opcion-deshabilitada" : "",
              ].filter(Boolean).join(" ")}
              id={`${idLista}-${indice}`}
              key={opcion.valor}
              onClick={() => elegir(opcion)}
              onPointerDown={(evento) => { evento.preventDefault(); elegir(opcion); }}
              role="option"
              type="button"
            >
              {opcion.etiqueta}
              {opcion.motivo ? <span className="combobox-opcion-motivo" id={`${idLista}-${indice}-motivo`}>{opcion.motivo}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
