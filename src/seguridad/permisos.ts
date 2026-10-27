/**
 * Matriz de acceso de la interfaz. Copia la de la API (`Api/Seguridad/PoliticasDeAcceso.cs`): la API es la que manda
 * (responde 403), esta matriz solo evita mostrar opciones que van a fallar. Si cambia en el backend, cambiar acá.
 */
export const ROLES_SOTRA = ["administrador", "jefe_mantenimiento", "tecnico", "panolero"] as const;

export type RolSotra = (typeof ROLES_SOTRA)[number];

const administrador: RolSotra = "administrador";
const jefe: RolSotra = "jefe_mantenimiento";
const tecnico: RolSotra = "tecnico";
const panolero: RolSotra = "panolero";

const rolesPorPermiso = {
  "usuario.consultar": [administrador, jefe],
  "usuario.listar": [administrador, jefe],
  "usuario.crear": [administrador, jefe],
  "usuario.editar": [administrador, jefe],
  // El jefe gestiona usuarios pero no administradores: no asigna ese rol ni modifica a quien lo tiene (la API responde 403).
  "usuario.gestionar_administradores": [administrador],

  "cliente.consultar": [administrador, jefe, tecnico, panolero],
  "cliente.gestionar": [administrador, jefe],

  "activo.consultar": [administrador, jefe, tecnico, panolero],
  "activo.crear": [administrador, jefe],
  "activo.editar": [administrador, jefe],

  "modelo.consultar": [administrador, jefe, tecnico],
  "modelo.crear": [administrador, jefe],
  "modelo.editar": [administrador, jefe],

  "tipo_maquina.consultar": [administrador, jefe, tecnico],
  "tipo_maquina.gestionar": [administrador, jefe],

  "ot.consultar": [administrador, jefe, tecnico, panolero],
  "ot.crear": [administrador, jefe],
  "ot.editar": [administrador, jefe],
  "ot.asignar_tecnico": [administrador, jefe],
  "ot.registrar_avance": [administrador, jefe, tecnico],

  "documento.consultar": [administrador, jefe, tecnico],
  "documento.gestionar": [administrador, jefe],

  "stock.consultar": [administrador, panolero],
  "repuesto.gestionar": [administrador, panolero],
  "stock.registrar_movimiento": [administrador, panolero],

  "reporte.consultar": [administrador, jefe],

  // Solo de la interfaz (la API no tiene esta política): publicar los términos y condiciones.
  "configuracion.gestionar": [administrador],
} satisfies Record<string, RolSotra[]>;

export type Permiso = keyof typeof rolesPorPermiso;

export function esRolSotra(rol: string): rol is RolSotra {
  return (ROLES_SOTRA as readonly string[]).includes(rol);
}

/** Se queda solo con los roles de SOTRA (descarta `offline_access`, `default-roles-sotra`, etc.). */
export function filtrarRolesSotra(roles: readonly string[]): RolSotra[] {
  return roles.filter(esRolSotra);
}

export function tienePermiso(roles: readonly string[], permiso: Permiso): boolean {
  const permitidos: readonly string[] = rolesPorPermiso[permiso];
  return roles.some((rol) => permitidos.includes(rol));
}

type ReglaDeRuta = { patron: RegExp; permiso: Permiso };

/** De la más específica a la más general: gana la primera que coincide. */
const reglasDeRuta: ReglaDeRuta[] = [
  { patron: /^\/usuarios(\/|$)/, permiso: "usuario.consultar" },
  { patron: /^\/repuestos\/nuevo$/, permiso: "repuesto.gestionar" },
  { patron: /^\/repuestos\/\d+\/editar$/, permiso: "repuesto.gestionar" },
  { patron: /^\/repuestos(\/|$)/, permiso: "stock.consultar" },
  { patron: /^\/inicio(\/|$)/, permiso: "reporte.consultar" },
  { patron: /^\/reportes(\/|$)/, permiso: "reporte.consultar" },
  { patron: /^\/configuracion(\/|$)/, permiso: "configuracion.gestionar" },
  { patron: /^\/documentacion-tecnica\/nuevo$/, permiso: "documento.gestionar" },
  { patron: /^\/documentacion-tecnica(\/|$)/, permiso: "documento.consultar" },
  { patron: /^\/activos\/modelos\/nuevo$/, permiso: "modelo.crear" },
  { patron: /^\/activos\/modelos\/\d+\/editar$/, permiso: "modelo.editar" },
  { patron: /^\/activos\/modelos(\/|$)/, permiso: "modelo.consultar" },
  { patron: /^\/activos\/tipos\/(nuevo|\d+\/editar)$/, permiso: "tipo_maquina.gestionar" },
  { patron: /^\/activos\/tipos(\/|$)/, permiso: "tipo_maquina.consultar" },
  { patron: /^\/activos\/nuevo$/, permiso: "activo.crear" },
  { patron: /^\/activos\/\d+\/editar$/, permiso: "activo.editar" },
  { patron: /^\/activos(\/|$)/, permiso: "activo.consultar" },
  { patron: /^\/clientes\/(nuevo|\d+\/editar)$/, permiso: "cliente.gestionar" },
  { patron: /^\/clientes(\/|$)/, permiso: "cliente.consultar" },
  { patron: /^\/ordenes-trabajo\/nuevo$/, permiso: "ot.crear" },
  { patron: /^\/ordenes-trabajo\/\d+\/editar$/, permiso: "ot.editar" },
  { patron: /^\/ordenes-trabajo(\/|$)/, permiso: "ot.consultar" },
  { patron: /^\/tecnico(\/|$)/, permiso: "ot.registrar_avance" },
];

/** Permiso que exige una página, o `null` si cualquier usuario con sesión puede verla. */
export function permisoDeRuta(ruta: string): Permiso | null {
  return reglasDeRuta.find((regla) => regla.patron.test(ruta))?.permiso ?? null;
}

export function puedeVerRuta(roles: readonly string[], ruta: string): boolean {
  const permiso = permisoDeRuta(ruta);
  return permiso === null || tienePermiso(roles, permiso);
}

/** Técnico sin otro rol de gestión: solo ve sus órdenes y usa siempre la vista móvil. La API aplica la misma regla. */
export function esSoloTecnico(roles: readonly string[]): boolean {
  return roles.includes(tecnico) && !roles.some((rol) => rol === administrador || rol === jefe || rol === panolero);
}

/** Nombre del rol Administrador en la base (`/api/v1/roles`). */
export const NOMBRE_ROL_ADMINISTRADOR = "Administrador";

/** Si el usuario (de la lista de usuarios) tiene el rol Administrador: el jefe no puede modificarlo. */
export function esUsuarioAdministrador(usuario: { roles: readonly { nombre: string }[] }): boolean {
  return usuario.roles.some((rol) => rol.nombre === NOMBRE_ROL_ADMINISTRADOR);
}

/** Roles que se ofrecen al crear o modificar un usuario: sin Administrador para quien no puede asignarlo (el jefe). */
export function rolesAsignables<T extends { nombre: string }>(roles: T[], puedeGestionarAdministradores: boolean): T[] {
  return puedeGestionarAdministradores ? roles : roles.filter((rol) => rol.nombre !== NOMBRE_ROL_ADMINISTRADOR);
}

/** Página de inicio según el rol: «Inicio» si puede ver reportes, «Mi trabajo» si es técnico, si no, repuestos u órdenes. */
export function paginaDeInicio(roles: readonly string[]): string {
  if (tienePermiso(roles, "reporte.consultar")) return "/inicio";
  if (tienePermiso(roles, "ot.registrar_avance")) return "/tecnico";
  if (tienePermiso(roles, "stock.consultar")) return "/repuestos";
  return "/ordenes-trabajo";
}
