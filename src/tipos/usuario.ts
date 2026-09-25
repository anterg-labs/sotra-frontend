export type EstadoUsuario = "activo" | "inactivo";

export type Rol = {
  id: number;
  nombre: string;
};

export type RolDeUsuario = {
  id: number;
  nombre: string;
  activo: boolean;
};

export type Usuario = {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  roles: RolDeUsuario[];
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
  idsRol: number[];
  contrasena: string;
};

export type ActualizarUsuarioInput = {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  idsRol: number[];
};
