export type EstadoCliente = "activo" | "inactivo";

export type Cliente = {
  id: number;
  razonSocial: string;
  nombreContacto: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  observaciones: string | null;
  cantidadActivosAsociados: number;
  estado: EstadoCliente;
  creadoEn: string;
};

export type CrearClienteInput = {
  razonSocial: string;
  nombreContacto: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  observaciones: string | null;
};

export type ActualizarClienteInput = CrearClienteInput;
