import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoEditarCliente } from "@/app/clientes/[id]/editar/contenido-editar-cliente";

export default function ModalEditarCliente(props: { params: Promise<{ id: string }> }) {
  return (
    <ModalDeRuta titulo="Modificar cliente" descripcion="Gestión de clientes">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoEditarCliente params={props.params} />
      </Suspense>
    </ModalDeRuta>
  );
}
