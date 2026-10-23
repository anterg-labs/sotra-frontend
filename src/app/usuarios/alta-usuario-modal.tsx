"use client";

import { useState } from "react";
import { AltaUsuario } from "@/componentes/alta-usuario";
import { useAvisos } from "@/componentes/avisos";
import { avisoUsuarioCreado } from "@/componentes/formulario-usuario";
import { marcarCreado } from "@/componentes/listado/ultimo-creado";
import { Modal } from "@/componentes/modal";
import type { Rol } from "@/tipos/usuario";

/** Botón de alta y modal con el formulario; al guardar, la Server Action ya revalidó el listado. */
export function AltaUsuarioModal(props: { roles: Rol[] | null }) {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const { mostrarAviso } = useAvisos();

  return (
    <>
      <button className="primary-button" onClick={() => setEstaAbierto(true)} type="button">
        Crear nuevo usuario
      </button>
      <Modal alCerrar={() => setEstaAbierto(false)} estaAbierto={estaAbierto} titulo="Crear nuevo usuario">
        <div className="form-panel">
          <AltaUsuario
            alCancelar={() => setEstaAbierto(false)}
            alGuardar={(usuario) => {
              setEstaAbierto(false);
              marcarCreado("usuarios", usuario.id);
              const aviso = avisoUsuarioCreado(usuario);
              mostrarAviso(aviso.tipo, aviso.texto);
            }}
            roles={props.roles}
          />
        </div>
      </Modal>
    </>
  );
}
