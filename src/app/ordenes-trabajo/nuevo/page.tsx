import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaOrdenesTrabajo from "../page";
import { ContenidoNuevaOrden } from "./contenido-nueva-orden";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaNuevaOrden() {
  return (
    <>
      <PaginaOrdenesTrabajo searchParams={Promise.resolve({})} />
      <ModalDeRuta descripcion="Órdenes de trabajo" tamano="amplio" rutaDeRetorno={"/ordenes-trabajo"} titulo="Crear orden de trabajo">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoNuevaOrden />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
