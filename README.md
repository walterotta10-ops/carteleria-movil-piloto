# Cartelería C&D · V57

## Seleccionar todos

En **Filtro Categorías**, el control **Seleccionar todos** aparece arriba de la tabla y marca todos los productos disponibles del resultado filtrado, aunque estén repartidos en varias páginas.

- La selección respeta Departamento, Categoría, Lista, Cartel Rojo/Amarillo y la búsqueda escrita.
- El checkbox del encabezado también selecciona el resultado completo.
- Cambiar de página o mostrar 10, 12 o 15 productos conserva la selección.
- Desmarcar el control quita toda la selección del filtro actual.
- El contador indica el total seleccionado. Enviar a cola incorpora todos los seleccionados, no solo los de la página visible.

En **Layout panorámico** se agrega **Seleccionar todo el departamento**, tanto al ver sus categorías como dentro de una categoría. Se puede enviar el departamento completo sin recorrer sus categorías una por una. Se conserva la selección de la categoría actual como alternativa.

Se seleccionan las fichas que ya cumplen las validaciones de la aplicación. Si hay datos inconsistentes se indica cuántos necesitan revisión. La ausencia de ítem no impide seleccionar un cartel que tenga UPC y sus demás datos correctos.

## Cargar en Cloudflare

1. Descomprime el ZIP.
2. Reemplaza el código del Worker actual por **CLOUDFLARE-CYD-V57-SELECCION-TOTAL.js**.
3. Conserva la base D1 actual y su vinculación **DB**. Publica el código.
4. Recarga la aplicación con **Ctrl + F5**. En el celular, cierra y vuelve a abrir la página.

Se mantienen claves, sesiones, colas, promociones, maestra colaborativa, lector de flejes y formatos de impresión de V56. No hace falta reinstalar el puente ni reactivar el PC maestro.

## Respaldo de GitHub

La interfaz web incorpora la misma corrección. Es compatible con el backend V56. Las páginas V56 y V55 abiertas conservan sus recursos durante la transición.

Para exportar el Worker: `node tools/exportar-v57.cjs`.

Pruebas con Node 22.13 o posterior: `npm install` y `npm test`.
