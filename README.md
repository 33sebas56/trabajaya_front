# TrabajaYA: frontend

Interfaz para clientes, trabajadores independientes y administración. Conserva el diseño crema, terracota y verde salvia; elimina los accesos rápidos de demostración y utiliza el registro y el inicio de sesión normales.

## Iniciar

Requiere Node.js 22 o superior y el backend de TrabajaYA funcionando en el puerto 8080.

```powershell
node server.mjs
```

Abrir `http://localhost:5173`. No hay dependencias de ejecución que instalar ni es necesario `npm install`. También se puede ejecutar `iniciar-front.bat` en Windows.

No abrir index.html con doble clic: server.mjs sirve los archivos y reenvía `/api/*` al backend. No sustituye Spring Boot.

## Actualizar desde el frontend anterior

1. Detener solamente la terminal del frontend con Ctrl+C.
2. Conservar una copia de la carpeta anterior. Si tiene `.env`, conservarlo.
3. Extraer la nueva carpeta `trabajaya-frontend` y copiar dentro el `.env` propio, si existía.
4. Ejecutar `node server.mjs` desde la carpeta nueva. Recargar el navegador con Ctrl+F5.

No se requiere cambiar el backend ni su base. Los endpoints y los cuerpos de las solicitudes siguen siendo compatibles. No se borran cuentas, trabajos, imágenes ni mensajes.

## Cambios de esta revisión

- Inicio de sesión vacío, sin botones de cuentas precargadas ni credenciales en el código servido al navegador.
- Registro por tipo de usuario, confirmación de contraseña y campos con autocompletado apropiado.
- Sin indicadores de backend, modo local o prototipo en la interfaz.
- Navegación según el rol. Una sesión abierta no regresa por error al registro.
- Redirección al destino solicitado después de autenticarse, limitada a rutas internas permitidas.
- Precio inicial y presupuesto máximo sin valores precargados al publicar. El usuario decide ambos.
- Página de ayuda que explica precios, privacidad, finalización y pagos directos, sin prometer servicios inexistentes.
- Mensajes comprensibles cuando el servicio no responde; detalles técnicos no se muestran en errores 5xx.
- Se conserva la nota de que las habilidades son autodeclaradas y de que no se procesan pagos.

Los datos que ya existan en SQL se siguen mostrando. Quitar los botones de ejemplo NO elimina cuentas o publicaciones de prueba. Consulta `docs/CONECTAR_SERVICIOS.md` para desactivar su creación y preparar un entorno separado sin borrar el anterior.

## Cómo está construido

No es una imagen con zonas clicables. El navegador construye elementos HTML, aplica CSS y ejecuta JavaScript para interactuar con Spring Boot. Los iconos son SVG en código. Las capturas de pantalla son resultados de las pruebas, no piezas de la aplicación.

```text
index.html           Documento inicial
styles.css           Diseño, paleta y adaptación a celular
src/app.js           Navegación y estructura de la aplicación
src/routing.js       Reglas de navegación por rol y títulos
src/api.js           Solicitudes HTTP, sesión e imágenes autorizadas
src/ui.js            Botones, iconos, formularios, avisos y utilidades
src/account.js       Acceso, registro y perfiles
src/pages.js         Portada, paneles, oportunidades y notificaciones
src/jobs.js          Publicación, precio, estados y chat
src/admin.js         Administración
src/help.js          Información de uso
server.mjs           Servidor local y proxy de la API
```

No utiliza React, Vue, Bootstrap ni una imagen que represente toda la pantalla. Se pueden reutilizar sus colores, componentes de interfaz y utilidades, adaptando los formularios y la API a otro proyecto. No deben reutilizarse sin revisar las reglas de negocio y los permisos.

## Configuración del frontend

Copiar `.env.example` a `.env` solo cuando se quiera cambiar la configuración:

```text
PORT=5173
HOST=127.0.0.1
API_TARGET=http://127.0.0.1:8080
```

Este archivo no lleva contraseñas SQL, claves Supabase ni SMTP. Reiniciar `server.mjs` después de cambiarlo. El servidor solo sirve una lista permitida de archivos públicos; no expone documentos, tests ni `.env`.

## Pruebas

```powershell
npm run check
npm test
```

Las pruebas visuales son opcionales y se explican en `tests/visual/README.md`. Usan un doble de API: no verifican Spring ni proveedores externos. No se cargan durante el uso normal de la aplicación.

Consulta `docs/VERIFICACION.md` para conocer exactamente qué se ejecutó.

## Alcance y siguiente fase

La interfaz está preparada para la API existente, pero eso no convierte la aplicación automáticamente en un servicio listo para abrir al público. Las claves, respaldos, monitoreo, políticas de privacidad y operación, verificaciones y pruebas integrales con servicios reales requieren trabajo adicional. No hay pagos en línea ni verificación documental de identidad.
