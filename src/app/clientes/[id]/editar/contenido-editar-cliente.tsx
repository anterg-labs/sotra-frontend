import { FormularioCliente } from "@/componentes/formulario-cliente";
import { obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { actualizarClienteAccion } from "../../acciones";

const MENSAJE_ERROR = "No se pudo obtener la información del cliente solicitado.";

/** Formulario de modificación de un cliente; lo usan la página completa y el modal de ruta. */
export async function ContenidoEditarCliente(props: { params: Promise<{ id: string }> }) {
  const clienteId = Number((await props.params).id);

  let cliente = null;
  if (Number.isInteger(clienteId) && clienteId > 0) {
    try {
      cliente = await obtenerClienteServidor(clienteId);
    } catch {
      cliente = null;
    }
  }

  if (!cliente) return <p className="form-error-banner">{MENSAJE_ERROR}</p>;

  return (
    <FormularioCliente
      accion={actualizarClienteAccion.bind(null, cliente.id)}
      clienteInicial={{
        razonSocial: cliente.razonSocial,
        nombreContacto: cliente.nombreContacto,
        correo: cliente.correo,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        observaciones: cliente.observaciones,
      }}
      etiquetaConfirmacion="Confirmar modificación"
    />
  );
}
