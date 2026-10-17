"use client";

import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { FormularioRepuesto } from "@/componentes/formulario-repuesto";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { Modal } from "@/componentes/modal";
import { crearRepuestoAccion } from "./acciones";

/** Botón de alta y modal con el formulario; al guardar, la Server Action ya revalidó el listado. */
export function AltaRepuesto() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const { mostrarAviso } = useAvisos();

  return (
    <>
      <button className="primary-button" onClick={() => setEstaAbierto(true)} type="button">
        Registrar repuesto
      </button>
      <Modal alCerrar={() => setEstaAbierto(false)} estaAbierto={estaAbierto} titulo="Registrar repuesto">
        <div className="form-panel">
          <FormularioRepuesto
            accion={crearRepuestoAccion}
            alCancelar={() => setEstaAbierto(false)}
            alGuardar={(repuesto) => {
              setEstaAbierto(false);
              marcarCreado("repuestos", repuesto.id);
              mostrarAviso("exito", "Repuesto registrado.");
            }}
            etiquetaConfirmacion="Confirmar registro"
          />
        </div>
      </Modal>
    </>
  );
}
