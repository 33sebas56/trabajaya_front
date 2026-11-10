# Verificación de la revisión del frontend

## Ejecutado

- Comprobación sintáctica de server.mjs y todos los módulos de la interfaz.
- `npm test`: 18 pruebas contabilizadas por Node, 18 correctas, 0 fallos. Incluyen rutas por rol, destinos de retorno, ausencia de credenciales de prueba en archivos servidos, utilidades, servidor HTTP y proxy.
- El servidor Node se inició y se comprobó mediante HTTP local: archivos estáticos, módulos, cabeceras, bloqueo de archivos privados y reenvío de solicitudes a una API controlada.
- Chromium: 9 escenarios de interfaz con un doble controlado de la API. No es una prueba contra Spring Boot.
- Publicación, aumento de precio, aceptación, mensaje, avance de estados, confirmación y calificación.
- Registro de trabajador, confirmación de contraseña, inicio de sesión normal, errores, destino tras login y navegación por rol.
- Escritorio y móvil, sin desbordamiento horizontal en las pantallas comprobadas ni excepciones JavaScript no capturadas.
- Inspección visual de las capturas de portada y acceso en escritorio y móvil.

Para las pruebas visuales se cargaron los mismos módulos empaquetados solo para la prueba, sin navegación de red; la navegación HTTP directa de Chromium estaba restringida en el entorno. El empaquetado no forma parte de la ejecución normal del frontend.

## No verificado en esta revisión

- Spring Boot y la base SQL reales del usuario.
- Supabase Storage, PostgreSQL y SMTP externos.
- Pagos, verificación de identidad, seguridad de producción o migración de datos.

No se modificó el código del backend ni se eliminaron sus cuentas. Los contratos HTTP se conservaron, pero eso no sustituye una prueba integral en el equipo del usuario.

## Tamaño medido

HTML + CSS + módulos JavaScript del navegador + favicon: 150,623 bytes, aproximadamente 147.1 KiB sin compresión. No incluye respuestas de API, fotos de usuarios, memoria del navegador ni backend. No es una medición de velocidad de carga.

Las capturas son evidencia de pruebas, no imágenes usadas para construir la interfaz. Se omiten del ZIP para no aumentar su tamaño.

## Resultados visuales

- Landing desktop/mobile without horizontal overflow
- Client publishes and increases offer using API requests
- Worker accepts and sends message; assignment has frozen price
- Ordered progress, client confirmation, final review
- Profile, notifications, reports and mobile workspace render
- Normal blank login, error handling, return destination and role navigation
- Worker registration, password confirmation and unchanged API payload
- Access and help mobile layout without horizontal overflow
- No uncaught browser JavaScript exceptions
