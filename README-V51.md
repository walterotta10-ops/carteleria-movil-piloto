C&D V51 — CIERRE DE EDICION — 26/10/2026

Esta version parte de la V50 aprobada. Incluye:
- Correccion de impresion: mas separacion entre franja negra Normal/Ahorro y descripcion para carteles con ahorro y Nx.
- Ajuste exclusivo de la posicion de descripcion, +3 mm por fila; sin modificar precio, barra, barcode o los carteles normales.
- Etiqueta visible v51 SBA (antes indicaba v39 SBA).
- Conserva Carteleria Manual, maestra de 12.003 items, precios exclusivos del usuario, campanas, cola compartida D1 y puente celular-PC.
- Mantiene el nombre Impresora Tamano 1/4 Carta.

INSTALACION EN CLOUDFLARE
1. Guardar una copia del Worker V50 que esta funcionando.
2. Editar carteleria-puente-carta, sustituir el contenido completo por el archivo .js de este ZIP.
3. Deploy y recarga forzada en PC/celular.
4. Imprimir una hoja de prueba; verificar que franja negra no toque descripcion.
No cambiar ni borrar D1. No instalar el ZIP de GitHub como Worker.

GITHUB
El archivo JS contiene el Worker COMPLETO que se desplegara en Cloudflare.
Subir este mismo JS a GitHub para mantener un respaldo exacto de la V51; actualizar README del repositorio si corresponde.
El ZIP de GitHub no reemplaza automaticamente los archivos historicos de un repositorio anterior ni actualiza Cloudflare por si solo.

VALIDACIONES: sintaxis Node.js; contenido y cantidad de articulos; integridad del paquete.
No se ha validado una hoja impresa fisicamente con V51.
