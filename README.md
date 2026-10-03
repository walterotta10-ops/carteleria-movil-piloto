# Cartelería móvil – Piloto v1

Prototipo estático basado en el mockup maestro aprobado.

## Incluye
- Ingreso de número de local.
- Búsqueda por número de ítem.
- Base local con 30 productos de prueba.
- Mecánica 1: Antes y Ahora.
- Mecánica 2: Nx$.
- Mecánica 4: Sin Mecánica.
- Cartel con Local ingresado bajo el código de barras.
- Cola de impresión.
- Bloqueo de productos con estado Vencido.
- Impresión de hasta 4 carteles por hoja Carta mediante el diálogo de impresión del navegador.
- PWA básica instalable desde el navegador compatible.

## Datos de prueba
Los productos están en `data/products.json`. Para este piloto, la validación por fecha de campaña está desactivada en `app.js` (`enforceCampaignDates: false`) para que la muestra siga siendo utilizable. El estado `Vencido` sí bloquea la impresión.

## Despliegue recomendado: GitHub + Render Static Site
1. Crear un repositorio nuevo en GitHub, sugerencia: `carteleria-movil-piloto`.
2. Subir **el contenido de esta carpeta** a la raíz del repositorio.
3. En Render: **New + → Static Site**.
4. Conectar el repositorio.
5. Nombre sugerido del servicio: `carteleria-movil-piloto`.
6. Build Command: `echo "static ready"`
7. Publish Directory: `.`
8. Deploy.

Render entregará una URL pública para abrirla desde el celular.

## Nota para la siguiente etapa
Este piloto no se conecta a CID. La base real debe reemplazarse mediante un Excel/CSV autorizado. Antes de publicar una base completa con información operacional real, conviene definir si el acceso será público o autenticado.
