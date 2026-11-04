# Cartelería C&D V61 · Entrega

El paquete incluye el Worker para publicar, el código fuente editable y la guía para operar la app. La carga de promociones, el alta de locales y la configuración de fleje y RF se gestionan desde la aplicación. La operación habitual funciona sin servicios de IA.

## Publicar en el Worker actual

1. Descarga un respaldo de la base D1 y conserva una copia de la versión que está publicada.
2. En Cloudflare, abre el Worker de Cartelería. Conserva la vinculación `DB` con la base D1 actual. Esta base guarda las promociones, los accesos, los aportes y las colas.
3. En **Settings → Variables and Secrets**, agrega `ADMIN_PASSWORD` como **Secret** y escribe la contraseña inicial de entrega. El valor distingue mayúsculas y minúsculas. Para rotarlo, actualiza ese mismo secreto. Las sesiones del Administrador volverán a pedir la contraseña.
4. Reemplaza el contenido del Worker por **CLOUDFLARE-CYD-V61-ENTREGA.js** y publica. La app prepara las tablas de esta versión al iniciar. La ruta `/health` debe devolver `version: v61`.
5. Desde un PC, ingresa como **Administrador** con la clave configurada. Verifica el catálogo, los locales existentes y la impresión Carta ¼. Después abre la app con un acceso de local para validar el flujo operativo.

## Operar la aplicación

| Tarea | Dónde se hace |
| --- | --- |
| Incorporar un local | **Administrador → Gestión de usuario → Agregar local**. Completa número y nombre del mercado y del local. El nombre se propone si el número de mercado ya existe. Al registrar el primer local de un mercado nuevo se crea también el mercado. |
| Consultar o cambiar claves de locales | **Gestión de usuario**. Un local nuevo entra con su número y una clave de cuatro dígitos completada con ceros a la izquierda. Ejemplo de formato `554` / `0554`. Las claves vigentes de la nómina anterior siguen en D1. |
| Cargar promociones | **Administrador → Carga de promociones**. Selecciona lista completa, actualización parcial o destacado semanal. Sube el archivo, revisa el resumen y confirma cuando el resultado sea el esperado. El archivo debe tener los encabezados que pide el tipo de carga. |
| Reactivar fleje o RF | **Administrador → Gestión de usuario → Funciones opcionales**. Marca la opción y pulsa **Guardar funciones**. Los locales deben recargar la app. Las dos opciones vienen desactivadas. |
| Imprimir desde PC | Usa la cola de impresión y selecciona **Impresora Tamaño 1/4 Carta**. Cartelería Manual mantiene el ingreso de productos y el escáner móvil de ítem o UPC. |

## Dirección pública y cuentas de entrega

**Cloudflare Workers y D1** ejecutan esta versión. **GitHub privado** puede guardar el código y el historial. Puedes publicar manualmente o conectar GitHub mediante Workers Builds. Configura los secretos en Cloudflare y conserva los respaldos de D1 fuera del repositorio.

**Render** es una opción si se decide migrar. El Render anterior era un intermediario del Worker. Para ejecutar la app con independencia de Cloudflare en Render, hay que adaptar el servidor y migrar los datos. Esta versión está preparada para ejecutar el Worker directamente.

Para una dirección como `carteleria.<dominio-del-cliente>`, agrega el subdominio en **Worker → Settings → Domains & Routes → Add → Custom Domain**. El dominio debe pertenecer al cliente y estar en una zona activa de Cloudflare. Prueba acceso, búsqueda, cola e impresión con el dominio nuevo antes de retirar la dirección anterior. Los usuarios tendrán que iniciar sesión en el nuevo dominio. Los ajustes de impresora guardados por el navegador pueden requerir configuración en ese dominio.

Si un local usa impresión Carta remota desde el móvil, actualiza el puente del PC con **puente-carta-automatico.ps1**. El script pide la dirección HTTPS de la app al iniciarse y admite el parámetro `-BaseUrl`. Ingresa la URL final y la clave del local. Para Carta ¼ impresa directamente desde el PC, usa el diálogo de impresión habitual.

Para entregar el producto, deja el dominio, el Worker, D1 y el repositorio bajo la cuenta u organización del cliente. El respaldo de D1 contiene datos de operación y accesos, por lo que requiere acceso restringido. Se puede generar con `npx wrangler d1 export NOMBRE_DB --remote --output=respaldo.sql`.

## Código fuente

- `src/app/` contiene la interfaz y los recursos de la aplicación.
- `src/worker-backend.mjs` contiene las rutas del servidor.
- `build.cjs` genera `worker-v61.mjs` con `node build.cjs`. Ejecuta `node --check worker-v61.mjs` para verificar su sintaxis.
- `wrangler.toml.example` muestra la configuración para automatizar el despliegue. Copia el ejemplo como `wrangler.toml`, completa el nombre del Worker existente y los datos de su D1. Conserva los demás ajustes del Worker, incluidos los disparadores programados y el dominio que tenga configurado. En Workers Builds usa `node build.cjs` como comando de compilación y `npx wrangler deploy` como comando de despliegue.

## Referencias

- [Configurar secretos del Worker](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Agregar un dominio personalizado](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- [Conectar GitHub a Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Exportar una base D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
- [Servicios web en Render](https://render.com/docs/web-services)
