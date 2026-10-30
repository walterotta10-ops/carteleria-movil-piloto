# Cartelería C&D · V54 R1

La revisión R1 corrige la apertura del usuario maestro: los scripts y la maestra manual se cargan con la autorización de la sesión. Se mantiene la validación de acceso en el servidor. Se añadió una prueba que abre el HTML y ejecuta todos los scripts reales para local, mercado y maestro, incluyendo el ingreso y la recuperación de sesión maestra.

Esta versión agrega contraseña de cuatro dígitos y Gestión de usuario. Conserva el catálogo V53 R4, las promociones, la maestra de cartelería manual, el layout panorámico y los formatos de impresión.

## Acceso y permisos

| Acceso | Contraseña inicial | Gestión permitida |
| --- | --- | --- |
| Local 622 | `0622` | Abrir la app y cambiar la contraseña de su propio local con la clave actual. |
| Cualquier otro local | Su número completado a cuatro dígitos con ceros a la izquierda. Ejemplo: local 5 → `0005`. | Solo su local y su cola. |
| Jefe de mercado 814 | `0814` | Ver y cambiar las claves de los locales de su mercado, y cambiar su propia contraseña. |
| Otros jefes de mercado | Código de mercado completado a cuatro dígitos. | Solo los locales asignados a ese mercado. |
| Usuario maestro | Conserva la activación privada del PC. | Ver y cambiar las claves de los 128 locales y 11 jefes de mercado. |

Cada jefe de mercado dispone de la nueva opción **Gestión de usuario** en el inicio. Cada local dispone de **Mi contraseña**. El maestro encuentra **Gestión de usuario** en su menú lateral, con filtros por tipo de acceso, mercado y nombre o código.

El número de local sigue identificando el acceso y sigue apareciendo en los carteles de ese local. La impresión desde el usuario maestro continúa sin número de local. No se agrega Product Number a los carteles y los productos sin ítem mantienen la identificación por UPC.

Las claves iniciales permiten comenzar la transición; pueden cambiarse desde la nueva gestión. Las claves elegidas se guardan en la D1 actual y se conservan después de volver a publicar el código. Cambiar una clave cierra las sesiones anteriores de esa cuenta. El cambio de clave propia mantiene abierta la sesión del equipo que la cambió.

## Cargar en Cloudflare

1. Descomprime `CYD-V54-ACTUALIZACION-CLOUDFLARE.zip`.
2. Abre el Worker actual `carteleria-puente-carta` y reemplaza su código por **CLOUDFLARE-CYD-V54-ACCESOS-R1.js**.
3. Conserva la vinculación existente a la D1 con nombre `DB`. No crees otra base ni borres la existente.
4. Guarda y publica. No hay SQL que ejecutar manualmente: las tablas nuevas se crean al primer acceso.
5. Recarga la página de la app y prueba local **622**, contraseña **0622**.

El respaldo de GitHub incluye la interfaz V54 y el servidor que usa la misma D1 a través del Worker. El servidor espera que Cloudflare esté en V54 antes de permitir accesos: si muestra “Primero carga el archivo V54 en Cloudflare”, completa la publicación del paso anterior y recarga después de unos segundos. Las claves funcionan tanto al abrir la app en Cloudflare como en la web de Render.

## Puente automático del PC

Si el local usa `puente-carta-automatico.ps1`, reemplázalo por el archivo V54 incluido y vuelve a abrirlo. Pedirá el local configurado y su contraseña. No guarda la contraseña en el archivo de configuración. Si la sesión termina o el jefe cambia la clave, volverá a pedirla.

La impresión normal desde la cola del navegador no necesita instalar este puente. No se cambió el puente local RF ni la maqueta Carta v23.

## Respaldo y pruebas

`cyd-v54-bundle.cjs` contiene el Worker completo y todos los recursos de la app, comprimidos. Es la fuente completa de esta versión, también para los recursos históricos que existen en la raíz del repositorio. `server.js` sirve únicamente el acceso público y envía todas las operaciones y recursos protegidos al Worker.

Para reconstruir exactamente el archivo de Cloudflare:

```sh
node tools/exportar-v54.cjs
```

Para ejecutar las pruebas de servidor y permisos se necesita Node 22.13 o posterior, con `node:sqlite`:

```sh
npm install
npm test
```

Se probaron: 128 locales y 11 mercados; claves con ceros iniciales; alcance por mercado; claves visibles según rol; denegación sin sesión; protección CSRF y de origen; cambio y revocación de sesiones; límite de intentos; persistencia tras recargar el Worker; catálogo completo; colas con UPC sin ítem; trabajo de impresión y proxy de Render. El archivo Worker también pasó revisión de sintaxis y `checkJs` con TypeScript 5.9.3.

No se incluyen contraseñas elegidas, sesiones, bases de datos ni el archivo privado de activación del maestro en este respaldo. La prueba física de impresora y la ejecución del puente PowerShell en Windows deben comprobarse en el PC del local después de cargar la actualización.
