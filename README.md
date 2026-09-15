# sotra-frontend

Para usar el frontend con Docker hay dos pasos:

1. **Construir la imagen**

```bash
docker build --build-arg API_URL=http://localhost:4000 -t sotra-frontend:local .
```

También se puede usar:

```bash
docker compose build
```

En ese caso, la dirección de la API (`API_URL`) se toma del archivo `.env`.

2. **Levantar el contenedor**

```bash
docker run -d \
  --name sotra-frontend-frontend-1 \
  --network sotra-frontend_default \
  -p 3100:3000 \
  sotra-frontend:local
```

Después se puede acceder al frontend por el **puerto 3100**.

### Importante

La dirección de la API (`API_URL`) se guarda dentro del frontend cuando se construye la imagen.

Por ejemplo, si se construye con:

```text
API_URL=http://localhost:4000
```

el frontend va a usar esa dirección.

Si después cambia la IP, dominio o puerto de la API, **no alcanza con reiniciar el contenedor**. Hay que volver a construir la imagen del frontend con la nueva `API_URL`.


# Detalles de la nueva configuracion de Docker

El frontend puede ejecutarse mediante Docker tanto en modo producción como en modo desarrollo. También se dispone de contenedores específicos para ejecutar pruebas y validaciones de lint sin necesidad de instalar las dependencias directamente en el sistema anfitrión.

### Construir la imagen de producción

Desde la raíz del proyecto:

```bash
docker build --tag sotra-frontend:prod .
```

Este comando construye la imagen Docker del frontend utilizando la configuración de producción y le asigna el nombre `sotra-frontend` con la etiqueta `prod`.

### Ejecutar el frontend en producción

```bash
docker run -d -p 3000:3000 --name sotra-frontend-prod sotra-frontend:prod
```

La aplicación quedará disponible en:

```text
http://localhost:3000
```

El parámetro `-d` ejecuta el contenedor en segundo plano. Para visualizar la consola y los logs en tiempo real, puede omitirse:

```bash
docker run -p 3000:3000 --name sotra-frontend-prod sotra-frontend:prod
```

### Detener el contenedor de producción

```bash
docker stop sotra-frontend-prod
```

Para volver a iniciar el mismo contenedor posteriormente:

```bash
docker start sotra-frontend-prod
```


## Desarrollo con Docker Compose

### Iniciar el frontend en modo desarrollo

```bash
docker compose watch sotra-frontend-dev
```

Este modo observa los cambios realizados en el código fuente y los sincroniza con el contenedor, permitiendo trabajar en desarrollo sin reconstruir manualmente la imagen ante cada modificación.

Para detener la ejecución puede utilizarse `Ctrl + C`.


## Pruebas

### Ejecutar los tests dentro de Docker

Desde la raíz del proyecto:

```bash
docker compose --profile tools run --rm sotra-frontend-test
```

Este comando ejecuta las pruebas del frontend dentro de un contenedor dedicado.

La opción `--rm` elimina automáticamente el contenedor utilizado una vez finalizada la ejecución.


## Lint

### Ejecutar ESLint dentro de Docker

Desde la raíz del proyecto:

```bash
docker compose --profile tools run --rm sotra-frontend-lint
```

Este comando ejecuta las validaciones de lint del proyecto dentro de un contenedor dedicado y elimina el contenedor al finalizar.


## Comandos principales

| Acción                                         | Comando                                                                     |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| Construir imagen de producción                 | `docker build --tag sotra-frontend:prod .`                                  |
| Ejecutar producción                            | `docker run -d -p 3000:3000 --name sotra-frontend-prod sotra-frontend:prod` |
| Detener producción                             | `docker stop sotra-frontend-prod`                                           |
| Iniciar nuevamente producción                  | `docker start sotra-frontend-prod`                                          |
| Ejecutar desarrollo con observación de cambios | `docker compose watch sotra-frontend-dev`                                   |
| Ejecutar tests                                 | `docker compose --profile tools run --rm sotra-frontend-test`               |
| Ejecutar lint                                  | `docker compose --profile tools run --rm sotra-frontend-lint`               |
