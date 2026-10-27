import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoEditarDocumento } from "@/app/documentacion-tecnica/[id]/editar/contenido-editar-documento";

export default function ModalEditarDocumento(props: { params: Promise<{ id: string }> }) {
  return (
    <ModalDeRuta titulo="Modificar documento" descripcion="Documentación técnica">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoEditarDocumento params={props.params} />
      </Suspense>
    </ModalDeRuta>
  );
}
