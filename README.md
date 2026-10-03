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
