"use client";

import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { FormularioTipoMaquina } from "@/componentes/formulario-tipo-maquina";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { Modal } from "@/componentes/modal";
import { crearTipoMaquinaAccion } from "./acciones";

/** Botón de alta y modal con el formulario; al guardar, la Server Action ya revalidó el listado. */
export function AltaTipo() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const { mostrarAviso } = useAvisos();

  return (
    <>
      <button className="primary-button" onClick={() => setEstaAbierto(true)} type="button">
        Registrar tipo
      </button>
      <Modal alCerrar={() => setEstaAbierto(false)} estaAbierto={estaAbierto} titulo="Registrar nuevo tipo de máquina">
        <div className="form-panel">
          <FormularioTipoMaquina
            accion={crearTipoMaquinaAccion}
            alCancelar={() => setEstaAbierto(false)}
            alGuardar={(tipo) => {
              setEstaAbierto(false);
              marcarCreado("tipos-maquina", tipo.id);
              mostrarAviso("exito", "Tipo de máquina registrado.");
            }}
            etiquetaConfirmacion="Confirmar registro"
          />
        </div>
      </Modal>
    </>
  );
}
