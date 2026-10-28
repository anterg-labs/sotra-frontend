"use client";

import { useState } from "react";
import { AltaModeloMaquina } from "@/componentes/alta-modelo-maquina";
import { useAvisos } from "@/componentes/avisos";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { Modal } from "@/componentes/modal";
import type { TipoMaquina } from "@/tipos/tipo-maquina";

/** Botón de alta y modal con el formulario; al guardar, la Server Action ya revalidó el listado. */
export function AltaModelo(props: { tiposMaquina: TipoMaquina[] | null }) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const { mostrarAviso } = useAvisos();

  return (
    <>
      <button className="primary-button" onClick={() => setEstaAbierto(true)} type="button">
        Registrar modelo
      </button>
      <Modal alCerrar={() => setEstaAbierto(false)} cierreSoloConBotones estaAbierto={estaAbierto} titulo="Registrar nuevo modelo de máquina">
        <div className="form-panel">
          <AltaModeloMaquina
            alCancelar={() => setEstaAbierto(false)}
            alGuardar={(modelo) => {
              setEstaAbierto(false);
              marcarCreado("modelos-maquina", modelo.id);
              mostrarAviso("exito", "Modelo de máquina registrado.");
            }}
            tiposMaquina={props.tiposMaquina}
          />
        </div>
      </Modal>
    </>
  );
}
