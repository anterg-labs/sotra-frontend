import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoNuevaOrden } from "@/app/ordenes-trabajo/nuevo/contenido-nueva-orden";

export default function ModalNuevaOrden() {
  return (
    <ModalDeRuta titulo="Crear orden de trabajo" descripcion="Órdenes de trabajo" tamano="amplio">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoNuevaOrden />
      </Suspense>
    </ModalDeRuta>
  );
}
