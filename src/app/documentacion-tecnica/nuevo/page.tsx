import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDocumentacionTecnica from "../page";
import { ContenidoNuevoDocumento } from "./contenido-nuevo-documento";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaNuevoDocumento() {
  return (
    <>
      <PaginaDocumentacionTecnica searchParams={Promise.resolve({})} />
      <ModalDeRuta descripcion="Documentación técnica" tamano="amplio" rutaDeRetorno={"/documentacion-tecnica"} titulo="Cargar documento técnico">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoNuevoDocumento />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
