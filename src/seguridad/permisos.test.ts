import { describe, expect, it } from "vitest";
import { decidirAcceso } from "@/seguridad/acceso";
import {
  esSoloTecnico,
  esUsuarioAdministrador,
  filtrarRolesSotra,
  paginaDeInicio,
  permisoDeRuta,
  puedeVerRuta,
  rolesAsignables,
  tienePermiso,
} from "@/seguridad/permisos";

describe("matriz de permisos (copia de PoliticasDeAcceso.cs)", () => {
  it.each([
    ["usuario.consultar", ["administrador", "jefe_mantenimiento"]],
    ["usuario.listar", ["administrador", "jefe_mantenimiento"]],
    ["usuario.crear", ["administrador", "jefe_mantenimiento"]],
    ["usuario.editar", ["administrador", "jefe_mantenimiento"]],
    ["usuario.gestionar_administradores", ["administrador"]],
    ["cliente.gestionar", ["administrador", "jefe_mantenimiento"]],
    ["modelo.consultar", ["administrador", "jefe_mantenimiento", "tecnico"]],
    ["ot.consultar", ["administrador", "jefe_mantenimiento", "tecnico", "panolero"]],
    ["ot.crear", ["administrador", "jefe_mantenimiento"]],
    ["ot.registrar_avance", ["administrador", "jefe_mantenimiento", "tecnico"]],
    ["documento.consultar", ["administrador", "jefe_mantenimiento", "tecnico"]],
    ["stock.consultar", ["administrador", "jefe_mantenimiento", "panolero"]],
    ["ot.gestionar_repuestos", ["administrador", "jefe_mantenimiento", "panolero"]],
    ["stock.registrar_movimiento", ["administrador", "panolero"]],
    ["reporte.consultar", ["administrador", "jefe_mantenimiento"]],
  ] as const)("%s: solo %j", (permiso, permitidos) => {
    for (const rol of ["administrador", "jefe_mantenimiento", "tecnico", "panolero"]) {
      expect(tienePermiso([rol], permiso)).toBe((permitidos as readonly string[]).includes(rol));
    }
  });

  it("sin roles no hay permisos, y basta con uno de los roles", () => {
    expect(tienePermiso([], "ot.consultar")).toBe(false);
    expect(tienePermiso(["panolero", "tecnico"], "documento.consultar")).toBe(true);
  });

  it("descarta los roles que no son de SOTRA", () => {
    expect(filtrarRolesSotra(["offline_access", "tecnico", "default-roles-sotra", "panolero"])).toEqual(["tecnico", "panolero"]);
  });
});

describe("reglas que dependen del usuario", () => {
  it("solo técnico: tiene el rol técnico y ningún otro de gestión", () => {
    expect(esSoloTecnico(["tecnico"])).toBe(true);
    expect(esSoloTecnico(["tecnico", "jefe_mantenimiento"])).toBe(false);
    expect(esSoloTecnico(["tecnico", "panolero"])).toBe(false);
    expect(esSoloTecnico(["administrador"])).toBe(false);
    expect(esSoloTecnico([])).toBe(false);
  });

  it("el jefe no ve el rol Administrador al asignar roles ni puede modificar a un administrador", () => {
    const roles = [{ id: 1, nombre: "Administrador" }, { id: 2, nombre: "Jefe de mantenimiento" }, { id: 3, nombre: "Técnico" }];
    expect(rolesAsignables(roles, false).map((rol) => rol.id)).toEqual([2, 3]);
    expect(rolesAsignables(roles, true)).toEqual(roles);
    expect(esUsuarioAdministrador({ roles: [{ nombre: "Técnico" }, { nombre: "Administrador" }] })).toBe(true);
    expect(esUsuarioAdministrador({ roles: [{ nombre: "Técnico" }] })).toBe(false);
  });
});

describe("permisos por página", () => {
  it.each([
    ["/usuarios", "usuario.consultar"],
    ["/usuarios/5/editar", "usuario.consultar"],
    ["/repuestos", "stock.consultar"],
    ["/repuestos/movimientos/3", "stock.consultar"],
    ["/repuestos/nuevo", "repuesto.gestionar"],
    ["/reportes", "reporte.consultar"],
    ["/configuracion/terminos", "configuracion.gestionar"],
    ["/documentacion-tecnica/nuevo", "documento.gestionar"],
    ["/documentacion-tecnica/4", "documento.consultar"],
    ["/activos/modelos/2/editar", "modelo.editar"],
    ["/activos/tipos/nuevo", "tipo_maquina.gestionar"],
    ["/activos/7", "activo.consultar"],
    ["/clientes/3/editar", "cliente.gestionar"],
    ["/ordenes-trabajo/nuevo", "ot.crear"],
    ["/ordenes-trabajo/8/editar", "ot.editar"],
    ["/ordenes-trabajo/8", "ot.consultar"],
    ["/tecnico/8", "ot.registrar_avance"],
  ])("%s exige %s", (ruta, permiso) => {
    expect(permisoDeRuta(ruta)).toBe(permiso);
  });

  it("las páginas sin regla son de cualquier usuario con sesión", () => {
    expect(permisoDeRuta("/")).toBeNull();
    expect(permisoDeRuta("/sin-permiso")).toBeNull();
    expect(puedeVerRuta([], "/sin-conexion")).toBe(true);
  });

  it("el técnico ve órdenes, clientes, activos y documentación; no usuarios, repuestos ni reportes", () => {
    const tecnico = ["tecnico"];
    for (const ruta of ["/ordenes-trabajo", "/clientes", "/activos", "/activos/modelos", "/documentacion-tecnica", "/tecnico"]) {
      expect(puedeVerRuta(tecnico, ruta)).toBe(true);
    }
    for (const ruta of ["/usuarios", "/repuestos", "/reportes", "/ordenes-trabajo/nuevo", "/clientes/nuevo"]) {
      expect(puedeVerRuta(tecnico, ruta)).toBe(false);
    }
  });

  it("la página de inicio depende del rol", () => {
    expect(paginaDeInicio(["administrador"])).toBe("/inicio");
    expect(paginaDeInicio(["jefe_mantenimiento"])).toBe("/inicio");
    expect(paginaDeInicio(["tecnico"])).toBe("/tecnico");
    expect(paginaDeInicio(["panolero"])).toBe("/repuestos");
  });
});

describe("decidirAcceso (lo que hace el proxy)", () => {
  const base = { consulta: "", haySesion: true, roles: ["tecnico"], esServerAction: false };

  it("sin sesión: al login con la página pedida, salvo /api/v1 (401) y las Server Actions (siguen)", () => {
    expect(decidirAcceso({ ...base, ruta: "/clientes", consulta: "?buscar=a", haySesion: false })).toEqual({
      tipo: "iniciar-sesion",
      destino: "/login?destino=%2Fclientes%3Fbuscar%3Da",
    });
    expect(decidirAcceso({ ...base, ruta: "/api/v1/activos", haySesion: false })).toEqual({ tipo: "sin-sesion-api" });
    expect(decidirAcceso({ ...base, ruta: "/clientes", haySesion: false, esServerAction: true }).tipo).toBe("continuar");
  });

  it("sin el rol: «sin permiso»; con el rol, sigue y pasa la ruta pedida", () => {
    expect(decidirAcceso({ ...base, ruta: "/reportes" })).toEqual({ tipo: "sin-permiso" });
    expect(decidirAcceso({ ...base, ruta: "/clientes", consulta: "?pagina=2" })).toEqual({
      tipo: "continuar",
      encabezados: { "x-sotra-ruta": "/clientes?pagina=2" },
    });
  });

  it("el técnico pasa de las órdenes de escritorio a «Mi trabajo»; el pañolero y el jefe no", () => {
    expect(decidirAcceso({ ...base, ruta: "/ordenes-trabajo", consulta: "?estado=creada" })).toEqual({ tipo: "redirigir", destino: "/tecnico" });
    expect(decidirAcceso({ ...base, ruta: "/ordenes-trabajo/15" })).toEqual({ tipo: "redirigir", destino: "/tecnico/15" });
    expect(decidirAcceso({ ...base, ruta: "/ordenes-trabajo", roles: ["panolero"] }).tipo).toBe("continuar");
    expect(decidirAcceso({ ...base, ruta: "/ordenes-trabajo/15", roles: ["tecnico", "jefe_mantenimiento"] }).tipo).toBe("continuar");
  });

  it("/api/v1 con sesión siempre sigue: el permiso lo controla la API", () => {
    expect(decidirAcceso({ ...base, ruta: "/api/v1/usuarios" }).tipo).toBe("continuar");
  });
});
