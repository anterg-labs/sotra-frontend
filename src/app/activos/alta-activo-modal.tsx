"use client";

import { useState } from "react";
import { AltaActivo } from "@/componentes/alta-activo";
import { useAvisos } from "@/componentes/avisos";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { Modal } from "@/componentes/modal";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";

/** Botón de alta y modal con el formulario; al guardar, la Server Action ya revalidó el listado. */
export function AltaActivoModal(props: { clientes: Cliente[] | null; modelosMaquina: ModeloMaquina[] | null }) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const { mostrarAviso } = useAvisos();

  return (
    <>
      <button className="primary-button" onClick={() => setEstaAbierto(true)} type="button">
        Registrar nuevo activo
      </button>
      <Modal alCerrar={() => setEstaAbierto(false)} estaAbierto={estaAbierto} titulo="Registrar nuevo activo">
        <div className="form-panel">
          <AltaActivo
            alCancelar={() => setEstaAbierto(false)}
            alGuardar={(activo) => {
              setEstaAbierto(false);
              marcarCreado("activos", activo.id);
              mostrarAviso("exito", "Activo registrado.");
            }}
            clientes={props.clientes}
            modelosMaquina={props.modelosMaquina}
          />
        </div>
      </Modal>
    </>
  );
}
