"use client";

import { useRef, useState } from "react";
import { Combobox } from "@/componentes/combobox";
import { IconoPapelera } from "@/componentes/iconos";
import { listarRepuestosPaginados } from "@/servicios/servicio-repuestos";
import type { Repuesto } from "@/tipos/repuesto";

/** Un repuesto de la orden con la cantidad elegida; `repuesto` trae el stock para limitar el selector numérico. */
export type LineaRepuestoOrden = {
  repuesto: Repuesto;
  cantidad: number;
};

type PropiedadesEditorRepuestosOrden = {
  lineas: LineaRepuestoOrden[];
  alCambiar: (lineas: LineaRepuestoOrden[]) => void;
  /** Unidades que la orden ya tiene reservadas o entregadas de cada repuesto: cuentan como disponibles para ella. */
  cantidadesDeLaOrden?: Record<number, number>;
  deshabilitado?: boolean;
  /** Error del formulario (por ejemplo, el que devolvió la API por falta de stock). */
  mensajeError?: string;
};

/** Máximo que puede pedir la orden de un repuesto: lo disponible más lo que ya tiene reservado o entregado. */
export function cantidadMaximaDeLinea(linea: LineaRepuestoOrden, cantidadesDeLaOrden: Record<number, number> = {}) {
  return linea.repuesto.cantidadDisponible + (cantidadesDeLaOrden[linea.repuesto.id] ?? 0);
}

/** Primer problema de las líneas (cantidad fuera de rango o sin stock); la API vuelve a comprobarlo. */
export function obtenerErrorDeLineas(lineas: LineaRepuestoOrden[], cantidadesDeLaOrden: Record<number, number> = {}) {
  for (const linea of lineas) {
    if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1) {
      return `Indicá una cantidad entera de 1 en adelante para ${linea.repuesto.codigo}.`;
    }
    const maximo = cantidadMaximaDeLinea(linea, cantidadesDeLaOrden);
    if (linea.cantidad > maximo) return mensajeDeFaltante(linea, maximo);
  }
  return "";
}

function mensajeDeFaltante(linea: LineaRepuestoOrden, maximo: number) {
  const { repuesto } = linea;
  const nombre = `${repuesto.codigo} - ${repuesto.nombre}`;
  if (repuesto.cantidad <= 0) return `No hay stock de ${nombre}.`;
  if (maximo <= 0) {
    return `No hay unidades disponibles de ${nombre}: hay ${repuesto.cantidad} en stock, ${repuesto.cantidadReservada} reservadas y ${repuesto.cantidadEntregada} entregadas a otras órdenes.`;
  }
  return `Solo hay ${maximo} disponibles de ${nombre} (stock ${repuesto.cantidad}, ${repuesto.cantidadReservada} reservadas, ${repuesto.cantidadEntregada} entregadas).`;
}

/**
 * Repuestos de una orden con un selector numérico por cantidad. Al agregar uno se ofrece solo lo que tiene unidades
 * disponibles; la cantidad no puede superar lo disponible. El que decide es el servidor (puede haber cambiado el stock).
 */
export function EditorRepuestosOrden(props: PropiedadesEditorRepuestosOrden) {
  const { lineas, alCambiar, deshabilitado = false } = props;
  const cantidadesDeLaOrden = props.cantidadesDeLaOrden ?? {};
  const encontrados = useRef(new Map<number, Repuesto>());
  const [seleccion, setSeleccion] = useState("");
  const [avisoAgregar, setAvisoAgregar] = useState("");

  async function buscar(consulta: string) {
    const pagina = await listarRepuestosPaginados({ buscar: consulta, estado: "activo", ubicacion: "", bajoStock: false, pagina: 1 });
    for (const repuesto of pagina.elementos) encontrados.current.set(repuesto.id, repuesto);
    return pagina.elementos
      .filter((repuesto) => !lineas.some((linea) => linea.repuesto.id === repuesto.id))
      .map((repuesto) => ({
        valor: String(repuesto.id),
        etiqueta: `${repuesto.codigo} - ${repuesto.nombre} (disponibles: ${repuesto.cantidadDisponible})`,
      }));
  }

  function agregar(valor: string) {
    setSeleccion("");
    const repuesto = encontrados.current.get(Number(valor));
    if (!repuesto) return;
    if (repuesto.cantidadDisponible < 1) {
      setAvisoAgregar(mensajeDeFaltante({ repuesto, cantidad: 1 }, 0));
      return;
    }
    setAvisoAgregar("");
    alCambiar([...lineas, { repuesto, cantidad: 1 }]);
  }

  function cambiarCantidad(repuestoId: number, texto: string) {
    const cantidad = texto === "" ? Number.NaN : Number(texto);
    alCambiar(lineas.map((linea) => (linea.repuesto.id === repuestoId ? { ...linea, cantidad } : linea)));
  }

  function quitar(repuestoId: number) {
    alCambiar(lineas.filter((linea) => linea.repuesto.id !== repuestoId));
  }

  return (
    <div className="form-field form-field-full">
      <Combobox
        alCambiar={agregar}
        buscarOpciones={buscar}
        deshabilitado={deshabilitado}
        etiqueta="Agregar repuesto"
        id="repuestos-orden"
        opciones={[]}
        textoVacio="Buscar repuestos"
        valor={seleccion}
      />
      {avisoAgregar ? <p className="field-error" role="alert">{avisoAgregar}</p> : null}
      {lineas.length === 0 ? (
        <p className="texto-tenue">La orden no tiene repuestos.</p>
      ) : (
        <ul aria-label="Repuestos seleccionados" className="grid gap-3">
          {lineas.map((linea) => {
            const maximo = cantidadMaximaDeLinea(linea, cantidadesDeLaOrden);
            const idCampo = `cantidad-repuesto-${linea.repuesto.id}`;
            const hayError = !Number.isInteger(linea.cantidad) || linea.cantidad < 1 || linea.cantidad > maximo;
            return (
              <li className="flex flex-wrap items-center gap-3" key={linea.repuesto.id}>
                <span className="min-w-0 flex-1">
                  {linea.repuesto.codigo} - {linea.repuesto.nombre}
                  <small className="block texto-tenue">
                    Disponibles para esta orden: {maximo} · Stock: {linea.repuesto.cantidad} · Reservadas: {linea.repuesto.cantidadReservada} · Entregadas: {linea.repuesto.cantidadEntregada}
                  </small>
                </span>
                <label className="sr-only" htmlFor={idCampo}>{`Cantidad de ${linea.repuesto.codigo}`}</label>
                <input
                  aria-invalid={hayError ? true : undefined}
                  disabled={deshabilitado}
                  id={idCampo}
                  inputMode="numeric"
                  max={Math.max(maximo, 1)}
                  min={1}
                  onChange={(evento) => cambiarCantidad(linea.repuesto.id, evento.target.value)}
                  step={1}
                  style={{ width: "6rem" }}
                  type="number"
                  value={Number.isNaN(linea.cantidad) ? "" : linea.cantidad}
                />
                <button
                  aria-label={`Quitar ${linea.repuesto.codigo}`}
                  className="boton-icono boton-icono-peligro"
                  disabled={deshabilitado}
                  onClick={() => quitar(linea.repuesto.id)}
                  title="Quitar repuesto"
                  type="button"
                >
                  <IconoPapelera />
                </button>
                {hayError ? <p className="field-error w-full" role="alert">{obtenerErrorDeLineas([linea], cantidadesDeLaOrden)}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
      {props.mensajeError ? <p className="field-error" role="alert">{props.mensajeError}</p> : null}
    </div>
  );
}
