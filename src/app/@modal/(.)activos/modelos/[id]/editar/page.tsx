import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoEditarModelo } from "@/app/activos/modelos/[id]/editar/contenido-editar-modelo";

export default function ModalEditarModelo(props: { params: Promise<{ id: string }> }) {
  return (
    <ModalDeRuta titulo="Modificar modelo de máquina" descripcion="Gestión de modelos de máquina">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoEditarModelo params={props.params} />
      </Suspense>
    </ModalDeRuta>
  );
}
