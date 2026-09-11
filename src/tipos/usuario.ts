export type EstadoUsuario = "activo" | "inactivo";

export type Rol = {
  id: number;
  codigo: string;
  nombre: string;
};

export type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rolId: number;
  estado: EstadoUsuario;
  creadoEn: string;
};

export type UsuarioListado = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rolId: number;
  estado: EstadoUsuario;
  creadoEn: string;
  nombreRol: string;
};

export type UsuarioDetalle = UsuarioListado;

export type CrearUsuarioInput = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  contrasenaTemporal: string;
  rolId: number;
};

export type ActualizarUsuarioInput = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rolId: number;
};
