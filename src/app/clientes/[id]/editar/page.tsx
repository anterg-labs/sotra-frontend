import { FormularioCliente } from "@/componentes/formulario-cliente";
import { obtenerClienteServidor } from "@/servicios/servidor/clientes";
import { actualizarClienteAccion } from "../../acciones";

const MENSAJE_ERROR = "No se pudo obtener la información del cliente solicitado.";

export default async function PaginaEditarCliente(props: { params: Promise<{ id: string }> }) {
  const clienteId = Number((await props.params).id);

  let cliente = null;
  if (Number.isInteger(clienteId) && clienteId > 0) {
    try {
      cliente = await obtenerClienteServidor(clienteId);
    } catch {
      cliente = null;
    }
  }

  return (
    <main className="page-content">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Gestión de clientes</p>
          <h1>Modificar cliente</h1>
        </div>
      </header>

      {cliente ? (
        <section className="panel form-panel">
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
        </section>
      ) : (
        <p className="form-error-banner">{MENSAJE_ERROR}</p>
      )}
    </main>
  );
}
