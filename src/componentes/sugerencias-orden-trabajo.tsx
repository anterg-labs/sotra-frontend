import { useRef, useState } from "react";
import {
  guardarSugerenciasTemporales,
  solicitarSugerenciaOrdenTrabajo,
} from "@/servicios/servicio-ordenes-trabajo";
import type { SolicitarSugerenciaInput } from "@/tipos/orden-trabajo";

type PropiedadesSugerenciasOrdenTrabajo = {
  descripcion: string;
  activoId: string;
  sesion: string;
  sugerencias: string[];
  claveSugerenciasTemporales: string;
  alCambiarSugerencias: (sugerencias: string[]) => void;
};

export function SugerenciasOrdenTrabajo(props: PropiedadesSugerenciasOrdenTrabajo) {
  const [cantidadSolicitudes, setCantidadSolicitudes] = useState(props.sugerencias.length);
  const [estaSolicitandoSugerencia, setEstaSolicitandoSugerencia] = useState(false);
  const [errorSugerencia, setErrorSugerencia] = useState("");
  const [asistenteNoDisponible, setAsistenteNoDisponible] = useState(false);
  const referenciaError = useRef<HTMLParagraphElement>(null);

  function actualizarSugerencias(nuevasSugerencias: string[]) {
    props.alCambiarSugerencias(nuevasSugerencias);
    if (props.claveSugerenciasTemporales !== "") {
      guardarSugerenciasTemporales(props.claveSugerenciasTemporales, nuevasSugerencias);
    }
  }

  async function obtenerTextoSugerencia() {
    const datosSugerencia: SolicitarSugerenciaInput = {
      descripcion: props.descripcion,
      numero: cantidadSolicitudes + 1,
      sesion: props.sesion,
      activoId: props.activoId === "" ? null : Number(props.activoId),
    };

    const sugerenciaObtenida = await solicitarSugerenciaOrdenTrabajo(datosSugerencia);
    setCantidadSolicitudes(cantidadSolicitudes + 1);
    setAsistenteNoDisponible(sugerenciaObtenida.sinIa);
    return sugerenciaObtenida.texto;
  }

  function mostrarErrorSugerencia(error: unknown) {
    if (error instanceof Error) {
      setErrorSugerencia(error.message);
    } else {
      setErrorSugerencia("No se pudo obtener la sugerencia.");
    }
    window.requestAnimationFrame(() => referenciaError.current?.focus());
  }

  async function pedirSugerencia() {
    setEstaSolicitandoSugerencia(true);
    setErrorSugerencia("");
    setAsistenteNoDisponible(false);

    try {
      const textoObtenido = await obtenerTextoSugerencia();
      const nuevasSugerencias: string[] = [];
      for (const textoSugerencia of props.sugerencias) {
        nuevasSugerencias.push(textoSugerencia);
      }
      nuevasSugerencias.push(textoObtenido);
      actualizarSugerencias(nuevasSugerencias);
    } catch (error) {
      mostrarErrorSugerencia(error);
    } finally {
      setEstaSolicitandoSugerencia(false);
    }
  }

  async function volverAPedirSugerencia(indiceSugerencia: number) {
    setEstaSolicitandoSugerencia(true);
    setErrorSugerencia("");
    setAsistenteNoDisponible(false);

    try {
      const textoObtenido = await obtenerTextoSugerencia();
      const nuevasSugerencias: string[] = [];
      for (let indice = 0; indice < props.sugerencias.length; indice++) {
        if (indice === indiceSugerencia) {
          nuevasSugerencias.push(textoObtenido);
        } else {
          nuevasSugerencias.push(props.sugerencias[indice]);
        }
      }
      actualizarSugerencias(nuevasSugerencias);
    } catch (error) {
      mostrarErrorSugerencia(error);
    } finally {
      setEstaSolicitandoSugerencia(false);
    }
  }

  function cambiarTextoSugerencia(indiceSugerencia: number, textoNuevo: string) {
    const nuevasSugerencias: string[] = [];
    for (let indice = 0; indice < props.sugerencias.length; indice++) {
      if (indice === indiceSugerencia) {
        nuevasSugerencias.push(textoNuevo);
      } else {
        nuevasSugerencias.push(props.sugerencias[indice]);
      }
    }

    actualizarSugerencias(nuevasSugerencias);
  }

  function quitarSugerencia(indiceSugerencia: number) {
    const nuevasSugerencias: string[] = [];
    for (let indice = 0; indice < props.sugerencias.length; indice++) {
      if (indice !== indiceSugerencia) {
        nuevasSugerencias.push(props.sugerencias[indice]);
      }
    }

    actualizarSugerencias(nuevasSugerencias);
  }

  let textoBotonSugerencia = "Solicitar sugerencia";
  if (estaSolicitandoSugerencia) {
    textoBotonSugerencia = "Solicitando…";
  }

  let mensajeBuscandoSugerencia = null;
  if (estaSolicitandoSugerencia) {
    mensajeBuscandoSugerencia = (
      <p className="empty-state">
        El sistema está buscando la sugerencia en la documentación técnica. Puede tardar unos segundos…
      </p>
    );
  }

  return (
    <>
      <div className="form-field form-field-full">
        <label>Sugerencias</label>
        <div>
          <button
            className="secondary-button"
            disabled={estaSolicitandoSugerencia}
            onClick={pedirSugerencia}
            type="button"
          >
            {textoBotonSugerencia}
          </button>
        </div>
        {mensajeBuscandoSugerencia}
        {asistenteNoDisponible ? (
          <p className="aviso-sin-ia" role="status">
            El asistente de IA no está disponible en este momento. Se muestra el texto original del manual, sin resumir.
            Verificá los valores con la fuente indicada.
          </p>
        ) : null}
        {errorSugerencia ?<p className="field-error" ref={referenciaError} role="alert" tabIndex={-1}>{errorSugerencia}</p> : null}
      </div>

      {props.sugerencias.map((textoSugerencia, indice) => (
        <div className="form-field form-field-full" key={indice}>
          <label htmlFor={"sugerencia-" + indice}>{"Sugerencia " + (indice + 1)}</label>
          <textarea
            id={"sugerencia-" + indice}
            onChange={(evento) => cambiarTextoSugerencia(indice, evento.target.value)}
            rows={9}
            value={textoSugerencia}
          />
          <div className="flex gap-4">
            <button
              className="table-action-link"
              disabled={estaSolicitandoSugerencia}
              onClick={() => volverAPedirSugerencia(indice)}
              type="button"
            >
              Volver a solicitar
            </button>
            <button
              className="table-action-link table-action-link-danger"
              onClick={() => quitarSugerencia(indice)}
              type="button"
            >
              Quitar sugerencia
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
