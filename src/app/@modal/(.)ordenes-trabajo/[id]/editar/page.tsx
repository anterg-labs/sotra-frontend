import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoEditarOrden } from "@/app/ordenes-trabajo/[id]/editar/contenido-editar-orden";

export default function ModalEditarOrden(props: { params: Promise<{ id: string }> }) {
  return (
    <ModalDeRuta titulo="Modificar orden de trabajo" descripcion="Órdenes de trabajo" tamano="amplio">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoEditarOrden params={props.params} />
      </Suspense>
    </ModalDeRuta>
  );
}
