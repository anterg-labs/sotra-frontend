# CHANGELOG

## Version 1.0.14 (2026-10-23)

- Integración: se corrige el archivo de dependencias para que la instalación del frontend en Linux y en CI incluya todos los paquetes necesarios.

## Version 1.0.13 (2026-10-23)

- Seguridad: se actualizan Next.js y su configuración ESLint a 16.4.1 para corregir las vulnerabilidades detectadas por el análisis de dependencias del PR.

## Version 1.0.12 (2026-10-23)

- Seguridad: las páginas protegidas y públicas reciben una política de contenido con nonce por solicitud, compatible con el inicio y cierre de sesión de Keycloak.
- Pruebas: la comprobación del reenvío multipart utiliza el entorno de Node y las pruebas del layout reconocen el renderizado por solicitud.
