# Firmeza — Tienda para clientes

SPA Angular 18 para que los clientes de Firmeza puedan crear una cuenta, iniciar sesión, consultar productos disponibles, armar un carrito, completar una compra y recibir o descargar el comprobante PDF.

La interfaz administrativa anterior también está disponible en esta SPA en `/admin/login`, separada del storefront cliente. Usa sesión por cookie y conserva dashboard, productos, clientes, ventas y reportes; el backend exige el rol `Administrador` en esas rutas.

## Desarrollo local

1. Configura y ejecuta la API y PostgreSQL siguiendo el README del backend. El host requiere una clave JWT privada (`Jwt:SigningKey`, mínimo 32 bytes). La configuración de Gmail se hace con secretos, no en el frontend.
2. Desde esta carpeta ejecuta:

   ```bash
   npm ci
   npm start
   ```

3. Abre `http://localhost:4200`. El proxy de desarrollo envía las solicitudes `/api` a `http://localhost:5080`.

## Flujos

- Registro de cliente y acceso automático a la tienda.
- Inicio de sesión en `/api/auth/customer/login`; la API entrega un JWT con el rol `Cliente`.
- La tienda y el acceso conservan la identidad visual Firmeza: tipografía Inter, paleta azul y tema claro/oscuro persistente.
- El token se conserva en `sessionStorage` solo durante la sesión de la pestaña. El interceptor lo envía como `Authorization: Bearer`; al expirar, se elimina y la aplicación redirige al inicio de sesión.
- El catálogo solo consulta `GET /api/client/catalog`. El carrito calcula subtotal, impuesto según la tasa configurada por la API y total; el servidor vuelve a validar precios, disponibilidad y stock antes de registrar la venta.
- La tienda cliente tiene inicio en `/`, catálogo completo en `/products` y carrito en `/cart`. El menú de productos es desplegable y el ícono del carrito permanece accesible desde el encabezado.
- El inicio destaca productos disponibles y con pocas unidades. El contrato actual del catálogo no contiene precio anterior ni porcentaje de descuento; por eso el carrito indica cuando no hay promociones aplicadas y no inventa rebajas.
- El perfil autenticado está disponible en `/profile`, con datos personales protegidos, actividad reciente y accesos a métodos de pago y reclamaciones; estas dos funciones muestran su estado real y no simulan datos. El historial de pedidos está en `/purchases`, con descarga del comprobante PDF.
- Los importes del storefront y del panel administrativo se muestran en pesos colombianos (COP).
- Las imágenes opcionales se configuran por producto desde el panel administrativo mediante una URL HTTPS; la API las devuelve en el catálogo público de clientes.
- El comprobante PDF se obtiene desde una ruta del cliente y la API verifica que la venta pertenezca a la cuenta autenticada.
- La tienda cliente no incluye ni consume rutas de dashboard, inventario administrativo, gestión de usuarios, roles, clientes administrativos o reportes.
- El módulo `/admin` consume las rutas administrativas únicamente después de autenticarse con una cuenta del rol `Administrador`; sus rutas y sesión son independientes del acceso JWT de clientes.

El almacenamiento web puede ser leído por JavaScript de la misma página; por ello, usa HTTPS en despliegue y evita introducir scripts de terceros no confiables. El token no se escribe en `localStorage`.

## Correo electrónico

La API envía el comprobante y la notificación de registro por SMTP. El frontend comunica claramente si el envío tuvo éxito; si SMTP no está configurado o falla, el pedido no se pierde y el PDF sigue disponible para descargar. Consulta las instrucciones del backend para Gmail y contraseñas de aplicación. Las credenciales SMTP nunca deben colocarse en Angular.

## Pruebas y compilación

```bash
npm run build
npm test -- --watch=false
```

Las pruebas unitarias verifican los flujos de autenticación de cliente y administrador, el cambio de tema y los cálculos y límites de stock del carrito.
