import { useState } from "react";
import type { Repuesto } from "@/tipos/repuesto";

type PropiedadesSelectorRepuestosOrdenTrabajo = {
  repuestos: Repuesto[];
  idsRepuestos: number[];
  alCambiarIdsRepuestos: (idsRepuestos: number[]) => void;
};

export function SelectorRepuestosOrdenTrabajo(props: PropiedadesSelectorRepuestosOrdenTrabajo) {
  const [repuestoParaAgregarId, setRepuestoParaAgregarId] = useState("");

  function cambiarRepuestoParaAgregar(evento: React.ChangeEvent<HTMLSelectElement>) {
    setRepuestoParaAgregarId(evento.target.value);
  }

  function agregarRepuesto() {
    if (repuestoParaAgregarId === "") {
      return;
    }

    const nuevosIdsRepuestos: number[] = [];
    for (const idRepuesto of props.idsRepuestos) {
      nuevosIdsRepuestos.push(idRepuesto);
    }
    nuevosIdsRepuestos.push(Number(repuestoParaAgregarId));

    props.alCambiarIdsRepuestos(nuevosIdsRepuestos);
    setRepuestoParaAgregarId("");
  }

  function quitarRepuesto(repuestoId: number) {
    const nuevosIdsRepuestos: number[] = [];
    for (const idRepuesto of props.idsRepuestos) {
      if (idRepuesto !== repuestoId) {
        nuevosIdsRepuestos.push(idRepuesto);
      }
    }

    props.alCambiarIdsRepuestos(nuevosIdsRepuestos);
  }

  const repuestosSeleccionados: Repuesto[] = [];
  const repuestosDisponibles: Repuesto[] = [];
  for (const repuesto of props.repuestos) {
    let estaSeleccionado = false;
    for (const idRepuesto of props.idsRepuestos) {
      if (idRepuesto === repuesto.id) {
        estaSeleccionado = true;
      }
    }

    if (estaSeleccionado) {
      repuestosSeleccionados.push(repuesto);
    } else if (repuesto.estado === "activo") {
      repuestosDisponibles.push(repuesto);
    }
  }

  let botonAgregarDeshabilitado = false;
  if (repuestoParaAgregarId === "") {
    botonAgregarDeshabilitado = true;
  }

  return (
    <div className="form-field form-field-full">
      <label>Repuestos</label>
      <ul className="flex flex-col gap-2 text-sm">
        {repuestosSeleccionados.map((repuesto) => (
          <li className="flex items-center gap-4" key={repuesto.id}>
            <span>{repuesto.codigo + " - " + repuesto.nombre}</span>
            <button
              className="table-action-link table-action-link-danger"
              onClick={() => quitarRepuesto(repuesto.id)}
              type="button"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      <select aria-label="Repuesto para agregar" onChange={cambiarRepuestoParaAgregar} value={repuestoParaAgregarId}>
        <option value="">Seleccioná un repuesto</option>
        {repuestosDisponibles.map((repuesto) => (
          <option key={repuesto.id} value={repuesto.id}>{repuesto.codigo + " - " + repuesto.nombre}</option>
        ))}
      </select>
      <div>
        <button
          className="secondary-button"
          disabled={botonAgregarDeshabilitado}
          onClick={agregarRepuesto}
          type="button"
        >
          Agregar repuesto
        </button>
      </div>
    </div>
  );
}
