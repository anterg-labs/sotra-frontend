export type EstadoUsuario = "activo" | "inactivo";

export type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  estado: EstadoUsuario;
  creadoEn: string;
};

export type UsuarioListado = Usuario;

export type UsuarioDetalle = UsuarioListado;

export type CrearUsuarioInput = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  contrasenaTemporal: string;
};

export type ActualizarUsuarioInput = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
};
