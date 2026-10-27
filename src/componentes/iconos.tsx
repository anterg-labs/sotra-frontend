export function IconoOjo() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconoLapiz() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

export function IconoPapelera() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function IconoDescarga() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** Restaurar: lo opuesto a la papelera de «dar de baja». Se usa en todos los listados para reactivar un registro. */
export function IconoReactivar() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <rect height="5" rx="1" width="20" x="2" y="3" />
      <path d="M4 8v11a2 2 0 0 0 2 2h2" />
      <path d="M20 8v11a2 2 0 0 1-2 2h-2" />
      <path d="m9 15 3-3 3 3" />
      <path d="M12 12v9" />
    </svg>
  );
}

type PropiedadesIconoMenu = {
  tamano?: number;
};

function IconoMenuBase(props: PropiedadesIconoMenu & { children: React.ReactNode }) {
  const tamano = props.tamano ?? 20;
  return (
    <svg
      aria-hidden="true"
      className="app-menu-icono"
      fill="none"
      height={tamano}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={tamano}
    >
      {props.children}
    </svg>
  );
}

export function IconoOrdenesTrabajo(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <rect height="18" rx="2" width="14" x="5" y="3" />
      <path d="M9 3h6v3H9z" />
      <path d="m9 13 2 2 4-4" />
    </IconoMenuBase>
  );
}

/** Tarjeta de contacto: un cliente con sus datos (distinta de la casa de Inicio y del grupo de personas de Usuarios). */
export function IconoClientes(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <circle cx="12" cy="11" r="3" />
      <path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
      <path d="M8 2v4M16 2v4" />
    </IconoMenuBase>
  );
}

export function IconoActivos(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <path d="M3 17h13V8H9l-3 4H3z" />
      <path d="M16 11h3l2 3v3h-5" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </IconoMenuBase>
  );
}

export function IconoRepuestos(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <path d="M21 8 12 3 3 8l9 5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </IconoMenuBase>
  );
}

export function IconoDocumentacion(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </IconoMenuBase>
  );
}

export function IconoUsuarios(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.3c2 .8 3.5 2.6 3.5 5.7" />
    </IconoMenuBase>
  );
}

export function IconoInicio(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-6h4v6" />
    </IconoMenuBase>
  );
}

export function IconoReportes(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5M12 16V8M16 16v-8" />
    </IconoMenuBase>
  );
}

export function IconoFlechaIzquierda(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <path d="m12 5-7 7 7 7M5 12h14" />
    </IconoMenuBase>
  );
}

export function IconoHamburguesa(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconoMenuBase>
  );
}

export function IconoSalir(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </IconoMenuBase>
  );
}

export function IconoConfiguracion(props: PropiedadesIconoMenu) {
  return (
    <IconoMenuBase {...props}>
      {/* Engranaje (contorno con ocho dientes y círculo central). */}
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </IconoMenuBase>
  );
}
