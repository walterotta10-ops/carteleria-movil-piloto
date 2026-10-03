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
