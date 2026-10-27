import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoEditarActivo } from "@/app/activos/[id]/editar/contenido-editar-activo";

export default function ModalEditarActivo(props: { params: Promise<{ id: string }> }) {
  return (
    <ModalDeRuta titulo="Modificar activo" descripcion="Gestión de activos">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoEditarActivo params={props.params} />
      </Suspense>
    </ModalDeRuta>
  );
}
