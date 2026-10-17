import { leerDatosApi, leerPagina } from "@/servicios/api/solicitudes-http";
import type { Cliente, FiltrosClientes } from "@/tipos/cliente";
import type { Pagina } from "@/tipos/pagina";

export async function apiListarClientesPaginados(filtros: FiltrosClientes) {
  const parametros = new URLSearchParams();
  if (filtros.buscar.trim() !== "") {
    parametros.append("buscar", filtros.buscar.trim());
  }
  if (filtros.estado !== "") {
    parametros.append("estado", filtros.estado);
  }
  parametros.append("direccionOrden", "desc");
  parametros.append("pagina", String(filtros.pagina));

  const pagina = await leerPagina("/api/v1/clientes", parametros, "No se pudo obtener el listado de clientes.");
  return pagina as Pagina<Cliente>;
}

export async function apiObtenerCliente(clienteId: number) {
  const cliente = await leerDatosApi("/api/v1/clientes/" + clienteId, { cache: "no-store" }, "No se pudo obtener el cliente solicitado.");
  return cliente as Cliente;
}
