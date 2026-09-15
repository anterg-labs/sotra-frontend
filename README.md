# sotra-frontend

Frontend de SOTRA desarrollado con Next.js.

## Desarrollo con Docker Compose

El proyecto incluye una configuración de Docker Compose para ejecutar el frontend en modo desarrollo, además de servicios independientes para ejecutar las pruebas unitarias y las validaciones de lint dentro de contenedores.

### Ejecutar el frontend en desarrollo

Desde la raíz del proyecto:

```bash
docker compose watch sotra-frontend-dev
```

El frontend quedará disponible en:

```text
http://localhost:3000
```

Este servicio utiliza `Dockerfile.dev` y permite trabajar con recarga de cambios durante el desarrollo.

Para detenerlo, utilizar:

```text
Ctrl + C
```

También puede detenerse desde otra terminal con:

```bash
docker compose stop sotra-frontend-dev
```

Para eliminar el contenedor y los recursos creados por Docker Compose:

```bash
docker compose down
```

---

## Ejecutar pruebas unitarias en Docker

Para ejecutar únicamente las pruebas del frontend dentro de un contenedor:

```bash
docker compose --profile tools run --rm sotra-frontend-test
```

Este servicio utiliza el entorno definido en `Dockerfile.dev`, ejecuta las pruebas y elimina el contenedor automáticamente al finalizar gracias a la opción `--rm`.

---

## Ejecutar lint en Docker

Para ejecutar únicamente ESLint dentro de un contenedor:

```bash
docker compose --profile tools run --rm sotra-frontend-lint
```

El servicio ejecutará:

```bash
npm run lint
```

y eliminará el contenedor al finalizar.

---

## Reconstruir las imágenes

Si se realizan cambios en los Dockerfiles, dependencias o configuración de los servicios, pueden reconstruirse las imágenes con:

```bash
docker compose build
```

O únicamente el servicio de desarrollo:

```bash
docker compose build sotra-frontend-dev
```

Después puede iniciarse nuevamente con:

```bash
docker compose watch sotra-frontend-dev
```
