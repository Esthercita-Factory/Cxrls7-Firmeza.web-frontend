# Firmeza Angular

Panel administrativo de Angular 18 conectado a la API REST de ASP.NET Core. Incluye autenticación, dashboard, catálogo de productos, clientes, ventas y reportes. El menú lateral se puede plegar con el botón hamburguesa y conserva el estado; el tema claro/oscuro también se recuerda al volver a entrar.

## Requisitos

- Node.js compatible con Angular 18 y npm.
- .NET 8 y PostgreSQL según las instrucciones del proyecto backend.

## Desarrollo local

1. Inicia PostgreSQL y el backend ASP.NET Core en `http://localhost:5080`; el backend aplica las migraciones al arrancar. Consulta el README del backend para configurar la base de datos y el administrador.
2. En esta carpeta ejecuta:

   ```bash
   npm ci
   npm start
   ```

3. Abre `http://localhost:4200`. El servidor de desarrollo reenvía `/api` a `http://localhost:5080`.

La autenticación usa la cookie de ASP.NET Identity y protección antifalsificación con token CSRF; el frontend no guarda credenciales ni tokens en `localStorage`. Para producción, publica el frontend detrás del mismo origen que la API (por ejemplo, con un reverse proxy) y sirve el tráfico exclusivamente por HTTPS. El proxy incluido es solo para desarrollo local.

## Prueba dockerizada

Desde la carpeta del backend, ejecuta:

```bash
docker compose up --build
```

Este stack levanta Angular detrás de Nginx, la API .NET y un PostgreSQL local de prueba. No configura ni requiere conectarse a una base de datos externa. Abre `http://localhost:4200`; Nginx sirve Angular y reenvía `/api` a la API dentro de la red Docker. La API crea el esquema mediante migraciones y carga la cuenta administrativa configurada por Compose al iniciar.

Para detener los servicios conserva los datos del PostgreSQL local:

```bash
docker compose down
```

Para borrar también los datos de prueba y empezar con una base vacía:

```bash
docker compose down -v
```

Ese último comando elimina los volúmenes de PostgreSQL y recibos de este stack. Úsalo solo si no necesitas conservar esos datos.

## API usada

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/auth/csrf` | Obtener token antifalsificación |
| POST | `/api/auth/login` | Iniciar sesión administrativa |
| GET | `/api/auth/me` | Consultar la sesión actual |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET/POST/PUT/DELETE | `/api/products` | Catálogo e inventario |
| GET/POST/PUT/DELETE | `/api/customers` | Directorio de clientes |
| GET/POST | `/api/sales` | Historial y registro de ventas |
| GET | `/api/sales/{id}/receipt` | Recibo PDF |
| GET | `/api/dashboard` | Indicadores y ventas recientes |
| GET | `/api/reports/{products\|customers\|sales}` | Exportar Excel o PDF |
| GET/POST | `/api/reports/import/...` | Plantilla e importación Excel |

Todas las rutas, excepto `csrf` y `login`, requieren una sesión del rol Administrador. Las operaciones que modifican datos exigen el token CSRF enviado en `X-CSRF-TOKEN`.

## Build y pruebas

```bash
npm run build
npm test -- --watch=false
```
