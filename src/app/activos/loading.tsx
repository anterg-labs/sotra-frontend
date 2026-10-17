import { CargandoPagina } from "@/componentes/listado/cargando-pagina";

/** Aplica a toda la ruta /activos (activos, modelos y tipos: listado, detalle, alta y edición) mientras el servidor prepara la pantalla. */
export default function CargandoActivos() {
  return <CargandoPagina />;
}
