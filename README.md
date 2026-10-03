# Cartelería móvil piloto v2

Prototipo móvil de cartelería basado en el mockup maestro y en la base de 30 productos de prueba.

## Ajustes v2

- Se puede cambiar de local desde búsqueda, vista de producto, cola o tocando `Local XXX` en el encabezado.
- El cartel móvil usa la misma geometría relativa de la hoja de impresión para evitar diferencias entre previsualización y papel.
- La impresión pasa de Carta a **A4** y queda dividida en cuatro posiciones exactas de **105 × 148,5 mm**, como la referencia de C&D.
- Se eliminan márgenes propios de la aplicación en impresión.
- La hoja no agrega títulos, fechas, URL ni numeración desde el contenido de la aplicación.
- Se corrigió el desborde de los carteles con mecánica Nx$.

## Nota sobre Chrome

La fecha/hora, nombre de la página, URL y número de hoja que Chrome puede mostrar en el borde de la vista previa son **encabezados y pies del navegador**, no forman parte del cartel. La hoja ya solicita margen 0. Si Chrome los mantiene activos, en `Más ajustes` desactiva una sola vez `Encabezados y pies de página`. Esa preferencia normalmente queda recordada por el navegador.

## Despliegue

Sitio estático. Render puede usar el `render.yaml` incluido en la raíz.
