export type EstadoCliente = "activo" | "inactivo";

export type Cliente = {
  id: number;
  razonSocial: string;
  nombreContacto: string;
  correo: string;
  telefono: string;
  direccion: string;
  observaciones: string;
  cantidadActivosAsociados: number;
  estado: EstadoCliente;
  creadoEn: string;
};

export type CrearClienteInput = {
  razonSocial: string;
  nombreContacto: string;
  correo: string;
  telefono: string;
  direccion: string;
  observaciones: string;
};

export type ActualizarClienteInput = CrearClienteInput;
