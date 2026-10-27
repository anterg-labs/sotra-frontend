import { Suspense } from "react";
import { EsqueletoFormulario, ModalDeRuta } from "@/componentes/modal-de-ruta";
import PaginaDetalleModeloMaquina from "../page";
import { ContenidoEditarModelo } from "./contenido-editar-modelo";

/**
 * Dirección abierta directamente (recarga o enlace): se ve la pantalla de origen con el formulario en un modal, igual que
 * cuando se llega desde un enlace; al cerrarlo se vuelve a esa pantalla.
 */
export default async function PaginaEditarModelo(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <>
      <PaginaDetalleModeloMaquina params={props.params} />
      <ModalDeRuta descripcion="Gestión de modelos de máquina" rutaDeRetorno={"/activos/modelos/" + id} titulo="Modificar modelo de máquina">
        <Suspense fallback={<EsqueletoFormulario />}>
          <ContenidoEditarModelo params={props.params} />
        </Suspense>
      </ModalDeRuta>
    </>
  );
}
