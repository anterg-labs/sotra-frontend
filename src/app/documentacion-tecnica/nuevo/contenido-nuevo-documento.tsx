import { FormularioDocumentoTecnico } from "@/componentes/formulario-documento-tecnico";
import { listarActivosServidor } from "@/servicios/servidor/activos";

/** Formulario de carga de un documento técnico; lo usan la página completa y el modal de ruta. */
export async function ContenidoNuevoDocumento() {
  const activos = await listarActivosServidor({ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "activo", pagina: 1 })
    .then((pagina) => pagina.elementos)
    .catch(() => null);

  if (activos === null) return <p className="form-error-banner">No se pudo obtener el listado de activos.</p>;

  return <FormularioDocumentoTecnico activos={activos} />;
}
