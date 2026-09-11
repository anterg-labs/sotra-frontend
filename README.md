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
