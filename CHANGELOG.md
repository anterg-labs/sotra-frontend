# CHANGELOG

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
