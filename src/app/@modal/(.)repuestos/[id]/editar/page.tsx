import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoEditarRepuesto } from "@/app/repuestos/[id]/editar/contenido-editar-repuesto";

export default function ModalEditarRepuesto(props: { params: Promise<{ id: string }> }) {
  return (
    <ModalDeRuta titulo="Modificar repuesto" descripcion="Gestión de repuestos">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoEditarRepuesto params={props.params} />
      </Suspense>
    </ModalDeRuta>
  );
}
