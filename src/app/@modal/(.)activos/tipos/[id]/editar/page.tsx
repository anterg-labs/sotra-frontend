import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoEditarTipo } from "@/app/activos/tipos/[id]/editar/contenido-editar-tipo";

export default function ModalEditarTipo(props: { params: Promise<{ id: string }> }) {
  return (
    <ModalDeRuta titulo="Modificar tipo de máquina" descripcion="Gestión de tipos de máquina">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoEditarTipo params={props.params} />
      </Suspense>
    </ModalDeRuta>
  );
}
