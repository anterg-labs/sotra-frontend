# CHANGELOG

## Version 1.0.50 (2026-10-26)

- Clientes: el listado tiene el interruptor «Solo con activos asociados» para ver únicamente los clientes que tienen activos; la columna «Activos asociados» ya se podía ordenar.

## Version 1.0.49 (2026-10-26)

- Órdenes de trabajo: la sugerencia de IA se pide con el activo de la orden (`activoId`), así la API busca solo en los manuales de esa máquina, de su modelo y en la documentación general.
- Órdenes de trabajo: si el asistente de IA no está disponible (`modo = sin_ia`), un aviso indica que se muestra el texto original del manual sin resumir y pide verificar los valores con la fuente.

## Version 1.0.48 (2026-10-26)

- Órdenes de trabajo: si falta el motivo al cambiar el estado desde el detalle, el aviso aparece debajo del campo «Motivo u observación» y lleva el cursor allí, en lugar de mostrarse arriba de la página.

## Version 1.0.47 (2026-10-26)

- Reportes: cada punto de «Atención necesaria» (prioridad alta pendientes, pendientes de validación y bajo stock) es un enlace que lleva directo al listado correspondiente.

## Version 1.0.46 (2026-10-25)

- Órdenes de trabajo: los colores, las acciones y los pasos permitidos de cada estado salen de la base (`tono` y `transiciones` de cada orden); la pantalla ya no nombra ningún estado.
- Órdenes de trabajo: el listado se puede filtrar por fase (pendientes, en curso, por validar, cerradas o canceladas) y el Inicio y las tarjetas de resumen cuentan por fase.
- Técnico: las acciones de la orden (Iniciar, Pausar, Reanudar, Finalizar) y su pedido de motivo vienen de la base, y «Mi trabajo» trae las órdenes pendientes y en curso.

## Version 1.0.45 (2026-10-25)

- Órdenes de trabajo: los filtros, los reportes, los formularios y las etiquetas toman los estados de la base; el combo de estado del detalle y de la modificación muestra solo los estados a los que se puede pasar desde el actual.
- Estados: nunca se muestra un valor como `en_ejecucion`; si falta la etiqueta, se muestra legible y con la primera letra en mayúscula.
- Formularios: el campo «Motivo del cambio de estado» (y cualquier campo de ancho completo dentro de una grilla) ocupa todo el ancho y queda alineado con el resto, sin el margen que lo desplazaba.
- Interfaz: los desplegables, botones, enlaces, casillas, selectores de fecha y demás elementos que se accionan sin escribir texto muestran el cursor de mano, y los deshabilitados el de no permitido; los campos de texto conservan el suyo.

## Version 1.0.44 (2026-10-25)

- Órdenes de trabajo: en el alta y la edición, el campo Cliente queda alineado con el campo Activo aunque este muestre su texto de ayuda debajo.

## Version 1.0.43 (2026-10-24)

- Órdenes de trabajo: el desplegable «Actualizar estado» del detalle ahora es igual al de «Asignar o modificar técnico» (mismo aspecto y comportamiento), en lugar de la lista nativa del navegador.

## Version 1.0.42 (2026-10-24)

- Navegación: el botón «Volver al listado» (y «Volver a activos», «Volver a repuestos», «Volver a movimientos») pasa a ser una flecha a la izquierda del título, con el texto como etiqueta accesible, en los detalles de órdenes, clientes, usuarios, activos, modelos, tipos, documentos, repuestos y movimientos, y en el alta y la edición de usuarios.

## Version 1.0.41 (2026-10-24)

- Vistas de detalle: los datos cortos se reparten en columnas y los largos (descripción, observaciones, repuestos y sugerencias) ocupan todo el ancho, con lo que la tarjeta principal de la orden de trabajo, los clientes, los activos, los modelos, los documentos, los repuestos y sus movimientos aprovecha mejor la pantalla. El estado de la orden se muestra como etiqueta.

## Version 1.0.40 (2026-10-24)

- Órdenes de trabajo: el menú del selector de técnico se ve completo sobre la tarjeta en lugar de quedar recortado dentro de ella; lo mismo vale para cualquier selector dentro de una tarjeta.

## Version 1.0.39 (2026-10-23)

- Clientes: el formulario muestra como ejemplo un celular con cero inicial y lo envía tal como se ingresó; la lista y el detalle conservan el formato guardado.

## Version 1.0.38 (2026-10-23)

- Roles: el tipo de rol del frontend incluye el estado que informa la API.

## Version 1.0.37 (2026-10-23)

- Usuarios: se quita el texto de ayuda sobre la cantidad de dígitos y el formulario muestra como ejemplo un celular con cero inicial. El teléfono recuperado para edición conserva el formato ingresado.

## Version 1.0.36 (2026-10-23)

- Listados: la ordenación local de texto usa español de Uruguay sin separar mayúsculas; conserva el orden natural de números dentro del texto.

## Version 1.0.35 (2026-10-23)

- Seguridad: se actualizan Zod, Vite y Vitest junto con sus dependencias de desarrollo para corregir los avisos detectados por `npm audit`.

## Version 1.0.34 (2026-10-23)

- Seguridad: se fijan Node.js 24.22.1 para CI y uso directo, y Node.js 26.12.1 para las imágenes Docker de desarrollo y producción, por CVE-2026-111497.

## Version 1.0.33 (2026-10-23)

- Integración: se reúnen las correcciones del celular, el correo y los formularios con los cambios posteriores de listados, stock, documentos y navegación.

## Version 1.0.32 (2026-10-23)

- Listados: el orden elegido en clientes y usuarios llega a la API. Los formularios muestran avisos en línea y las observaciones vacías de las órdenes se envían como dato opcional.

## Version 1.0.31 (2026-10-23)

- Órdenes y stock: los listados ordenan las filas visibles de inmediato, muestran el resultado de las acciones con claridad y actualizan los formularios de repuestos y movimientos.

## Version 1.0.30 (2026-10-23)

- Activos y catálogos: los listados ordenan las filas visibles de inmediato y confirman los cambios de estado; los formularios y filtros muestran errores más claros.

## Version 1.0.29 (2026-10-23)

- Tablas: el detalle de repuestos y los reportes permiten ordenar los movimientos, las órdenes y los grupos de datos; el detalle enlaza al historial completo.

## Version 1.0.28 (2026-10-23)

- Órdenes de trabajo: las órdenes asociadas se ordenan y paginan sin vaciar la tabla durante la carga; al asignar técnico se evita elegir al ya asignado.

## Version 1.0.27 (2026-10-23)

- Usuarios y clientes: los listados muestran y permiten ordenar por las órdenes asociadas; se mejoran las confirmaciones de baja y reactivación y los mensajes del alta de usuarios.

## Version 1.0.26 (2026-10-23)

- Avisos: los resultados y errores aparecen arriba con colores y mensajes accesibles; los errores duran más y los diálogos de confirmación tienen títulos identificables.

## Version 1.0.25 (2026-10-23)

- Desarrollo: el caché de compilación local persiste al recrear contenedores y se pueden precalentar las pantallas con una cuenta de prueba. Se amplía la prueba de ingreso rápido de stock.

## Version 1.0.24 (2026-10-23)

- Búsquedas: los selectores esperan el resultado remoto, descartan respuestas anteriores y avisan cuando falla la carga de opciones.

## Version 1.0.23 (2026-10-23)

- Navegación: se agrega una pantalla de inicio con accesos y órdenes recientes, se organiza el menú lateral y el pie muestra las versiones del frontend y la API.

## Version 1.0.22 (2026-10-23)

- Documentación: se pueden cargar, filtrar y editar documentos con título, tipo, descripción y asociación; también marcar su vigencia.

## Version 1.0.21 (2026-10-23)

- Stock: se puede ingresar stock desde el listado eligiendo repuesto y cantidad; la fecha y la ubicación se asignan automáticamente.

## Version 1.0.20 (2026-10-23)

- Listados: los valores numéricos de clientes, órdenes, repuestos y movimientos se muestran centrados en su columna.

## Version 1.0.19 (2026-10-23)

- Listados: se conserva visible la tabla anterior mientras se cargan filtros, orden o paginación, evitando el parpadeo.

## Version 1.0.18 (2026-10-23)

- Listados: se pueden ordenar las columnas de usuarios, clientes, máquinas, órdenes, repuestos y movimientos desde el encabezado, conservando filtros y paginación.

## Version 1.0.17 (2026-10-23)

- Formularios: los campos opcionales vacíos de repuestos y órdenes se envían como nulos para que la API los procese correctamente.

## Version 1.0.16 (2026-10-23)

- Pruebas: se actualizan las comprobaciones de reenvío de correo y los datos de teléfonos de los formularios para reflejar el comportamiento vigente.

## Version 1.0.15 (2026-10-23)

- Usuarios: el formulario acepta celulares con cero inicial y el alta muestra si el correo de Keycloak salió, falló o no correspondía; el reenvío muestra el error comunicado por la API.

## Version 1.0.14 (2026-10-23)

- Integración: se corrige el archivo de dependencias para que la instalación del frontend en Linux y en CI incluya todos los paquetes necesarios.

## Version 1.0.13 (2026-10-23)

- Seguridad: se actualizan Next.js y su configuración ESLint a 16.4.1 para corregir las vulnerabilidades detectadas por el análisis de dependencias del PR.

## Version 1.0.12 (2026-10-23)

- Seguridad: las páginas protegidas y públicas reciben una política de contenido con nonce por solicitud, compatible con el inicio y cierre de sesión de Keycloak.
- Pruebas: la comprobación del reenvío multipart utiliza el entorno de Node y las pruebas del layout reconocen el renderizado por solicitud.
