import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import { ContenidoNuevoDocumento } from "@/app/documentacion-tecnica/nuevo/contenido-nuevo-documento";

export default function ModalNuevoDocumento() {
  return (
    <ModalDeRuta titulo="Cargar documento técnico" descripcion="Documentación técnica" tamano="amplio">
      <Suspense fallback={<EsqueletoFormulario />}>
        <ContenidoNuevoDocumento />
      </Suspense>
    </ModalDeRuta>
  );
}
