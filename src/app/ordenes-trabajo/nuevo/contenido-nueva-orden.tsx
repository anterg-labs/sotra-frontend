import { listarActivosServidor } from "@/servicios/servidor/activos";
import { listarClientesServidor } from "@/servicios/servidor/clientes";
import { listarTecnicosServidor } from "@/servicios/servidor/ordenes-trabajo";
import { listarRepuestosServidor } from "@/servicios/servidor/repuestos";
import { tienePermisoServidor } from "@/servicios/servidor/sesion";
import { FormularioNuevaOrden } from "../formularios-orden";

/** Los repuestos solo se cargan si el rol puede gestionarlos en una orden (administrador, jefe y pañolero). */
async function cargarDatos() {
  try {
    const puedeVerRepuestos = await tienePermisoServidor("ot.gestionar_repuestos");
    const [clientes, activos, tecnicos, repuestos] = await Promise.all([
      listarClientesServidor({ buscar: "", estado: "activo", pagina: 1 }),
      listarActivosServidor({ buscar: "", clienteId: "", modeloMaquinaId: "", estado: "activo", pagina: 1 }),
      listarTecnicosServidor(),
      puedeVerRepuestos
        ? listarRepuestosServidor({ buscar: "", estado: "activo", ubicacion: "", bajoStock: false, pagina: 1 })
        : Promise.resolve(null),
    ]);
    return { clientes: clientes.elementos, activos: activos.elementos, tecnicos, repuestos: repuestos?.elementos ?? [] };
  } catch {
    return null;
  }
}

/** Formulario de creación de una orden de trabajo; lo usan la página completa y el modal de ruta. */
export async function ContenidoNuevaOrden() {
  const datos = await cargarDatos();

  if (datos === null) return <p className="form-error-banner">No se pudieron obtener los datos necesarios para crear la orden.</p>;

  return <FormularioNuevaOrden {...datos} />;
}
