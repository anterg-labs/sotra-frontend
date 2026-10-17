"use client";

/** Interruptor «Activo» de las pantallas de modificación (permite reactivar o dar de baja al guardar). */
export function InterruptorActivo(props: { estaActivo: boolean; alCambiar: (estaActivo: boolean) => void }) {
  return (
    <div className="form-field mb-4">
      <label htmlFor="estaActivo">
        <input
          checked={props.estaActivo}
          id="estaActivo"
          onChange={(evento) => props.alCambiar(evento.target.checked)}
          role="switch"
          type="checkbox"
        />{" "}
        Activo
      </label>
    </div>
  );
}
