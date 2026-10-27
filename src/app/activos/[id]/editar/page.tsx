import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDetalleActivo from "../page";
import { ContenidoEditarActivo } from "./contenido-editar-activo";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaEditarActivo(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <>
      <PaginaDetalleActivo params={props.params} />
      <ModalDeRuta descripcion="Gestión de activos" rutaDeRetorno={"/activos/" + id} titulo="Modificar activo">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoEditarActivo params={props.params} />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
