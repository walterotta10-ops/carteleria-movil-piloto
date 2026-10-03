# Nuevo C&D Cartelería — versión estática

Versión sin backend, sin usuario, sin PIN y sin servicio de sincronización.

## Flujo
1. Ingresar únicamente el número de local.
2. Buscar un ítem por código.
3. Previsualizar el cartel sin el espacio superior de impresión.
4. Agregar a la cola.
5. Imprimir en A4, 4 posiciones (2×2).

## Importante
- La cola se guarda solo en el mismo navegador/dispositivo mediante localStorage.
- No existe sincronización entre celular y computador.
- El `render.yaml` define solamente un sitio estático.
- La aplicación no necesita Node, servidor ni base de datos.

## Catálogo
Se mantienen los 30 códigos y nombres definidos para el piloto.
Como en la información disponible no están confirmados los precios de todos los productos, la app evita inventarlos:
- 646205: 10x$1.790
- 711195: $6.350
- 673851: $7.390
Los demás ítems aparecen como encontrados pero con precio pendiente y no se habilita su impresión hasta completar el dato real.

## Impresión
La vista de pantalla es compacta. El "aire" superior se aplica únicamente al momento de imprimir.
La hoja utiliza A4 vertical con cuatro cuadrantes de 105 × 148,5 mm.
Para una salida totalmente limpia, si Chrome agrega fecha/URL/página, desactivar "Encabezados y pies de página" en el diálogo de impresión.
