import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoEditarUsuario } from "@/app/usuarios/[id]/editar/contenido-editar-usuario";

export default function ModalEditarUsuario(props: { params: Promise<{ id: string }> }) {
  return (
    <ModalDeRuta titulo="Modificar usuario" descripcion="Gestión de usuarios">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoEditarUsuario params={props.params} />
      </Suspense>
    </ModalDeRuta>
  );
}
