"use client";

import { useState } from "react";
import { useAvisos } from "@/componentes/avisos";
import { FormularioCliente } from "@/componentes/formulario-cliente";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { Modal } from "@/componentes/modal";
import { crearClienteAccion } from "./acciones";

/** Botón de alta y modal con el formulario; al guardar, la Server Action ya revalidó el listado. */
export function AltaCliente() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const { mostrarAviso } = useAvisos();

  return (
    <>
      <button className="primary-button" onClick={() => setEstaAbierto(true)} type="button">
        Registrar nuevo cliente
      </button>
      <Modal alCerrar={() => setEstaAbierto(false)} estaAbierto={estaAbierto} titulo="Registrar nuevo cliente">
        <div className="form-panel">
          <FormularioCliente
            accion={crearClienteAccion}
            alCancelar={() => setEstaAbierto(false)}
            alGuardar={(cliente) => {
              setEstaAbierto(false);
              marcarCreado("clientes", cliente.id);
              mostrarAviso("exito", "Cliente registrado.");
            }}
            etiquetaConfirmacion="Confirmar registro"
          />
        </div>
      </Modal>
    </>
  );
}
