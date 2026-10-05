# Nuevo C&D Cartelería — v7 cartel maestro

Versión estática, sin backend, sin usuario/PIN y sin servicios pagados.

Cambios de esta versión:
- Mantiene los 30 ítems del piloto.
- Mantiene logo SuperBodega aCuenta en el inicio.
- Previsualización de cada ítem reconstruida con la estructura del cartel maestro C&D: precio, medio de pago, antes/ahorro o barra Nx$, producto, marca, precio por unidad, código de barras, vigencia y datos inferiores.
- La vista en pantalla no agrega el gran aire superior de impresión.
- Impresión A4 2x2: cada cartel conserva el aire superior del maestro y el bloque de contenido queda desplazado hacia abajo, como en la referencia C&D.
- Sin encabezados ni pies propios de la aplicación.

Nota: en Chrome, para que el navegador tampoco agregue fecha/URL/número de página, desactivar “Encabezados y pies de página” en Más ajustes.


## v8 — alineación con hojas maestras
- Precio y bloque de producto alineados hacia la derecha del cuadrante.
- Texto "pagando con todo medio de pago" y vigencia ampliados.
- Mecánica Ahora Más Barato: franja negra `Normal / Ahorro`.
- Mecánica Nx$: franja negra `P. unitario / Ahorro`.
- Segunda fila subida 20 mm sin mover la primera.
- Márgenes laterales protegidos para no salir del A4.
- La cola admite más de 4 carteles: cada grupo de 4 genera una nueva hoja A4.


## v10
La impresión usa ahora la misma geometría interna de la miniatura/cola; solo escala y posiciona el cartel completo dentro del A4. No se modifica navegación ni catálogo.


## v11 — impresión = misma geometría que la cola
- La impresión utiliza el mismo lienzo maestro 228×216 px de la miniatura de la cola.
- No se vuelven a calcular posiciones internas al imprimir; se escala el cartel completo.
- La franja negra promocional se dibuja con SVG real para que aparezca en la vista previa de impresión.
- Se mantiene la posición inferior de código/barra/datos que ya había quedado correcta.
- Se agregan parámetros `?v=11` a CSS/JS para evitar caché del navegador/Render.


## v12 — impresión basada en hojas maestras
- Se deja de escalar la miniatura para imprimir.
- Plantilla física A4 en mm, basada en las tres hojas maestras.
- Franja promocional ancha, producto/marca/unidad más grandes y bloque inferior extendido.
- Signo $ más pequeño que el número en precio normal/oferta.
- Segunda fila sube 9 mm respecto de la primera.


## v13 — cambios solicitados
- Ajuste fino de las tipografías secundarias de impresión; números grandes sin cambios.
- “Volver a inicio” pasa a la misma línea de “Ingresar ítem”.
- Vista PC más compacta.
- Botón verde “Imprimir cola” al lado de “Cola de impresión”.
- La cola permite seguir agregando carteles; la impresión se pagina automáticamente de 4 en 4.
- “Borrar toda la cola” reemplaza a “Buscar otro ítem” y pide confirmación.
- Al agregar un cartel, el campo de ítem, el resultado y la previsualización se limpian automáticamente y el cursor vuelve al campo de ingreso.
- Recursos cacheados con versión v13.


## v14 — Borrar toda la cola al final
- Se quitó “Borrar toda la cola” de la previsualización del producto.
- El botón ahora aparece al final de todos los carteles de la cola de impresión.
- Ocupa todo el ancho, en rojo con letras blancas.
- Mantiene confirmación antes de vaciar la cola.
- El botón verde “Imprimir cola” permanece arriba junto al título.
- Caché actualizado a v14.


## v15 — corrección vertical de impresión

- Único cambio visual de impresión: el contenido completo de cada cartel se desplaza 10 mm hacia arriba dentro de su cuadrante A4.
- No cambia tamaño, tipografía, precio, franja promocional, alineación horizontal, cola, catálogo ni navegación.
- Se actualiza el parámetro de caché del CSS a v15 para asegurar que el navegador cargue la corrección.


## v16 — selección de impresora
- “Imprimir cola” abre una pantalla intermedia con dos opciones.
- Impresora Tamaño Carta: conserva exactamente la configuración de impresión actual.
- Impresora Portátil (RF): ruta separada, todavía sin configuración de impresión.
- La ruta RF no modifica la cola.
- Se puede volver a la cola desde ambas pantallas.
- Caché actualizado a v16.


## v17 — Puente RF Zebra (piloto)
- Mantiene intacta la impresión Tamaño Carta de v15/v16.
- Agrega pantalla RF para seleccionar 1 cartel, guardar IP de impresora por local y enviar ZPL de 58 mm.
- Incluye `rf-print-bridge.ps1`, un puente local Windows que recibe la orden desde la web y la reenvía a Zebra TCP/9100.
- Esta etapa prueba conectividad real App → PC → Zebra. El diseño RF se ajustará después de validar impresión física.


## v18 - Cartel RF en 2 flejes
- Mantiene intacta la impresion Tamano Carta.
- RF: ancho util 58 mm.
- Cada cartel RF se imprime como 2 flejes consecutivos de 35 mm de alto.
- Fleje superior: promo/precio grande.
- Fleje inferior: descripcion, marca, gramaje, mecanica, item/local y codigo de barras.
- La separacion fisica sugerida entre ambos flejes al montar el cartel es 5 mm.
- El puente local y TCP 9100 se mantienen sin cambios funcionales.
