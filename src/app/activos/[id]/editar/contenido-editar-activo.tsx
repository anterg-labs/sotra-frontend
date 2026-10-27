import { FormularioActivo } from "@/componentes/formulario-activo";
import { obtenerActivoServidor } from "@/servicios/servidor/activos";
import { listarClientesServidor, obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { listarModelosMaquinaServidor, obtenerModeloMaquinaServidor } from "@/servicios/servidor/modelos-maquina";
import type { Activo } from "@/tipos/activo";
import type { Cliente } from "@/tipos/cliente";
import type { ModeloMaquina } from "@/tipos/modelo-maquina";
import { actualizarActivoAccion } from "../../acciones";

type DatosEdicion = { activo: Activo; clientes: Cliente[]; modelosMaquina: ModeloMaquina[] };

/** El cliente y el modelo actuales van primero, aunque estén inactivos, seguidos de los activos. */
async function cargarDatos(activoId: number): Promise<DatosEdicion | null> {
  if (!Number.isInteger(activoId) || activoId <= 0) return null;
  try {
    const [activo, paginaClientes, paginaModelos] = await Promise.all([
      obtenerActivoServidor(activoId),
      listarClientesServidor({ buscar: "", estado: "activo", pagina: 1 }),
      listarModelosMaquinaServidor({ buscar: "", tipoMaquinaId: "", estado: "activo", pagina: 1 }),
    ]);
    const [clienteActual, modeloActual] = await Promise.all([
      obtenerClienteServidor(activo.clienteId),
      obtenerModeloMaquinaServidor(activo.modeloMaquinaId),
    ]);
    return {
      activo,
      clientes: [clienteActual, ...paginaClientes.elementos.filter((cliente) => cliente.id !== clienteActual.id)],
      modelosMaquina: [modeloActual, ...paginaModelos.elementos.filter((modelo) => modelo.id !== modeloActual.id)],
    };
  } catch {
    return null;
  }
}

/** Formulario de modificación de un activo; lo usan la página completa y el modal de ruta. */
export async function ContenidoEditarActivo(props: { params: Promise<{ id: string }> }) {
  const datos = await cargarDatos(Number((await props.params).id));

  if (!datos) return <p className="form-error-banner">No se pudo obtener la información del activo solicitado.</p>;

  return (
    <FormularioActivo
      accion={actualizarActivoAccion.bind(null, datos.activo.id)}
      activoInicial={datos.activo}
      clientes={datos.clientes}
      etiquetaConfirmacion="Confirmar modificación"
      modelosMaquina={datos.modelosMaquina}
    />
  );
}
